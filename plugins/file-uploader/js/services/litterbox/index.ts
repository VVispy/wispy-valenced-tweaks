import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToLitterbox(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(
		storage.litterboxHost?.trim() || 'litterbox.catbox.moe',
	)
	const form = new FormData()
	form.append('reqtype', 'fileupload')
	form.append('time', storage.litterboxExpiry || '24h')
	const blob = await getFileBlob(file.uri)
	if (blob) form.append('fileToUpload', blob, file.name)
	else
		form.append('fileToUpload', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/resources/internals/api.php`, {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = (await res.text()).trim()
	if (!res.ok)
		throw new Error(`Litterbox upload failed (${res.status}): ${text}`)
	if (!text.startsWith('http')) throw new Error(`Litterbox error: ${text}`)
	onProgress?.(100)
	return text
}
