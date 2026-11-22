import { getFileBlob } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToCloudinary(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const cloudName = storage.cloudinaryCloudName?.trim()
	if (!cloudName) throw new Error('Cloudinary cloud name is required')

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

	if (storage.cloudinaryUploadPreset?.trim()) {
		form.append('upload_preset', storage.cloudinaryUploadPreset.trim())
	}
	if (storage.cloudinaryApiKey?.trim()) {
		form.append('api_key', storage.cloudinaryApiKey.trim())
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(
			`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
			{
				method: 'POST',
				body: form,
			},
		),
		120000,
	)
	const text = await res.text()
	if (!res.ok)
		throw new Error(`Cloudinary upload failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	const url = data?.secure_url || data?.url
	if (!url)
		throw new Error(data?.error?.message || 'No URL returned from Cloudinary')
	onProgress?.(100)
	return url
}
