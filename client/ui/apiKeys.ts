/**
 * Bring-your-own-key storage. Keys are kept ONLY in the visitor's browser
 * (localStorage) and attached as request headers on each /stream and /transcribe
 * call. The server reads them from the header to make the provider request and
 * never stores or logs them — there is no shared server-side key, so visitors
 * cannot run up costs against anyone but themselves.
 */
export const API_KEY_PROVIDERS = ['mistral', 'anthropic', 'openai', 'google', 'openrouter'] as const
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number]

export const API_KEY_LABELS: Record<ApiKeyProvider, string> = {
	mistral: 'Mistral (default — powers both drawing and voice)',
	anthropic: 'Anthropic',
	openai: 'OpenAI',
	google: 'Google',
	openrouter: 'OpenRouter',
}

const PREFIX = 'tldraw-agent-apikey:'

export function getApiKey(provider: ApiKeyProvider): string {
	if (typeof localStorage === 'undefined') return ''
	return localStorage.getItem(PREFIX + provider) ?? ''
}

export function setApiKey(provider: ApiKeyProvider, value: string): void {
	if (typeof localStorage === 'undefined') return
	const trimmed = value.trim()
	if (trimmed) {
		localStorage.setItem(PREFIX + provider, trimmed)
	} else {
		localStorage.removeItem(PREFIX + provider)
	}
}

/** Build the `x-<provider>-api-key` headers for whichever keys the user has set. */
export function apiKeyHeaders(): Record<string, string> {
	const headers: Record<string, string> = {}
	for (const provider of API_KEY_PROVIDERS) {
		const value = getApiKey(provider)
		if (value) headers[`x-${provider}-api-key`] = value
	}
	return headers
}
