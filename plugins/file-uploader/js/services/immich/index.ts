import { getFileBlob } from '../../lib/file'
import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToImmich(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.immichUrl?.trim() || !storage.immichApiKey?.trim()) {
		throw new Error('Immich instance URL and API Key are required')
	}
	const baseUrl = getBaseUrl(storage.immichUrl)
	const form = new FormData()
	const blob = await getFileBlob(file.uri)
	if (blob) form.append('assetData', blob, file.name)
	else
		form.append('assetData', {
			uri: file.uri,
			name: file.name,
			type: file.type,
		} as any)

	form.append('deviceAssetId', `${file.name}-${Date.now()}`)
	form.append('deviceId', 'Valenced-FileUploader')
	form.append('fileCreatedAt', new Date().toISOString())
	form.append('fileModifiedAt', new Date().toISOString())
	form.append('isFavorite', 'false')

	onProgress?.(30)
	const res = await withTimeout(
		fetch(`${baseUrl}/api/assets`, {
			method: 'POST',
			headers: { 'x-api-key': storage.immichApiKey.trim() },
			body: form,
		}),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`Immich upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const assetId = data?.id
	if (!assetId) throw new Error('Immich did not return an asset ID')

	onProgress?.(70)

	if (storage.immichCreatePublicShare !== false) {
		try {
			const shareRes = await withTimeout(
				fetch(`${baseUrl}/api/shared-links`, {
					method: 'POST',
					headers: {
						'x-api-key': storage.immichApiKey.trim(),
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						type: 'INDIVIDUAL',
						assetIds: [assetId],
						allowDownload: true,
					}),
				}),
				15000,
			)
			if (shareRes.ok) {
				const shareData = await shareRes.json()
				const shareKey = shareData?.key
				if (shareKey) {
					onProgress?.(100)
					return `${baseUrl}/share/${shareKey}`
				}
			}
		} catch {}
	}

	onProgress?.(100)
	return `${baseUrl}/api/assets/${assetId}/original`
}
