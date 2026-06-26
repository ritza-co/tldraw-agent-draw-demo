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
 * fallback. Provider API keys come from process.env (see .env.server.example).
 */
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastify from 'fastify'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentService } from '../worker/do/AgentService'
import { Environment } from '../worker/environment'
import { AgentPrompt } from '../shared/types/AgentPrompt'

const PORT = Number(process.env.PORT) || 5858
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '../dist')

const env: Environment = {
	OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
	ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
	GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? '',
	MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? '',
	OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
}

const service = new AgentService(env)

// bodyLimit leaves room for the base64 image context the client sends with prompts
const app = fastify({ bodyLimit: 16 * 1024 * 1024 })
await app.register(cors, { origin: '*' })
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

	const buffer = await file.toBuffer()
	const outForm = new FormData()
	outForm.append('file', new Blob([buffer], { type: file.mimetype }), file.filename || 'audio.webm')
	outForm.append('model', 'voxtral-mini-transcribe-2507')

	const mistralResponse = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}` },
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
