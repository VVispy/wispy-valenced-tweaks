import { getBaseUrl, withTimeout } from '../../lib/http'
import type { FileUploaderStorage } from '../../types'

export async function shortenWithIsgd(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	const host = storage.isgdHost?.trim() || 'is.gd'
	const baseUrl = getBaseUrl(host)
	const res = await withTimeout(
		fetch(
			`${baseUrl}/create.php?format=json&url=${encodeURIComponent(targetUrl)}`,
		),
		15000,
	)
	if (!res.ok)
		throw new Error(
			`is.gd failed (${res.status}): ${await res.text().catch(() => '')}`,
		)
	const data = await res.json()
	if (data?.errorcode || !data?.shorturl)
		throw new Error(data?.errormessage || 'No short URL returned from is.gd')
	return data.shorturl
}
