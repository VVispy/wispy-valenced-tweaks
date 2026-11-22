import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToEzHost(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.ezHostKey?.trim())
		throw new Error('E-Z Host API key is required')
	const baseUrl = getBaseUrl(storage.ezHostDomain?.trim() || 'api.e-z.host')
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
	const res = await withTimeout(
		fetch(`${baseUrl}/files`, {
			method: 'POST',
			headers: { key: storage.ezHostKey.trim() },
			body: form,
		}),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`E-Z Host upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const url = data?.imageUrl || data?.rawUrl
	if (!url) throw new Error(data?.error || 'No URL returned from E-Z Host')
	onProgress?.(100)
	return url
}
