import { getFileBlob } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToKrakenFiles(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const apiKey = storage.krakenfilesApiKey?.trim()
	if (!apiKey) throw new Error('KrakenFiles API key is required')

	onProgress?.(20)
	const srvRes = await withTimeout(
		fetch('https://krakenfiles.com/api/server/available', {
			method: 'POST',
		}),
		30000,
	)
	if (!srvRes.ok)
		throw new Error(`KrakenFiles server lookup failed (${srvRes.status})`)
	const srvData = await srvRes.json()
	const serverUrl = srvData?.data?.serverUrl
	if (!serverUrl) throw new Error('No server URL returned from KrakenFiles')

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
	form.append('api_key', apiKey)

	onProgress?.(50)
	const res = await withTimeout(
		fetch(serverUrl, {
			method: 'POST',
			body: form,
		}),
		120000,
	)
	const text = await res.text()
	if (!res.ok)
		throw new Error(`KrakenFiles upload failed (${res.status}): ${text}`)
	const data = JSON.parse(text)
	const url = data?.data?.url
	if (!url) throw new Error(data?.message || 'No URL returned from KrakenFiles')
	onProgress?.(100)
	return url
}
