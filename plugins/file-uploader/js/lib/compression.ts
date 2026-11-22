import type { FileUploaderStorage } from '../types'
import type { FileInfo } from './file'

export async function processFileCompression(
	file: FileInfo,
	storage: FileUploaderStorage,
): Promise<FileInfo> {
	if (!storage.compressFiles) {
		return file
	}

	const isImage =
		/^image\/(jpeg|jpg|png|webp)/i.test(file.type) ||
		/\.(jpe?g|png|webp)$/i.test(file.name)
	if (!isImage) {
		return file
	}

	const quality = Math.max(
		0.1,
		Math.min(1.0, (storage.compressionQuality || 80) / 100),
	)

	try {
		if (typeof document !== 'undefined' && document.createElement) {
			const img = new Image()
			img.src = file.uri
			await new Promise((res, rej) => {
				img.onload = res
				img.onerror = rej
			})
			const canvas = document.createElement('canvas')
			canvas.width = img.naturalWidth || img.width
			canvas.height = img.naturalHeight || img.height
			const ctx = canvas.getContext('2d')
			if (ctx) {
				ctx.drawImage(img, 0, 0)
				const targetMime =
					file.type === 'image/png' ? 'image/png' : 'image/jpeg'
				const compressedBlob: Blob = await new Promise(res => {
					canvas.toBlob(b => res(b || new Blob()), targetMime, quality)
				})
				if (
					compressedBlob &&
					compressedBlob.size > 0 &&
					compressedBlob.size < file.size
				) {
					const newUri = URL.createObjectURL(compressedBlob)
					return {
						uri: newUri,
						name: file.name,
						type: targetMime,
						size: compressedBlob.size,
					}
				}
			}
		}
	} catch {}

	return file
}
