import { getFileBlob } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToImgur(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const authHeader = storage.imgurBearerToken?.trim()
		? `Bearer ${storage.imgurBearerToken.trim()}`
		: storage.imgurClientId?.trim()
			? `Client-ID ${storage.imgurClientId.trim()}`
			: null

	if (!authHeader)
		throw new Error('Imgur Client-ID or Bearer token is required')

	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('image', blob, file.name)
	} else {
		form.append('image', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)
	}
	form.append('name', file.name)
	form.append('title', file.name)

	onProgress?.(50)
	const res = await withTimeout(
		fetch('https://api.imgur.com/3/image', {
			method: 'POST',
			headers: {
				Authorization: authHeader,
			},
			body: form,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok) throw new Error(`Imgur upload failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	const link = data?.data?.link
	if (!link) throw new Error(data?.data?.error || 'No link returned from Imgur')
	onProgress?.(100)
	return link
}
