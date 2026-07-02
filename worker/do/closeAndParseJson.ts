/**
 * Scan `string` starting at `start` for a balanced `{...}` or `[...]` object,
 * tracking string/escape state so braces inside string values don't confuse the
 * count. Returns the index just past the matching close, or -1 if the opening
 * never closes within `string` (e.g. a still-streaming, incomplete object).
 */
function findBalancedEnd(string: string, start: number): number {
	const stackOfOpenings: string[] = []
	let i = start
	let sawOpening = false
	while (i < string.length) {
		const char = string[i]
		const lastOpening = stackOfOpenings.at(-1)

		if (char === '"') {
			if (i > 0 && string[i - 1] === '\\') {
				i++
				continue
			}
			if (lastOpening === '"') {
				stackOfOpenings.pop()
			} else {
				stackOfOpenings.push('"')
			}
		}

		if (lastOpening === '"') {
			i++
			continue
		}

		if (char === '{' || char === '[') {
			stackOfOpenings.push(char)
			sawOpening = true
		}

		if (char === '}' && lastOpening === '{') {
			stackOfOpenings.pop()
		}

		if (char === ']' && lastOpening === '[') {
			stackOfOpenings.pop()
		}

		if (sawOpening && stackOfOpenings.length === 0) {
			return i + 1
		}

		i++
	}

	return -1
}

/**
 * JSON helper. Given a potentially incomplete JSON string, return the parsed object.
 * The string might be missing closing braces, brackets, or other characters like quotation marks.
 * @param string - The string to parse.
 * @returns The parsed object.
 */
export function closeAndParseJson(string: string) {
	// Once the initial `{` or `[` closes, stop: some models wrap their JSON in a
	// markdown code fence (```json ... ```), and anything after the matching
	// close brace is trailing garbage that would otherwise make JSON.parse fail
	// on an otherwise well-formed, complete response.
	const closedAt = findBalancedEnd(string, 0)
	if (closedAt !== -1) {
		string = string.slice(0, closedAt)
	} else {
		// Still-streaming/incomplete: close whatever's left open by replaying the
		// same scan and appending closers for anything still on the stack.
		const stackOfOpenings: string[] = []
		let i = 0
		while (i < string.length) {
			const char = string[i]
			const lastOpening = stackOfOpenings.at(-1)

			if (char === '"') {
				if (i > 0 && string[i - 1] === '\\') {
					i++
					continue
				}
				if (lastOpening === '"') {
					stackOfOpenings.pop()
				} else {
					stackOfOpenings.push('"')
				}
			}

			if (lastOpening === '"') {
				i++
				continue
			}

			if (char === '{' || char === '[') {
				stackOfOpenings.push(char)
			}

			if (char === '}' && lastOpening === '{') {
				stackOfOpenings.pop()
			}

			if (char === ']' && lastOpening === '[') {
				stackOfOpenings.pop()
			}

			i++
		}

		for (let i = stackOfOpenings.length - 1; i >= 0; i--) {
			const opening = stackOfOpenings[i]
			if (opening === '{') string += '}'
			if (opening === '[') string += ']'
			if (opening === '"') string += '"'
		}
	}

	try {
		return JSON.parse(string)
	} catch (_e) {
		return null
	}
}

/**
 * Fallback for weaker models that drift into echoing the `[ACTION]: {...}` /
 * `[THOUGHT]: text` shorthand used to render completed actions back into chat
 * history (see PromptPartDefinitions.ts), instead of emitting the expected
 * `{"actions": [...]}` schema. Converts any such markers found in `string` into
 * that schema so the response isn't silently dropped. Returns null if no
 * markers are found.
 */
export function actionShorthandToActionsJson(string: string): string | null {
	const actionJsonStrings: string[] = []
	let matchedAny = false
	// True once we've hit a marker whose content ran off the end of the string
	// (still streaming in). Nothing can follow it, and the wrapping `[...]}`
	// must be left off so closeAndParseJson's own incomplete-JSON closer can
	// close the inner object and the outer array/object in the right order.
	let lastIsIncomplete = false

	const markerPattern = /\[ACTION\]:\s*|\[THOUGHT\]:\s*/g
	let match: RegExpExecArray | null
	while ((match = markerPattern.exec(string)) !== null) {
		const isThought = match[0].startsWith('[THOUGHT]')
		const contentStart = match.index + match[0].length

		if (isThought) {
			// The thought runs until the next marker (or end of string). It's plain
			// text, not JSON, so wrap it directly rather than balance-scanning it.
			markerPattern.lastIndex = contentStart
			const nextMatch = markerPattern.exec(string)
			markerPattern.lastIndex = contentStart // restore: we were only peeking ahead
			const textEnd = nextMatch ? nextMatch.index : string.length
			const text = string.slice(contentStart, textEnd).trim()
			if (text) {
				actionJsonStrings.push(JSON.stringify({ _type: 'think', text }))
				matchedAny = true
				lastIsIncomplete = !nextMatch
			}
			continue
		}

		const objEnd = findBalancedEnd(string, contentStart)
		const objString = objEnd === -1 ? string.slice(contentStart) : string.slice(contentStart, objEnd)
		if (objString.trim().startsWith('{')) {
			actionJsonStrings.push(objString)
			matchedAny = true
			lastIsIncomplete = objEnd === -1
		}
	}

	if (!matchedAny) return null
	const joined = `{"actions": [${actionJsonStrings.join(',')}`
	return lastIsIncomplete ? joined : `${joined}]}`
}
