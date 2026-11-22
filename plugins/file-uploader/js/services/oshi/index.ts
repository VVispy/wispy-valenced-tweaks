import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToOshi(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.oshiHost?.trim() || 'oshi.at')
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) {
		form.append('f', blob, file.name)
	} else {
		form.append('f', { uri: file.uri, name: file.name, type: file.type } as any)
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(baseUrl, {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = (await res.text()).trim()
	if (!res.ok) throw new Error(`Oshi.at upload failed (${res.status}): ${text}`)
	const match = text.match(/https?:\/\/[^\s]+/i)
	if (!match?.[0]) throw new Error(`Oshi error: ${text}`)
	onProgress?.(100)
	return match[0]
}
