import { useValue } from 'tldraw'
import { clearQuotaError, quotaError$ } from '../ui/quotaError'

const TWODRAW_URL = 'https://2draw.ritzademo.com/#pub-4po650'

/**
 * Full-screen modal shown when the demo's API budget (Mistral transcription or
 * OpenRouter drawing) is exhausted. Replaces the raw 429/402 error with a
 * friendly explanation and a pointer to the always-on 2draw demo.
 */
export function QuotaModal() {
	const error = useValue('quotaError', () => quotaError$.get(), [])
	if (!error) return null

	return (
		<div
			role="dialog"
			aria-modal="true"
			onClick={clearQuotaError}
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 10000,
				background: 'rgba(0, 0, 0, 0.45)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 24,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					maxWidth: 440,
					width: '100%',
					background: '#fff',
					borderRadius: 12,
					padding: '28px 28px 24px',
					boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
					fontFamily: 'inherit',
					color: '#1d1d1d',
				}}
			>
				<h2 style={{ margin: '0 0 12px', fontSize: 20 }}>This demo is taking a breather</h2>
				<p style={{ margin: '0 0 16px', lineHeight: 1.5, fontSize: 15 }}>
					The free API budget behind the {error.provider === 'Mistral' ? 'transcription' : 'drawing'}{' '}
					has run out for now, so the agent can&apos;t {error.provider === 'Mistral' ? 'hear' : 'draw'}{' '}
					your request. This is a hosted demo with a capped key, not a problem on your end.
				</p>
				<p style={{ margin: '0 0 22px', lineHeight: 1.5, fontSize: 15 }}>
					In the meantime, try{' '}
					<a href={TWODRAW_URL} target="_blank" rel="noreferrer" style={{ color: '#0a7', fontWeight: 600 }}>
						2draw
					</a>
					, our always-on tldraw demo, or grab the code and run this one with your own keys.
				</p>
				<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
					<button
						onClick={clearQuotaError}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							border: '1px solid #ddd',
							background: '#fff',
							cursor: 'pointer',
							fontSize: 14,
						}}
					>
						Dismiss
					</button>
					<a
						href={TWODRAW_URL}
						target="_blank"
						rel="noreferrer"
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							background: '#0a7',
							color: '#fff',
							textDecoration: 'none',
							fontSize: 14,
							fontWeight: 600,
						}}
					>
						Open 2draw
					</a>
				</div>
			</div>
		</div>
	)
}
