import { ShortenerType } from '../types'
import { shortenWithBitly } from './bitly'
import { shortenWithClckru } from './clckru'
import { shortenWithCleanuri } from './cleanuri'
import { shortenWithDub } from './dub'
import { shortenWithIsgd } from './isgd'
import { shortenWithKutt } from './kutt'
import { shortenWithShareX } from './sharex'
import { shortenWithTinyurl } from './tinyurl'
import { shortenWithTly } from './tly'
import { shortenWithZipline } from './zipline'
import type { FileUploaderStorage } from '../types'

export function isDomainExcluded(
	targetUrl: string,
	storage: FileUploaderStorage,
): boolean {
	try {
		const parsed = new URL(targetUrl)
		const host = parsed.hostname.toLowerCase()

		const defaultExcluded = [
			'discord.com',
			'discordapp.com',
			'discord.gg',
			'media.discordapp.net',
			'cdn.discordapp.com',
			'tenor.com',
			'giphy.com',
		]

		if (storage.ziplineHost) {
			const cleanHost = storage.ziplineHost
				.replace(/^https?:\/\//i, '')
				.replace(/\/+$/, '')
				.toLowerCase()
			if (cleanHost) defaultExcluded.push(cleanHost)
		}

		const custom = (storage.shortenExcludedDomains || '')
			.split(',')
			.map(s => s.trim().toLowerCase())
			.filter(Boolean)

		const allExcluded = [...defaultExcluded, ...custom]
		return allExcluded.some(d => host === d || host.endsWith(`.${d}`))
	} catch {
		return true
	}
}

export async function shortenUrl(
	targetUrl: string,
	storage: FileUploaderStorage,
): Promise<string> {
	switch (storage.shortenerService) {
		case ShortenerType.ZIPLINE:
			return shortenWithZipline(targetUrl, storage)
		case ShortenerType.KUTT:
			return shortenWithKutt(targetUrl, storage)
		case ShortenerType.DUB:
			return shortenWithDub(targetUrl, storage)
		case ShortenerType.TINYURL:
			return shortenWithTinyurl(targetUrl, storage)
		case ShortenerType.CLEANURI:
			return shortenWithCleanuri(targetUrl, storage)
		case ShortenerType.SHAREX:
			return shortenWithShareX(targetUrl, storage)
		case ShortenerType.ISGD:
			return shortenWithIsgd(targetUrl, storage)
		case ShortenerType.CLCKRU:
			return shortenWithClckru(targetUrl, storage)
		case ShortenerType.BITLY:
			return shortenWithBitly(targetUrl, storage)
		case ShortenerType.TLY:
			return shortenWithTly(targetUrl, storage)
		default:
			throw new Error(
				`Unsupported shortener service: ${storage.shortenerService}`,
			)
	}
}

export {
	shortenWithBitly,
	shortenWithClckru,
	shortenWithCleanuri,
	shortenWithDub,
	shortenWithIsgd,
	shortenWithKutt,
	shortenWithShareX,
	shortenWithTinyurl,
	shortenWithTly,
	shortenWithZipline,
}
