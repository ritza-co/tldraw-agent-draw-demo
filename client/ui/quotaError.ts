/**
 * Best-effort surfacing of provider quota / rate-limit errors.
 *
 * The per-capture status pill already shows the raw error message, but a quota
 * or rate-limit failure (HTTP 429, "quota exceeded", "insufficient credits") is
 * worth calling out more visibly because it usually means a server-side API key
 * needs topping up rather than anything the user did wrong. This shows a brief,
 * non-blocking banner and logs a clear warning.
 */

/** Heuristic: does this error look like a quota / rate-limit / billing problem? */
function looksLikeQuotaError(err: unknown): boolean {
	const message = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
	if (!message) return false
	return (
		message.includes('429') ||
		message.includes('quota') ||
		message.includes('rate limit') ||
		message.includes('rate-limit') ||
		message.includes('too many requests') ||
		message.includes('insufficient') ||
		message.includes('billing') ||
		message.includes('credit')
	)
}

let bannerTimeout: ReturnType<typeof setTimeout> | undefined

function showBanner(text: string): void {
	if (typeof document === 'undefined') return

	let banner = document.getElementById('quota-error-banner')
	if (!banner) {
		banner = document.createElement('div')
		banner.id = 'quota-error-banner'
		Object.assign(banner.style, {
			position: 'fixed',
			top: '12px',
			left: '50%',
			transform: 'translateX(-50%)',
			zIndex: '99999',
			maxWidth: '90vw',
			padding: '10px 16px',
			borderRadius: '8px',
			background: '#b91c1c',
			color: '#fff',
			font: '500 13px/1.4 system-ui, sans-serif',
			boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
			pointerEvents: 'none',
		} satisfies Partial<CSSStyleDeclaration>)
		document.body.appendChild(banner)
	}

	banner.textContent = text
	if (bannerTimeout) clearTimeout(bannerTimeout)
	bannerTimeout = setTimeout(() => banner?.remove(), 6000)
}

/**
 * Inspect an error and, if it looks like a quota / rate-limit problem, surface a
 * visible banner naming the provider. Always logs the error for debugging.
 */
export function reportPossibleQuotaError(err: unknown, provider: string): void {
	if (looksLikeQuotaError(err)) {
		console.warn(`[quota] ${provider} request hit a quota / rate-limit error:`, err)
		showBanner(`${provider} quota or rate limit reached — check the API key's usage and billing.`)
	} else {
		console.warn(`[${provider}] request failed:`, err)
	}
}
