import { Component, ReactNode } from 'react'

interface Props {
	children: ReactNode
}

interface State {
	hasError: boolean
}

/**
 * Catches render errors from the tldraw canvas, most commonly a persisted
 * shape with corrupted geometry (e.g. a draw shape saved mid-stream that
 * ends up with fewer than 2 points) throwing during tldraw's geometry
 * computation on load. Without this boundary that error takes down the
 * whole app with a blank white screen and no way to recover except manually
 * clearing storage in devtools.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
	override state: State = { hasError: false }

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	override componentDidCatch(error: unknown) {
		console.error('[canvas] render error, offering reset:', error)
	}

	private reset = async () => {
		try {
			localStorage.clear()
		} catch {
			// ignore
		}
		try {
			if ('indexedDB' in window && indexedDB.databases) {
				const dbs = await indexedDB.databases()
				await Promise.all(
					dbs
						.filter((db) => db.name?.startsWith('TLDRAW_DOCUMENT_v2'))
						.map((db) => db.name && indexedDB.deleteDatabase(db.name))
				)
			}
		} catch {
			// ignore
		}
		window.location.reload()
	}

	override render() {
		if (this.state.hasError) {
			return (
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 16,
						height: '100%',
						fontFamily: 'system-ui, sans-serif',
						padding: 24,
						textAlign: 'center',
					}}
				>
					<p style={{ margin: 0, fontSize: 15, color: '#374151' }}>
						Something on the canvas failed to load. This is usually caused by a drawing that
						didn't save correctly.
					</p>
					<button
						onClick={this.reset}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							border: '1px solid #ddd',
							background: '#fff',
							cursor: 'pointer',
							fontSize: 14,
						}}
					>
						Reset canvas
					</button>
				</div>
			)
		}
		return this.props.children
	}
}
