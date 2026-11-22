import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToTmpfiles(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.tmpfilesHost?.trim() || 'tmpfiles.org')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('input', blob, file.name)
		form.append('file', blob, file.name)
	} else {
		form.append('input', {
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
		fetch(`${baseUrl}/api/v1/upload`, { method: 'POST', body: form }),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`tmpfiles.org failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const url = data?.data?.url
	if (!url || data?.status !== 'success')
		throw new Error('No URL returned from tmpfiles.org')
	onProgress?.(100)
	return url.includes('tmpfiles.org/') && !url.includes('/dl/')
		? url.replace(/tmpfiles\.org\/(\d+)/, 'tmpfiles.org/dl/$1')
		: url
}
