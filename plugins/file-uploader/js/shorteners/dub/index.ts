import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithDub(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (!storage.dubApiKey?.trim()) throw new Error('Dub.co API key is required')
	const baseUrl = getBaseUrl(storage.dubHost || 'https://api.dub.co')
	const res = await withTimeout(
		fetch(`${baseUrl}/links`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${storage.dubApiKey.trim()}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify({ url: targetUrl }),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`Dub.co shorten failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const shortUrl = data?.shortLink || data?.url
	if (!shortUrl) throw new Error('No URL returned from Dub.co')
	return shortUrl
}
