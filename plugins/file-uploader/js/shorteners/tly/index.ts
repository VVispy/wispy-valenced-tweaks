import { withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithTly(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (!storage.tlyApiKey?.trim()) throw new Error('T.ly API token is required')

	const res = await withTimeout(
		fetch('https://t.ly/api/v1/link/shorten', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${storage.tlyApiKey.trim()}`,
				'content-type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({ long_url: targetUrl }),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`T.ly failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	const url = data?.short_url
	if (!url) throw new Error(data?.message || 'No URL returned from T.ly')
	return url
}
