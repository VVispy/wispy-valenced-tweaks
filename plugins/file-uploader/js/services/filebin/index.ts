import { getFileBlob } from '../../lib/file'
import { getBaseUrl, makeRandomHex, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToFilebin(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.filebinHost?.trim() || 'filebin.net')
	const binId = makeRandomHex(8)
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

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/`, {
			method: 'POST',
			headers: {
				bin: binId,
				filename: file.name,
			},
			body: form,
		}),
		120000,
	)
	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`filebin.net failed (${res.status}): ${text}`)
	}
	onProgress?.(100)
	return `${baseUrl}/${binId}/${encodeURIComponent(file.name)}`
}
