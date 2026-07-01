import { useEditor, useValue } from 'tldraw'
import {
	captureSessions$,
	dismissSession,
	finalizeRecording,
	type CaptureSessionState,
} from '../capture/captureSession'

/**
 * Persistent overlay for the active area-capture sessions: for each one, a dashed
 * rectangle at its captured bounds plus a status pill. Rendered inside
 * `OnTheCanvas`, so positions are in PAGE coordinates and track pan/zoom via the
 * camera transform (same approach as AreaHighlight). Multiple sessions can be
 * visible at once (one recording, others queued / transcribing / drawing); the
 * transcribe+draw work itself is serialized by the capture worker.
 */
export function AreaCaptureOverlay() {
	const sessions = useValue('captureSessions', () => captureSessions$.get(), [])

	if (sessions.length === 0) return null

	return (
		<>
			{sessions.map((session) => (
				<SessionOverlay key={session.id} session={session} />
			))}
		</>
	)
}

const PILL_STYLE: React.CSSProperties = {
	background: 'var(--tl-color-muted-1)',
	color: 'var(--tl-color-text-3)',
	border: 'none',
	borderRadius: 4,
	padding: '4px 10px',
	fontSize: 12,
	whiteSpace: 'nowrap',
}

function SessionOverlay({ session }: { session: CaptureSessionState }) {
	const { bounds } = session
	const editor = useEditor()
	const zoom = useValue('zoom', () => editor.getZoomLevel(), [editor])
	// Counter-scale so the pill stays a fixed physical size regardless of zoom.
	const scale = 1 / zoom

	return (
		<>
			{/* Dashed rectangle marking the captured area. */}
			<div
				style={{
					position: 'absolute',
					top: bounds.y,
					left: bounds.x,
					width: bounds.w,
					height: bounds.h,
					border: '2px dashed var(--tl-color-selected)',
					borderRadius: 4,
					pointerEvents: 'none',
					boxSizing: 'border-box',
				}}
			/>
			{/* Control pill anchored to the top-right corner of the rectangle. */}
			<div
				// Stop pointer events from reaching tldraw's canvas, which otherwise
				// captures the pointerdown and swallows the button click.
				onPointerDown={(e) => e.stopPropagation()}
				style={{
					position: 'absolute',
					top: bounds.y,
					left: bounds.x + bounds.w,
					transform: `translate(${8 * scale}px, 0) scale(${scale})`,
					transformOrigin: 'top left',
					pointerEvents: 'all',
				}}
			>
				{session.status === 'recording' && (
					<button
						onClick={() => finalizeRecording(session.id)}
						style={{
							background: 'var(--tl-color-selected)',
							color: 'white',
							border: 'none',
							borderRadius: 4,
							padding: '4px 10px',
							fontSize: 12,
							cursor: 'pointer',
							whiteSpace: 'nowrap',
						}}
					>
						Stop recording
					</button>
				)}
				{session.status === 'queued' && <div style={PILL_STYLE}>Queued…</div>}
				{session.status === 'transcribing' && <div style={PILL_STYLE}>Transcribing…</div>}
				{session.status === 'drawing' && <div style={PILL_STYLE}>Drawing…</div>}
				{session.status === 'error' && (
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
						<div
							style={{
								background: '#fecaca',
								color: '#7f1d1d',
								border: 'none',
								borderRadius: 4,
								padding: '4px 10px',
								fontSize: 12,
								whiteSpace: 'nowrap',
								maxWidth: '200px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{session.error || 'Error'}
						</div>
						<button
							onClick={() => dismissSession(session.id)}
							style={{
								background: 'transparent',
								color: '#7f1d1d',
								border: '1px solid #7f1d1d',
								borderRadius: 3,
								padding: '2px 6px',
								fontSize: 11,
								cursor: 'pointer',
								whiteSpace: 'nowrap',
							}}
						>
							Dismiss
						</button>
					</div>
				)}
			</div>
		</>
	)
}
