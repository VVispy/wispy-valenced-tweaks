import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

async function getBestGofileServer(customHost?: string): Promise<string> {
	if (customHost?.trim()) return getBaseUrl(customHost.trim())
	try {
		const sRes = await withTimeout(fetch('https://api.gofile.io/servers'), 5000)
		if (sRes.ok) {
			const sData = await sRes.json()
			const server = sData?.data?.servers?.[0]?.name
			if (server) return `https://${server}.gofile.io`
		}
	} catch {}
	return 'https://upload.gofile.io'
}

export async function uploadToGofile(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	const baseUrl = await getBestGofileServer(storage.gofileHost)
	const form = new FormData()
	if (storage.gofileToken?.trim())
		form.append('token', storage.gofileToken.trim())
	if (storage.gofileFolderId?.trim())
		form.append('folderId', storage.gofileFolderId.trim())
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
		fetch(`${baseUrl}/contents/uploadfile`, { method: 'POST', body: form }),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`GoFile upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	if (data?.status !== 'ok')
		throw new Error(data?.error || data?.status || 'GoFile upload failed')
	const url =
		data?.data?.downloadPage ||
		(data?.data?.code ? `https://gofile.io/d/${data.data.code}` : '')
	if (!url) throw new Error('No URL returned from GoFile')
	onProgress?.(100)
	return url
}
