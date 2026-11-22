import { withTimeout } from '../../lib/http'
import { parseShareXConfig, resolveShareXTemplate } from '../../services/sharex'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithShareX(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	const config = parseShareXConfig(storage.sharexShortenerConfigText)
	const method = (config.RequestMethod || 'POST').toUpperCase()
	const requestUrl = config.RequestURL!.trim()
	const bodyType = (config.Body || 'JSON').toLowerCase()
	const headers = new Headers()

	const resolveParam = (v: any) =>
		String(v).replace(/\$url\$|\{url\}|\$input\$|\{input\}/g, targetUrl)

	for (const [k, v] of Object.entries(config.Headers || {})) {
		headers.set(k, resolveParam(v))
	}

	let body: any
	if (bodyType === 'json') {
		if (!headers.has('content-type'))
			headers.set('content-type', 'application/json')
		const args: Record<string, string> = {}
		for (const [k, v] of Object.entries(config.Arguments || {})) {
			args[k] = resolveParam(v)
		}
		body = JSON.stringify(args)
	} else if (bodyType === 'formurlencode' || bodyType === 'formdata') {
		const form = new URLSearchParams()
		for (const [k, v] of Object.entries(config.Arguments || {})) {
			form.append(k, resolveParam(v))
		}
		body = form.toString()
	}

	const res = await withTimeout(
		fetch(requestUrl, { method, headers, body }),
		15000,
	)
	const responseText = await res.text()
	let responseJson: unknown = null
	try {
		responseJson = responseText ? JSON.parse(responseText) : null
	} catch {}

	if (!res.ok) {
		const err = resolveShareXTemplate(
			config.ErrorMessage,
			responseText,
			responseJson,
		)
		throw new Error(err || `ShareX shortener failed: ${res.status}`)
	}

	const configuredUrl = resolveShareXTemplate(
		config.URL,
		responseText,
		responseJson,
	)?.trim()
	const fallbackUrl =
		responseJson && typeof responseJson === 'object' && 'url' in responseJson
			? String((responseJson as any).url || '')
			: responseText.trim()
	const result = configuredUrl || fallbackUrl
	if (!result) throw new Error('No URL returned from ShareX shortener')
	return result
}
