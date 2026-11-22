import { getFileArrayBuffer, getFileBlob } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage, ShareXConfig } from '../../types'

export function parseShareXConfig(configText: string): ShareXConfig {
	const normalized = configText.replace(/^\uFEFF/, '').trim()
	if (!normalized) throw new Error('ShareX configuration is empty')
	const parsed = JSON.parse(normalized)
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('ShareX configuration must be a JSON object')
	}
	if (!parsed.RequestURL || typeof parsed.RequestURL !== 'string') {
		throw new Error('ShareX configuration requires RequestURL')
	}
	return parsed as ShareXConfig
}

function getNestedValue(data: unknown, path: string): unknown {
	const normalized = path.replace(/\[(\d+)\]/g, '.$1')
	const segments = normalized.split('.').filter(Boolean)
	let cur: any = data
	for (const seg of segments) {
		if (!cur || typeof cur !== 'object' || !(seg in cur)) return undefined
		cur = cur[seg]
	}
	return cur
}

export function resolveShareXTemplate(
	template?: string,
	responseText = '',
	responseJson?: unknown,
): string | undefined {
	if (!template) return undefined
	let out = template.trim()
	if (!out) return undefined
	out = out.replace(/\$response\$|\{response\}/g, responseText)
	out = out.replace(/\$json:([^$]+)\$|\{json:([^}]+)\}/g, (_, a, b) => {
		const val = getNestedValue(responseJson, a || b)
		return val == null ? '' : String(val)
	})
	return out
}

export async function uploadToShareX(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const config = parseShareXConfig(storage.sharexConfigText)
	const method = (config.RequestMethod || 'POST').toUpperCase()
	const requestUrl = config.RequestURL!.trim()
	const bodyType = (config.Body || 'MultipartFormData').toLowerCase()
	const headers = new Headers()

	const resolveParam = (v: any) =>
		String(v).replace(/\$filename\$|\{filename\}/g, file.name)

	for (const [k, v] of Object.entries(config.Headers || {})) {
		headers.set(k, resolveParam(v))
	}

	let body: any
	if (bodyType === 'multipartformdata' || bodyType === 'formdata') {
		headers.delete('content-type')
		const form = new FormData()
		const blob = await getFileBlob(file.uri)
		const field = config.FileFormName || 'file'
		if (blob) form.append(field, blob, file.name)
		else
			form.append(field, {
				uri: file.uri,
				name: file.name,
				type: file.type,
			} as any)

		for (const [k, v] of Object.entries(config.Arguments || {})) {
			form.append(k, resolveParam(v))
		}
		body = form
	} else if (bodyType === 'binary') {
		const buf = await getFileArrayBuffer(file.uri)
		if (!buf) throw new Error('Could not read file for ShareX binary upload')
		body = buf
	} else if (bodyType === 'json') {
		if (!headers.has('content-type'))
			headers.set('content-type', 'application/json')
		const args: Record<string, string> = {}
		for (const [k, v] of Object.entries(config.Arguments || {})) {
			args[k] = resolveParam(v)
		}
		body = JSON.stringify(args)
	} else {
		throw new Error(`Unsupported ShareX Body: ${config.Body}`)
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(requestUrl, { method, headers, body }),
		120000,
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
		throw new Error(err || `ShareX upload failed: ${res.status}`)
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
	if (!result) throw new Error('No URL returned from ShareX uploader')
	onProgress?.(100)
	return result
}
