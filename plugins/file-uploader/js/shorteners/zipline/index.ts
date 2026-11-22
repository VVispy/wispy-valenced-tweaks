import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithZipline(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (!storage.ziplineHost?.trim())
		throw new Error('Zipline host domain is required')
	if (!storage.ziplineToken?.trim())
		throw new Error('Zipline token is required')
	const baseUrl = getBaseUrl(storage.ziplineHost)
	const res = await withTimeout(
		fetch(`${baseUrl}/api/user/urls`, {
			method: 'POST',
			headers: {
				authorization: storage.ziplineToken.trim(),
				'content-type': 'application/json',
			},
			body: JSON.stringify({ destination: targetUrl }),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`Zipline shorten failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	if (!data?.url) throw new Error('No URL returned from Zipline shortener')
	return data.url
}
