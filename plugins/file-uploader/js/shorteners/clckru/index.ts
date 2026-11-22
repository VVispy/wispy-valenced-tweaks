import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithClckru(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	const host = storage.clckruHost?.trim() || 'clck.ru'
	const baseUrl = getBaseUrl(host)
	const res = await withTimeout(
		fetch(`${baseUrl}/--?url=${encodeURIComponent(targetUrl)}`),
		15000,
	)
	const text = (await res.text()).trim()
	if (!res.ok || !text.startsWith('http'))
		throw new Error(`clck.ru failed: ${text}`)
	return text
}
