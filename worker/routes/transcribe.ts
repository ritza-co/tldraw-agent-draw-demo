import { IRequest } from 'itty-router'
import { Environment } from '../environment'

export async function transcribe(request: IRequest, env: Environment) {
	const form = await request.formData()
	const file = form.get('file')

	if (!file) {
		return new Response(JSON.stringify({ error: 'No file provided' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Prefer a user-supplied key from the request header over the env var
	const mistralKey = request.headers.get('x-mistral-api-key') || env.MISTRAL_API_KEY

	const outForm = new FormData()
	outForm.append('file', file)
	outForm.append('model', 'voxtral-mini-transcribe-2507')

	const mistralResponse = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${mistralKey}`,
		},
		body: outForm,
	})

	if (!mistralResponse.ok) {
		const errorText = await mistralResponse.text()
		return new Response(errorText, {
			status: mistralResponse.status,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const data = (await mistralResponse.json()) as { text?: string }

	return new Response(JSON.stringify({ text: data.text ?? '' }), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	})
}
