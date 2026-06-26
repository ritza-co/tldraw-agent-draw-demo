/**
 * Plain Node backend for the tldraw agent draw demo (no-cloudflare branch).
 *
 * Replaces the Cloudflare Worker + Durable Object. The Durable Object never held
 * any persistent state (it only coordinated one in-memory room), so we drop it
 * entirely and call AgentService directly. The two routes the client hits are
 * reimplemented here on Fastify:
 *
 *   POST /stream      -> stream agent actions as Server-Sent Events
 *   POST /transcribe  -> forward an audio blob to Mistral Voxtral, return text
 *
 * Everything else is the static client bundle served from ../dist with an SPA
 * fallback.
 *
 * Provider API keys are bring-your-own: each request carries the user's keys as
 * `x-<provider>-api-key` headers (stored only in their browser). The server uses
 * them for that one request and never stores or logs them. A server-side key in
 * .env.server is optional and only acts as a fallback when no header is sent.
 */
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import { FastifyRequest } from 'fastify'
import { AgentService } from '../worker/do/AgentService'
import { Environment } from '../worker/environment'
import { AgentPrompt } from '../shared/types/AgentPrompt'

const PORT = Number(process.env.PORT) || 5858
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '../dist')

// Server-side fallback keys, if any are configured in .env.server. On the public
// demo these are intentionally blank — visitors bring their own key (see below).
const serverEnv: Environment = {
	OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
	ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
	GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? '',
	MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? '',
	OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
}

// Build the key set for one request: the user's own keys (sent as headers from
// their browser, where they are the only copy) take priority over any server
// fallback. These are used transiently for this request only and never stored
// or logged.
function envFromRequest(request: FastifyRequest): Environment {
	const header = (name: string) => {
		const value = request.headers[name]
		return (Array.isArray(value) ? value[0] : value) ?? ''
	}
	return {
		ANTHROPIC_API_KEY: header('x-anthropic-api-key') || serverEnv.ANTHROPIC_API_KEY,
		OPENAI_API_KEY: header('x-openai-api-key') || serverEnv.OPENAI_API_KEY,
		GOOGLE_API_KEY: header('x-google-api-key') || serverEnv.GOOGLE_API_KEY,
		OPENROUTER_API_KEY: header('x-openrouter-api-key') || serverEnv.OPENROUTER_API_KEY,
		MISTRAL_API_KEY: header('x-mistral-api-key') || serverEnv.MISTRAL_API_KEY,
	}
}

// bodyLimit leaves room for the base64 image context the client sends with prompts
const app = fastify({ bodyLimit: 16 * 1024 * 1024 })
await app.register(cors, {
	origin: '*',
	allowedHeaders: [
		'Content-Type',
		'x-anthropic-api-key',
		'x-openai-api-key',
		'x-google-api-key',
		'x-openrouter-api-key',
		'x-mistral-api-key',
	],
})
await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } })

// Stream agent actions as SSE. We write to reply.raw directly because the
// response is an open-ended event stream, not a single buffered body.
app.post('/stream', async (request, reply) => {
	const prompt = request.body as AgentPrompt

	reply.hijack()
	reply.raw.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		Connection: 'keep-alive',
		'X-Accel-Buffering': 'no',
	})

	const service = new AgentService(envFromRequest(request))

	try {
		for await (const change of service.stream(prompt)) {
			reply.raw.write(`data: ${JSON.stringify(change)}\n\n`)
		}
	} catch (error: any) {
		console.error('Stream error:', error)
		reply.raw.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
	} finally {
		reply.raw.end()
	}
})

// Forward an uploaded audio blob to Mistral's Voxtral transcription model. The
// Mistral key stays server-side and never reaches the browser.
app.post('/transcribe', async (request, reply) => {
	const file = await request.file()
	if (!file) {
		return reply.code(400).send({ error: 'No file provided' })
	}

	const mistralKey = envFromRequest(request).MISTRAL_API_KEY
	if (!mistralKey) {
		return reply.code(400).send({ error: 'No Mistral API key. Add one in the API keys panel.' })
	}

	const buffer = await file.toBuffer()
	const outForm = new FormData()
	// Wrap in Uint8Array so the type satisfies BlobPart under the DOM lib.
	outForm.append(
		'file',
		new Blob([new Uint8Array(buffer)], { type: file.mimetype }),
		file.filename || 'audio.webm'
	)
	outForm.append('model', 'voxtral-mini-transcribe-2507')

	const mistralResponse = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${mistralKey}` },
		body: outForm,
	})

	if (!mistralResponse.ok) {
		const errorText = await mistralResponse.text()
		return reply.code(mistralResponse.status).type('application/json').send(errorText)
	}

	const data = (await mistralResponse.json()) as { text?: string }
	return reply.send({ text: data.text ?? '' })
})

// Static client bundle + SPA fallback for client-side routes.
await app.register(fastifyStatic, { root: DIST })
app.setNotFoundHandler((request, reply) => {
	if (request.method === 'GET') {
		return reply.sendFile('index.html')
	}
	return reply.code(404).send({ error: 'Not found' })
})

app.listen({ port: PORT, host: '0.0.0.0' })
	.then(() => console.log(`tldraw-agent-draw-demo listening on :${PORT}`))
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
