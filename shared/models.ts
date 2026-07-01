export type AgentModelName = keyof typeof AGENT_MODEL_DEFINITIONS
export type AgentModelProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'mistral'

export interface AgentModelDefinition {
	name: AgentModelName
	id: string
	provider: AgentModelProvider

	// Overrides the default thinking behavior for that provider
	thinking?: boolean
}

export const AGENT_MODEL_DEFINITIONS = {
	// Mistral models (also used for transcription, so this is the always-available fallback)
	'mistral-medium-3.5': {
		name: 'mistral-medium-3.5',
		id: 'mistral-medium-3.5',
		provider: 'mistral',
	},

	// Anthropic models
	// sonnet 4.5 is recommended
	'claude-sonnet-4-5': {
		name: 'claude-sonnet-4-5',
		id: 'claude-sonnet-4-5',
		provider: 'anthropic',
	},

	'claude-opus-4-5': {
		name: 'claude-opus-4-5',
		id: 'claude-opus-4-5',
		provider: 'anthropic',
	},

	// Google models
	'gemini-3-pro-preview': {
		name: 'gemini-3-pro-preview',
		id: 'gemini-3-pro-preview',
		provider: 'google',
		thinking: true,
	},

	// gemini 3 flash is fastest, and quite good
	'gemini-3-flash-preview': {
		name: 'gemini-3-flash-preview',
		id: 'gemini-3-flash-preview',
		provider: 'google',
	},

	// gemini 2.5 flash is a stable model with more generous quota than the
	// preview models, which makes it a better default for the live mic pipeline
	'gemini-2.5-flash': {
		name: 'gemini-2.5-flash',
		id: 'gemini-2.5-flash',
		provider: 'google',
	},

	// OpenAI models
	'gpt-5.2-2025-12-11': {
		name: 'gpt-5.2-2025-12-11',
		id: 'gpt-5.2-2025-12-11',
		provider: 'openai',
	},

	// OpenRouter models. These route through OpenRouter's OpenAI-compatible API
	// (billed against OpenRouter credits), so the pipeline no longer hammers the
	// personal Google quota. Names match OpenRouter's model ids. flash-lite is the
	// lowest-latency option in the family; anthropic/claude-haiku-4.5 is the
	// default (below).
	'google/gemini-2.5-flash-lite': {
		name: 'google/gemini-2.5-flash-lite',
		id: 'google/gemini-2.5-flash-lite',
		provider: 'openrouter',
	},

	'google/gemini-2.5-flash': {
		name: 'google/gemini-2.5-flash',
		id: 'google/gemini-2.5-flash',
		provider: 'openrouter',
	},

	'anthropic/claude-haiku-4.5': {
		name: 'anthropic/claude-haiku-4.5',
		id: 'anthropic/claude-haiku-4.5',
		provider: 'openrouter',
	},

	'openai/gpt-5-mini': {
		name: 'openai/gpt-5-mini',
		id: 'openai/gpt-5-mini',
		provider: 'openrouter',
	},

	'anthropic/claude-opus-4.8': {
		name: 'anthropic/claude-opus-4.8',
		id: 'anthropic/claude-opus-4.8',
		provider: 'openrouter',
	},

	'google/gemini-2.5-pro': {
		name: 'google/gemini-2.5-pro',
		id: 'google/gemini-2.5-pro',
		provider: 'openrouter',
	},

} as const

export const DEFAULT_MODEL_NAME: AgentModelName = 'mistral-medium-3.5'

/** The default model to use when a key for that provider is available. */
export const DEFAULT_MODEL_BY_PROVIDER: Record<AgentModelProvider, AgentModelName> = {
	anthropic: 'claude-sonnet-4-5',
	google: 'gemini-2.5-flash',
	openai: 'gpt-5.2-2025-12-11',
	openrouter: 'anthropic/claude-haiku-4.5',
	mistral: 'mistral-medium-3.5',
}

/**
 * Given a set of providers that have keys, return the best default model.
 * Prefers direct providers over openrouter, and mistral last (everyone has it
 * for transcription, so it's the universal fallback for drawing too).
 */
export function getDefaultModelForProviders(availableProviders: Set<AgentModelProvider>): AgentModelName {
	for (const provider of ['anthropic', 'google', 'openai', 'openrouter', 'mistral'] as const) {
		if (availableProviders.has(provider)) return DEFAULT_MODEL_BY_PROVIDER[provider]
	}
	return DEFAULT_MODEL_BY_PROVIDER['mistral']
}

/**
 * Check if a string is a valid AgentModelName.
 */
export function isValidModelName(value: string | undefined): value is AgentModelName {
	return !!value && value in AGENT_MODEL_DEFINITIONS
}

/**
 * Get the full information about a model from its name.
 * @param modelName - The name of the model.
 * @returns The full definition of the model.
 */
export function getAgentModelDefinition(modelName: AgentModelName): AgentModelDefinition {
	const definition = AGENT_MODEL_DEFINITIONS[modelName]
	if (!definition) {
		throw new Error(`Model ${modelName} not found`)
	}
	return definition
}
