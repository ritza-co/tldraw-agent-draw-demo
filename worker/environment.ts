// On the no-cloudflare branch the backend is a plain Node server, so there is no
// Durable Object binding. AgentService only needs the provider API keys; these are
// read from process.env in server/server.ts and passed in as this object.
export interface Environment {
	OPENAI_API_KEY: string
	ANTHROPIC_API_KEY: string
	GOOGLE_API_KEY: string
	MISTRAL_API_KEY: string
	OPENROUTER_API_KEY: string
}
