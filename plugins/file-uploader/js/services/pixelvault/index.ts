import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToPixelVault(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.pixelVaultKey?.trim())
		throw new Error('PixelVault key is required')
	const baseUrl = getBaseUrl(storage.pixelVaultHost?.trim() || 'pixelvault.co')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) form.append('file', blob, file.name)
	else
		form.append('file', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)

	onProgress?.(50)
	let res: Response | null = null
	try {
		res = await withTimeout(
			fetch(`${baseUrl}/api/upload`, {
				method: 'POST',
				headers: { Authorization: storage.pixelVaultKey.trim() },
				body: form,
			}),
			120000,
		)
	} catch {
		res = null
	}

	if (!res || !res.ok) {
		res = await withTimeout(
			fetch(`${baseUrl}/`, {
				method: 'POST',
				headers: { Authorization: storage.pixelVaultKey.trim() },
				body: form,
			}),
			120000,
		)
	}

	const text = await res.text()
	if (!res.ok) throw new Error(`PixelVault failed (${res.status}): ${text}`)
	try {
		const json = JSON.parse(text)
		if (json?.resource || json?.url) {
			onProgress?.(100)
			return json.resource || json.url
		}
	} catch {}
	if (text.trim().startsWith('http')) {
		onProgress?.(100)
		return text.trim()
	}
	throw new Error('No URL returned from PixelVault')
}
