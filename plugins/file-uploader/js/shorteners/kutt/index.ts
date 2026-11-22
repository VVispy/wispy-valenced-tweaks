import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithKutt(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (!storage.kuttApiKey?.trim()) throw new Error('Kutt API key is required')
	const baseUrl = getBaseUrl(storage.kuttHost || 'https://kutt.it')
	const res = await withTimeout(
		fetch(`${baseUrl}/api/v2/links`, {
			method: 'POST',
			headers: {
				'X-API-KEY': storage.kuttApiKey.trim(),
				'content-type': 'application/json',
			},
			body: JSON.stringify({ target: targetUrl }),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`Kutt shorten failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const link = data?.link || data?.address
	if (!link) throw new Error('No URL returned from Kutt')
	return link
}
