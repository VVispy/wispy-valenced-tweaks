import { getFileBlob } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToGyazo(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const token = storage.gyazoAccessToken?.trim()
	if (!token) throw new Error('Gyazo access token is required')

	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('imagedata', blob, file.name)
	} else {
		form.append('imagedata', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
	}
	form.append('access_token', token)

	onProgress?.(50)
	const res = await withTimeout(
		fetch('https://upload.gyazo.com/api/upload', {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok) throw new Error(`Gyazo upload failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	const url = data?.url || data?.permalink_url
	if (!url) throw new Error('No URL returned from Gyazo')
	onProgress?.(100)
	return url
}
