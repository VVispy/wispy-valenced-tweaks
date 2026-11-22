import { getFileArrayBuffer } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToBuzzheavier(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(
		storage.buzzheavierHost?.trim() || 'w.buzzheavier.com',
	)
	const buf = await getFileArrayBuffer(file.uri)
	if (!buf) throw new Error('Could not read file for Buzzheavier PUT upload')

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/${encodeURIComponent(file.name)}`, {
			method: 'PUT',
			headers: { 'Content-Type': file.type || 'application/octet-stream' },
			body: buf,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok) throw new Error(`Buzzheavier failed (${res.status}): ${text}`)
	try {
		const json = JSON.parse(text)
		if (json?.data?.id) {
			onProgress?.(100)
			return `https://buzzheavier.com/${json.data.id}`
		}
		if (json?.id) {
			onProgress?.(100)
			return `https://buzzheavier.com/${json.id}`
		}
	} catch {}
	if (text.trim().startsWith('http')) {
		onProgress?.(100)
		return text.trim()
	}
	throw new Error('No URL returned from Buzzheavier')
}
