import { withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithTinyurl(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	if (storage.tinyurlApiKey?.trim()) {
		const res = await withTimeout(
			fetch('https://api.tinyurl.com/create', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${storage.tinyurlApiKey.trim()}`,
					'content-type': 'application/json',
				},
				body: JSON.stringify({ url: targetUrl, domain: 'tinyurl.com' }),
			}),
			15000,
		)
		if (!res.ok)
			throw new Error(
				`TinyURL API failed (${res.status}): ${await res.text().catch(() => '')}`,
			)
		const data = await res.json()
		const tiny = data?.data?.tiny_url
		if (!tiny) throw new Error('No URL returned from TinyURL API')
		return tiny
	}

	const res = await withTimeout(
		fetch(
			`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`,
		),
		15000,
	)
	const text = (await res.text()).trim()
	if (!res.ok || !text.startsWith('http'))
		throw new Error(`TinyURL failed: ${text}`)
	return text
}
