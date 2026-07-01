import { useEffect, useState } from 'react'
import { API_KEY_LABELS, API_KEY_PROVIDERS, ApiKeyProvider, getApiKey, setApiKey } from '../ui/apiKeys'

interface ApiKeysPanelProps {
	onSave?: () => void
}

export function ApiKeysPanel({ onSave }: ApiKeysPanelProps) {
	const [open, setOpen] = useState(false)
	const [values, setValues] = useState<Record<ApiKeyProvider, string>>(() =>
		Object.fromEntries(API_KEY_PROVIDERS.map((p) => [p, ''])) as Record<ApiKeyProvider, string>
	)
	const [showMistralError, setShowMistralError] = useState(false)

	useEffect(() => {
		if (!open) return
		setShowMistralError(false)
		setValues(
			Object.fromEntries(API_KEY_PROVIDERS.map((p) => [p, getApiKey(p)])) as Record<
				ApiKeyProvider,
				string
			>
		)
	}, [open])

	function save() {
		if (!values['mistral'].trim()) {
			setShowMistralError(true)
			return
		}
		for (const provider of API_KEY_PROVIDERS) {
			setApiKey(provider, values[provider])
		}
		onSave?.()
		setOpen(false)
	}

	const mistralKeySet = !!getApiKey('mistral')

	return (
		<div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
			<button
				onClick={() => setOpen((o) => !o)}
				style={{
					padding: '6px 12px',
					borderRadius: 8,
					border: '1px solid #d1d5db',
					background: mistralKeySet ? '#ecfdf5' : '#fff',
					color: '#111',
					font: '500 13px/1 system-ui, sans-serif',
					cursor: 'pointer',
					boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
					whiteSpace: 'nowrap',
				}}
				title="Set the API keys used for this session"
			>
				🔑 API keys{mistralKeySet ? ' ✓' : ''}
			</button>

			{open && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: '50%',
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
					<p style={{ margin: '0 0 12px', color: '#374151' }}>
						Keys are stored only in this browser and never saved on the server. The Mistral
						key is used for voice transcription. Add an optional key below to unlock
						additional drawing models.
					</p>

					{/* Required */}
					{(['mistral'] as const).map((provider) => {
						const hasError = showMistralError
						return (
							<label key={provider} style={{ display: 'block', marginBottom: 10 }}>
								<span style={{ display: 'block', marginBottom: 3, fontWeight: 500 }}>
									{API_KEY_LABELS[provider]}
									<span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
								</span>
								<input
									type="password"
									autoComplete="off"
									value={values[provider]}
									placeholder="mistral API key"
									onChange={(e) => {
										setValues((v) => ({ ...v, [provider]: e.target.value }))
										if (e.target.value.trim()) setShowMistralError(false)
									}}
									style={{
										width: '100%',
										padding: '6px 8px',
										borderRadius: 6,
										border: hasError ? '1px solid #dc2626' : '1px solid #d1d5db',
										font: '13px monospace',
										boxSizing: 'border-box',
									}}
								/>
								{hasError && (
									<span style={{ color: '#dc2626', fontSize: 12, marginTop: 3, display: 'block' }}>
										Mistral key is required
									</span>
								)}
							</label>
						)
					})}

					{/* Optional */}
					<div style={{ borderTop: '1px solid #e5e7eb', margin: '12px 0 10px' }}>
						<p style={{ margin: '10px 0 10px', fontSize: 13, color: '#111', fontWeight: 600 }}>
							Optional keys
						</p>
						<p style={{ margin: '-6px 0 10px', fontSize: 12, color: '#6b7280' }}>
							Add your own key for increased intelligence
						</p>
						{(['anthropic', 'openai', 'google', 'openrouter'] as const).map((provider) => (
							<label key={provider} style={{ display: 'block', marginBottom: 10 }}>
								<span style={{ display: 'block', marginBottom: 3, fontWeight: 500 }}>
									{API_KEY_LABELS[provider]}
								</span>
								<input
									type="password"
									autoComplete="off"
									value={values[provider]}
									placeholder={`${provider} API key`}
									onChange={(e) => setValues((v) => ({ ...v, [provider]: e.target.value }))}
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
					</div>

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
