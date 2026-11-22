import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToCatbox(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.catboxHost?.trim() || 'catbox.moe')
	const form = new FormData()
	form.append('reqtype', 'fileupload')
	if (storage.catboxUserhash?.trim())
		form.append('userhash', storage.catboxUserhash.trim())
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
		fetch(`${baseUrl}/user/api.php`, { method: 'POST', body: form }),
		120000,
	)
	const text = (await res.text()).trim()
	if (!res.ok) throw new Error(`Catbox upload failed (${res.status}): ${text}`)
	if (!text.startsWith('http')) throw new Error(`Catbox error: ${text}`)
	onProgress?.(100)
	return text
}
