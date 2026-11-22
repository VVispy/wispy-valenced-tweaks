import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToPixelDrain(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.pixelDrainKey?.trim()) {
		throw new Error('PixelDrain API key is required')
	}
	const baseUrl = getBaseUrl(storage.pixelDrainHost?.trim() || 'pixeldrain.com')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('file', blob, file.name)
	} else {
		form.append('file', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
	}
	form.append('name', file.name)

	const headers: Record<string, string> = {}
	const b64 =
		typeof btoa !== 'undefined' ? btoa(`:${storage.pixelDrainKey.trim()}`) : ''
	if (b64) {
		headers.Authorization = `Basic ${b64}`
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/api/file`, {
			method: 'POST',
			headers,
			body: form,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok) throw new Error(`PixelDrain failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	if (!data?.id)
		throw new Error(data?.message || 'No file ID returned from PixelDrain')
	onProgress?.(100)
	return `${baseUrl}/u/${data.id}`
}
