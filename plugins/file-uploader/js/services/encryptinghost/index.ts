import { getFileBlob } from '../../lib/file'
import { getBaseUrl, makeRandomHex, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToEncryptingHost(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.encryptingHostKey?.trim())
		throw new Error('Encrypting.host key is required')
	const baseUrl = getBaseUrl(
		storage.encryptingHostDomain?.trim() || 'encrypting.host',
	)
	const form = new FormData()
	form.append('password', makeRandomHex(16))
	form.append('userKey', storage.encryptingHostKey.trim())
	form.append('urlStyle', 'query')
	const domains = storage.encryptingHostDomain?.trim()
		? [storage.encryptingHostDomain.trim()]
		: ['offensive']
	form.append('domains', JSON.stringify(domains))

	const blob = await getFileBlob(file.uri)
	if (blob) form.append('file', blob, file.name)
	else
		form.append('file', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/upload`, { method: 'POST', body: form }),
		120000,
	)
	const text = await res.text()
	if (!res.ok)
		throw new Error(`Encrypting.host failed (${res.status}): ${text}`)
	try {
		const json = JSON.parse(text)
		const candidate = json?.data?.[0]?.Url || json?.url || json?.Url
		if (candidate) {
			onProgress?.(100)
			return candidate
		}
	} catch {}
	if (text.trim().startsWith('http')) {
		onProgress?.(100)
		return text.trim()
	}
	throw new Error('No URL returned from Encrypting.host')
}
