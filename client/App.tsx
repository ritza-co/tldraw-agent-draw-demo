import { useCallback, useMemo, useState } from 'react'
import {
	DefaultSizeStyle,
	TLComponents,
	Tldraw,
	TldrawUiToastsProvider,
	TLUiOverrides,
} from 'tldraw'
import { TldrawAgentApp } from './agent/TldrawAgentApp'
import {
	TldrawAgentAppContextProvider,
	TldrawAgentAppProvider,
} from './agent/TldrawAgentAppProvider'
import { ApiKeysPanel } from './components/ApiKeysPanel'
import { CustomHelperButtons } from './components/CustomHelperButtons'
import { CustomToolbar } from './components/CustomToolbar'
import { AreaCaptureOverlay } from './components/AreaCaptureOverlay'
import { AgentViewportBoundsHighlights } from './components/highlights/AgentViewportBoundsHighlights'
import { AllContextHighlights } from './components/highlights/ContextHighlights'
import { AreaCaptureTool } from './tools/AreaCaptureTool'
import { TargetAreaTool } from './tools/TargetAreaTool'
import { TargetShapeTool } from './tools/TargetShapeTool'

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

function App() {
	const [app, setApp] = useState<TldrawAgentApp | null>(null)

	const handleUnmount = useCallback(() => {
		setApp(null)
	}, [])

	// Custom components to visualize what the agent is doing
	// These use TldrawAgentAppContextProvider to access the app/agent
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
				<ApiKeysPanel />
				<div className="tldraw-canvas">
					<Tldraw
						// tldraw SDK license key. Required for any public/production deploy
						// (the SDK enforces this client-side). Free in local dev without one.
						// Set VITE_TLDRAW_LICENSE_KEY in .env, see .env.example. The value is
						// embedded in the client bundle by design, so it is kept in a
						// gitignored .env rather than committed.
						licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
						persistenceKey="tldraw-agent-demo"
						tools={tools}
						overrides={overrides}
						components={components}
					>
						<TldrawAgentAppProvider onMount={setApp} onUnmount={handleUnmount} />
					</Tldraw>
				</div>
			</div>
		</TldrawUiToastsProvider>
	)
}

export default App
