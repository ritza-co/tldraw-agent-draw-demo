import { useValue } from 'tldraw'
import { AGENT_MODEL_DEFINITIONS, AgentModelName } from '../../shared/models'
import { useAgent } from '../agent/TldrawAgentAppProvider'
import { getApiKey } from '../ui/apiKeys'

export function ModelPickerPanel() {
	const agent = useAgent()
	const modelName = useValue('modelName', () => agent.modelName.getModelName(), [agent])

	const availableModels = Object.values(AGENT_MODEL_DEFINITIONS).filter(
		(model) => !!getApiKey(model.provider)
	)

	if (availableModels.length <= 1) return null

	return (
		<div style={{ position: 'fixed', top: 8, left: 'calc(50% + 110px)', zIndex: 1000 }}>
			<div
				style={{
					position: 'relative',
					padding: '6px 12px',
					borderRadius: 8,
					border: '1px solid #d1d5db',
					background: '#fff',
					color: '#111',
					font: '500 13px/1 system-ui, sans-serif',
					boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
					whiteSpace: 'nowrap',
					cursor: 'pointer',
				}}
				title="Select the model used for drawing"
			>
				🧠 {modelName}
				<select
					value={modelName}
					onChange={(e) => agent.modelName.setModelName(e.target.value as AgentModelName)}
					style={{
						position: 'absolute',
						inset: 0,
						width: '100%',
						height: '100%',
						opacity: 0,
						cursor: 'pointer',
					}}
				>
					{availableModels.map((model) => (
						<option key={model.name} value={model.name}>
							{model.name}
						</option>
					))}
				</select>
			</div>
		</div>
	)
}
