import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToTempSh(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.tempshHost?.trim() || 'temp.sh')
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
		fetch(`${baseUrl}/upload`, { method: 'POST', body: form }),
		120000,
	)
	const text = (await res.text()).trim()
	if (!res.ok) throw new Error(`temp.sh failed (${res.status}): ${text}`)
	if (!text.startsWith('http')) throw new Error(`temp.sh error: ${text}`)
	onProgress?.(100)
	return text
}
