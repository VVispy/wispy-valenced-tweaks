import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToNest(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.nestToken?.trim()) throw new Error('Nest auth token is required')
	const baseUrl = getBaseUrl(storage.nestHost?.trim() || 'nest.rip')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('files', blob, file.name)
		form.append('file', blob, file.name)
	} else {
		form.append('files', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
		form.append('file', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(`${baseUrl}/api/files/upload`, {
			method: 'POST',
			headers: { Authorization: storage.nestToken.trim() },
			body: form,
		}),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`Nest upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	if (!data?.fileURL) throw new Error('No URL returned from Nest')
	onProgress?.(100)
	return data.fileURL
}
