import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	DefaultSizeStyle,
	TLComponents,
	Tldraw,
	TldrawUiToastsProvider,
	TLUiOverrides,
	useEditor,
} from 'tldraw'
import { TldrawAgentApp } from './agent/TldrawAgentApp'
import {
	TldrawAgentAppContextProvider,
	TldrawAgentAppProvider,
} from './agent/TldrawAgentAppProvider'
import { ApiKeysPanel } from './components/ApiKeysPanel'
import { ModelPickerPanel } from './components/ModelPickerPanel'
import { QuotaModal } from './components/QuotaModal'
import { CustomHelperButtons } from './components/CustomHelperButtons'
import { CustomToolbar } from './components/CustomToolbar'
import { AreaCaptureOverlay } from './components/AreaCaptureOverlay'
import { AgentViewportBoundsHighlights } from './components/highlights/AgentViewportBoundsHighlights'
import { AllContextHighlights } from './components/highlights/ContextHighlights'
import { AreaCaptureTool } from './tools/AreaCaptureTool'
import { TargetAreaTool } from './tools/TargetAreaTool'
import { TargetShapeTool } from './tools/TargetShapeTool'
import { getApiKey } from './ui/apiKeys'
import { AgentModelProvider, getAgentModelDefinition, getDefaultModelForProviders } from '../shared/models'

function ToolPreselector() {
	const editor = useEditor()
	useEffect(() => {
		editor.setCurrentTool('area-capture')
	}, [editor])
	return null
}

// Lucide "bot" icon. Use JSX instead of a custom asset URL because tldraw
// string icons are applied as CSS masks, which can turn data-URL SVGs into a
// solid square.
const agentDrawIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
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

// Customize tldraw's styles to play to the agent's strengths
DefaultSizeStyle.setDefaultValue('s')

// Custom tools for picking context items
const tools = [AreaCaptureTool, TargetShapeTool, TargetAreaTool]
const overrides: TLUiOverrides = {
	tools: (editor, tools) => {
		return {
			...tools,
			'area-capture': {
				id: 'area-capture',
				label: 'Agent draw',
				kbd: 'a',
				icon: agentDrawIcon,
				onSelect() {
					editor.setCurrentTool('area-capture')
				},
			},
			'target-area': {
				id: 'target-area',
				label: 'Pick Area',
				kbd: 'c',
				icon: 'tool-frame',
				onSelect() {
					editor.setCurrentTool('target-area')
				},
			},
			'target-shape': {
				id: 'target-shape',
				label: 'Pick Shape',
				kbd: 's',
				icon: 'tool-frame',
				onSelect() {
					editor.setCurrentTool('target-shape')
				},
			},
		}
	},
}

function getAvailableDrawingProviders(): Set<AgentModelProvider> {
	const providers = new Set<AgentModelProvider>()
	for (const p of ['anthropic', 'google', 'openai', 'openrouter', 'mistral'] as const) {
		if (getApiKey(p)) providers.add(p)
	}
	return providers
}

function App() {
	const [app, setApp] = useState<TldrawAgentApp | null>(null)
	const [keysVersion, setKeysVersion] = useState(0)

	const handleUnmount = useCallback(() => {
		setApp(null)
	}, [])

	const handleApiKeysSave = useCallback(() => {
		setKeysVersion((v) => v + 1)
		const agent = app?.agents.getAgent()
		if (!agent) return
		const current = agent.modelName.getModelName()
		const currentProvider = getAgentModelDefinition(current).provider
		if (getApiKey(currentProvider)) return // current model still has a key, nothing to do
		const next = getDefaultModelForProviders(getAvailableDrawingProviders())
		if (next) agent.modelName.setModelName(next)
	}, [app])

	const components: TLComponents = useMemo(() => {
		return {
			HelperButtons: () =>
				app && (
					<TldrawAgentAppContextProvider app={app}>
						<CustomHelperButtons />
					</TldrawAgentAppContextProvider>
				),
			Toolbar: () =>
				app ? (
					<TldrawAgentAppContextProvider app={app}>
						<CustomToolbar />
					</TldrawAgentAppContextProvider>
				) : null,
			OnTheCanvas: () =>
				app ? (
					<TldrawAgentAppContextProvider app={app}>
						<AgentViewportBoundsHighlights />
						<AllContextHighlights />
						<AreaCaptureOverlay />
					</TldrawAgentAppContextProvider>
				) : null,
		}
	}, [app])

	return (
		<TldrawUiToastsProvider>
			<div className="tldraw-agent-container">
				<div className="tldraw-canvas">
					<Tldraw
						licenseKey="tldraw-2026-09-12/WyI3Sm1XaXZydiIsWyIqIl0sMTYsIjIwMjYtMDktMTIiXQ.ef10VujNAYKOgiuGtnGSCynOF2GonyTWyIoF54ixcfZ8rdlHomXR2YqnhL1/FDmhgOS8VoIp7gWdTfO4IwUBbw"
						persistenceKey="tldraw-agent-demo"
						tools={tools}
						overrides={overrides}
						components={components}
					>
						<TldrawAgentAppProvider onMount={setApp} onUnmount={handleUnmount} />
						<ToolPreselector />
					</Tldraw>
				</div>
			</div>
			<ApiKeysPanel onSave={handleApiKeysSave} />
			{app && (
				<TldrawAgentAppContextProvider app={app}>
					<ModelPickerPanel keysVersion={keysVersion} />
				</TldrawAgentAppContextProvider>
			)}
			<QuotaModal />
		</TldrawUiToastsProvider>
	)
}

export default App
