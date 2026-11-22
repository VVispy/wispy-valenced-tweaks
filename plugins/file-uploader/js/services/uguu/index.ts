import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToUguu(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.uguuHost?.trim() || 'uguu.se')
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
		fetch(`${baseUrl}/api.php?d=upload-api`, {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = (await res.text()).trim()
	if (!res.ok) throw new Error(`Uguu upload failed (${res.status}): ${text}`)
	if (!text.startsWith('http')) throw new Error(`Uguu error: ${text}`)
	onProgress?.(100)
	return text
}
