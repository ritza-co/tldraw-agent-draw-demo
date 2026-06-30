import { ExecutionContext } from '@cloudflare/workers-types'
import { WorkerEntrypoint } from 'cloudflare:workers'
import { AutoRouter, cors, error, IRequest } from 'itty-router'
import { Environment } from './environment'
import { stream } from './routes/stream'
import { transcribe } from './routes/transcribe'

const { preflight, corsify } = cors({
	origin: '*',
	allowHeaders: 'Content-Type, x-mistral-api-key, x-anthropic-api-key, x-openai-api-key, x-google-api-key, x-openrouter-api-key',
})

const router = AutoRouter<IRequest, [env: Environment, ctx: ExecutionContext]>({
	before: [preflight],
	finally: [corsify],
	catch: (e) => {
		console.error(e)
		return error(e)
	},
}).post('/stream', stream).post('/transcribe', transcribe)

export default class extends WorkerEntrypoint<Environment> {
	override fetch(request: Request): Promise<Response> {
		return router.fetch(request, this.env, this.ctx)
	}
}

// Make the durable object available to the cloudflare worker
export { AgentDurableObject } from './do/AgentDurableObject'
