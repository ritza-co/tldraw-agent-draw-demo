import { useEffect, useState } from 'react'
import { API_KEY_LABELS, API_KEY_PROVIDERS, ApiKeyProvider, getApiKey, setApiKey } from '../ui/apiKeys'

export function ApiKeysPanel() {
	const [open, setOpen] = useState(false)
	const [values, setValues] = useState<Record<ApiKeyProvider, string>>(() =>
		Object.fromEntries(API_KEY_PROVIDERS.map((p) => [p, ''])) as Record<ApiKeyProvider, string>
	)

	useEffect(() => {
		if (!open) return
		setValues(
			Object.fromEntries(API_KEY_PROVIDERS.map((p) => [p, getApiKey(p)])) as Record<
				ApiKeyProvider,
				string
			>
		)
	}, [open])

	function save() {
		for (const provider of API_KEY_PROVIDERS) {
			setApiKey(provider, values[provider])
		}
		setOpen(false)
	}

	const anyKeySet = API_KEY_PROVIDERS.some((p) => getApiKey(p))

	return (
		<div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
			<button
				onClick={() => setOpen((o) => !o)}
				style={{
					padding: '6px 12px',
					borderRadius: 8,
					border: '1px solid #d1d5db',
					background: anyKeySet ? '#ecfdf5' : '#fff',
					color: '#111',
					font: '500 13px/1 system-ui, sans-serif',
					cursor: 'pointer',
					boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
					whiteSpace: 'nowrap',
				}}
				title="Set the API keys used for this session"
			>
				🔑 API keys{anyKeySet ? ' ✓' : ''}
			</button>

			{open && (
				<div
					style={{
						marginTop: 8,
						width: 340,
						padding: 16,
						borderRadius: 10,
						background: '#fff',
						color: '#111',
						border: '1px solid #e5e7eb',
						boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
						font: '13px/1.45 system-ui, sans-serif',
						transform: 'translateX(-50%)',
					}}
				>
					<p style={{ margin: '0 0 10px', color: '#374151' }}>
						Keys are stored only in this browser and sent with each request. They are never
						saved on the server. A Mistral key powers both the drawing agent and voice
						transcription.
					</p>

					{API_KEY_PROVIDERS.map((provider) => (
						<label key={provider} style={{ display: 'block', marginBottom: 10 }}>
							<span style={{ display: 'block', marginBottom: 3, fontWeight: 500 }}>
								{API_KEY_LABELS[provider]}
							</span>
							<input
								type="password"
								autoComplete="off"
								value={values[provider]}
								placeholder={`${provider} API key`}
								onChange={(e) =>
									setValues((v) => ({ ...v, [provider]: e.target.value }))
								}
								style={{
									width: '100%',
									padding: '6px 8px',
									borderRadius: 6,
									border: '1px solid #d1d5db',
									font: '13px monospace',
									boxSizing: 'border-box',
								}}
							/>
						</label>
					))}

					<div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
						<button
							onClick={save}
							style={{
								padding: '7px 14px',
								borderRadius: 6,
								border: 'none',
								background: '#2563eb',
								color: '#fff',
								fontWeight: 600,
								cursor: 'pointer',
							}}
						>
							Save
						</button>
						<button
							onClick={() => setOpen(false)}
							style={{
								padding: '7px 14px',
								borderRadius: 6,
								border: '1px solid #d1d5db',
								background: '#fff',
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
