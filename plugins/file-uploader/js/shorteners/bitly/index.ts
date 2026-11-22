import { withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithBitly(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (!storage.bitlyApiKey?.trim())
		throw new Error('Bitly generic access token is required')

	const payload: Record<string, string> = {
		long_url: targetUrl,
	}
	if (storage.bitlyDomain?.trim()) {
		payload.domain = storage.bitlyDomain.trim()
	}

	const res = await withTimeout(
		fetch('https://api-ssl.bitly.com/v4/shorten', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${storage.bitlyApiKey.trim()}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(payload),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`Bitly failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const link = data?.link
	if (!link) throw new Error(data?.description || 'No link returned from Bitly')
	return link
}
