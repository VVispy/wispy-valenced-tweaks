import { getFileBlob, isNativeUri } from '../../lib/file'
import {
	getBaseUrl,
	postFormWithProgress,
	withTimeout,
} from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToZipline(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.ziplineHost?.trim())
		throw new Error('Zipline host domain is required')
	if (!storage.ziplineToken?.trim())
		throw new Error('Zipline token is required')
	const baseUrl = getBaseUrl(storage.ziplineHost)
	const fileName = file.name || 'upload.bin'
	const mimeType = file.type || 'application/octet-stream'

	const blob =
		storage.chunkedUpload || !isNativeUri(file.uri)
			? await getFileBlob(file.uri)
			: null
	const totalSize = blob?.size || file.size || 0

	const shouldChunk =
		storage.chunkedUpload &&
		blob &&
		totalSize >
			Math.min((storage.chunkSizeMB || 50) * 1024 * 1024, 90 * 1024 * 1024)
	if (shouldChunk && blob) {
		const chunkSize = Math.max(
			1024 * 1024,
			Math.min((storage.chunkSizeMB || 50) * 1024 * 1024, 95 * 1024 * 1024),
		)
		const totalChunks = Math.max(1, Math.ceil(totalSize / chunkSize))
		let identifier: string | undefined

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize
			const end = Math.min(start + chunkSize, totalSize)
			const isLast = i === totalChunks - 1 || end >= totalSize
			const chunk = blob.slice(start, end, mimeType)

			const form = new FormData()
			form.append('file', chunk, fileName)

			const headers: Record<string, string> = {
				authorization: storage.ziplineToken.trim(),
				'content-range': `bytes ${start}-${end}/${totalSize}`,
				'x-zipline-p-filename': fileName.replace(/[^\x20-\x7E]/g, '_'),
				'x-zipline-p-content-type': mimeType,
				'x-zipline-p-content-length': `${totalSize}`,
				'x-zipline-p-lastchunk': isLast ? 'true' : 'false',
			}
			if (identifier) headers['x-zipline-p-identifier'] = identifier

			const pct = Math.round(((i + 1) / totalChunks) * 100)
			onProgress?.(pct)

			const res = await withTimeout(
				fetch(`${baseUrl}/api/upload/partial`, {
					method: 'POST',
					headers,
					body: form,
				}),
				120000,
				`Zipline chunk ${i + 1}/${totalChunks} timed out`,
			)
			if (!res.ok)
				throw new Error(
					`Zipline chunk upload failed (${res.status}): ${await res.text().catch(() => '')}`,
				)
			const json = await res.json()
			if (i === 0 && json?.partialIdentifier)
				identifier = json.partialIdentifier
			if (isLast) {
				const uploadedUrl =
					json?.files?.[0]?.url ||
					(typeof json?.files?.[0] === 'string' ? json.files[0] : null)
				if (uploadedUrl) return uploadedUrl
			}
		}
	}

	const form = new FormData()
	if (blob) {
		form.append('file', blob, fileName)
	} else {
		form.append('file', {
			uri: file.uri,
			name: fileName,
			type: mimeType,
		} as any)
	}

	const timeoutMs = Math.max(
		60000,
		Math.min(600000, Math.ceil((totalSize / (1024 * 1024)) * 3000)),
	)
	const res = await postFormWithProgress(
		`${baseUrl}/api/upload`,
		{ authorization: storage.ziplineToken.trim() },
		form,
		timeoutMs,
		'Zipline upload timed out',
		onProgress,
	)

	if (!res.ok) throw new Error(`Zipline upload failed (${res.status}): ${res.text}`)
	const data = JSON.parse(res.text)
	const url =
		data?.files?.[0]?.url ||
		(typeof data?.files?.[0] === 'string' ? data.files[0] : null)
	if (!url) throw new Error('No URL returned from Zipline')
	return url
}
