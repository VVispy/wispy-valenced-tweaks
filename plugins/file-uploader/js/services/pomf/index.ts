import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToPomf(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.pomfHost?.trim() || 'pomf.lain.la')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('files[]', blob, file.name)
	} else {
		form.append('files[]', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/upload.php`, {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok) throw new Error(`Pomf upload failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	const fileObj = data?.files?.[0]
	const url = fileObj?.url
	if (!url) throw new Error(data?.description || 'No URL returned from Pomf')
	onProgress?.(100)
	return url.startsWith('http') ? url : `${baseUrl}/${url.replace(/^\/+/, '')}`
}
