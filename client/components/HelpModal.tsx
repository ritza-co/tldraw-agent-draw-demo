import { useState } from 'react'
import { createPortal } from 'react-dom'

const AgentDrawIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{ verticalAlign: 'middle', marginBottom: 2 }}
	>
		<g transform="translate(12 12) scale(0.78) translate(-12 -12)" strokeWidth="2.4">
			<path d="M12 8V4H8" />
			<rect width="16" height="12" x="4" y="8" rx="2" />
			<path d="M2 14h2" />
			<path d="M20 14h2" />
			<path d="M15 13v2" />
			<path d="M9 13v2" />
		</g>
	</svg>
)

export function HelpButton() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				style={{
					padding: '6px 10px',
					borderRadius: 8,
					border: '1px solid #d1d5db',
					background: '#fff',
					color: '#111',
					font: '500 13px/1 system-ui, sans-serif',
					cursor: 'pointer',
					boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
					whiteSpace: 'nowrap',
				}}
				title="How to use this demo"
			>
				?
			</button>

			{open && createPortal(
				<div
					role="dialog"
					aria-modal="true"
					onClick={() => setOpen(false)}
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
							maxWidth: 480,
							width: '100%',
							background: '#fff',
							borderRadius: 12,
							padding: '28px 28px 24px',
							boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
							fontFamily: 'system-ui, sans-serif',
							color: '#1d1d1d',
						}}
					>
						<h2 style={{ margin: '0 0 16px', fontSize: 20 }}>How to use agent draw</h2>
						<ol style={{ margin: '0 0 20px', paddingLeft: 20, lineHeight: 1.8, fontSize: 15 }}>
							<li>Select the <strong>agent draw tool</strong> (<AgentDrawIcon />) from the toolbar.</li>
							<li>Click and drag on the canvas to <strong>draw a rectangle</strong> over the area where you want shapes to appear.</li>
							<li>Release the mouse. <strong>Recording starts automatically</strong> — speak your request.</li>
							<li>Click <strong>Stop recording</strong> when you're done. The agent will transcribe your voice and draw the shapes.</li>
						</ol>
						<p style={{ margin: '0 0 20px', lineHeight: 1.5, fontSize: 14, color: '#6b7280' }}>
							Both transcription and drawing use Mistral, provided free in this demo. To use a more capable model for drawing, add your own API key via the <strong>API keys</strong> button.
						</p>
						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<button
								onClick={() => setOpen(false)}
								style={{
									padding: '8px 16px',
									borderRadius: 8,
									border: '1px solid #ddd',
									background: '#fff',
									cursor: 'pointer',
									fontSize: 14,
								}}
							>
								Got it
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</>
	)
}
