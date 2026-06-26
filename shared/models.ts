export type AgentModelName = keyof typeof AGENT_MODEL_DEFINITIONS
export type AgentModelProvider = 'openai' | 'anthropic' | 'google' | 'openrouter'

export interface AgentModelDefinition {
	name: AgentModelName
	id: string
	provider: AgentModelProvider

	// Overrides the default thinking behavior for that provider
	thinking?: boolean
}

export const AGENT_MODEL_DEFINITIONS = {
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
	// lowest-latency option in the family; gemini-2.5-flash is the default (below)
	// because it reliably finishes a complete in-bounds drawing in one prompt.
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
} as const

// Default to Anthropic on the no-cloudflare branch: the self-hosted deployment is
// configured with an Anthropic API key, so Sonnet is the model that works out of
// the box. The picker still offers the other models, but each needs its provider's
// key set in the server environment.
export const DEFAULT_MODEL_NAME: AgentModelName = 'claude-sonnet-4-5'

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
