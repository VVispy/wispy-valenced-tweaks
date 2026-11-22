import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithCleanuri(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	const baseUrl = getBaseUrl(storage.cleanuriHost || 'https://cleanuri.com')
	const form = new URLSearchParams()
	form.append('url', targetUrl)
	const res = await withTimeout(
		fetch(`${baseUrl}/api/v1/shorten`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: form.toString(),
		}),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`CleanURI failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	if (!data?.result_url)
		throw new Error(data?.error || 'No URL returned from CleanURI')
	return data.result_url
}
