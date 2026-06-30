import { apiKeyHeaders } from '../ui/apiKeys'

/**
 * Transcribe an audio blob via the `/transcribe` worker route (Mistral).
 * Returns the trimmed transcript text. Throws on HTTP / network error.
 * Used by the area-capture recorder and the area-capture E2E automation hook.
 */
export async function transcribe(blob: Blob): Promise<string> {
	const fd = new FormData()
	fd.append('file', blob, 'audio.webm')

	const response = await fetch('/transcribe', { method: 'POST', body: fd, headers: apiKeyHeaders() })

	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(`Transcription failed: ${response.status} ${response.statusText}. ${errorText}`)
	}

	const { text } = (await response.json()) as { text: string }
	return text?.trim() ?? ''
}
