import { atom } from 'tldraw'

/**
 * Cross-cutting "the demo's API budget is used up" state. Both providers can hit
 * it: Mistral (transcription) and OpenRouter (the agent draw). When detected we
 * surface a single friendly modal pointing people at the hosted 2draw demo
 * instead of leaking a raw 429/402 into a toast or an error pill.
 */
export interface QuotaError {
	/** Which upstream ran out, for the modal copy. */
	provider: 'Mistral' | 'OpenRouter'
}

const quotaError = atom<QuotaError | null>('quotaError', null)

/** Reactive accessor for use inside tldraw `useValue`. */
export const quotaError$ = quotaError

export function clearQuotaError(): void {
	quotaError.set(null)
}

/**
 * Heuristic: does this error look like an exhausted quota / billing / rate-limit
 * failure rather than a normal app error? Matches the HTTP statuses and the
 * wording Mistral and OpenRouter use when credits run out or limits are hit.
 */
export function isQuotaError(err: unknown): boolean {
	const message = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
	return [
		'429',
		'402',
		'too many requests',
		'payment required',
		'quota',
		'insufficient',
		'credit',
		'billing',
		'rate limit',
		'rate_limit',
		'exceeded',
		'out of',
		'capacity',
	].some((needle) => message.includes(needle))
}

/**
 * If `err` looks like a quota/billing failure, raise the global modal and report
 * `true` so callers can suppress their own toast/pill. Otherwise do nothing and
 * report `false` so the caller handles it normally.
 */
export function reportPossibleQuotaError(err: unknown, provider: QuotaError['provider']): boolean {
	if (!isQuotaError(err)) return false
	quotaError.set({ provider })
	return true
}

// [debug] In dev only, expose a manual trigger so the modal can be previewed
// without exhausting a real key: run `__showQuotaModal('OpenRouter')` in the console.
if (import.meta.env.DEV) {
	;(window as any).__showQuotaModal = (provider: QuotaError['provider'] = 'OpenRouter') =>
		quotaError.set({ provider })
}
