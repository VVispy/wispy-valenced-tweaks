import type { ChangelogEntry } from '../../../shared/changelog'

export const CHANGELOG: ChangelogEntry[] = [
	{
		version: '1.4.0',
		date: '2026-11-09',
		title: 'Expanded Providers & API Integrations',
		changes: [
			'Added 7 new upload services: Uguu.se, Pomf (pomf.lain.la), Oshi.at, Imgur, Cloudinary, Gyazo, and KrakenFiles.',
			'Added 4 new URL shorteners: is.gd / v.gd, clck.ru, Bitly (v4 OAuth API), and T.ly API.',
			'Added direct native disk-read storage fallback for rock-solid settings initialization in Valenced.',
			'Optimized chat message attachment clearing and upload progress reporting.',
		],
	},
	{
		version: '1.3.0',
		date: '2026-11-08',
		title: 'Storage & Attachment Interception Overhaul',
		changes: [
			'Fixed asynchronous storage caching bug so configured services and credentials persist and load reliably on startup.',
			'Added comprehensive chat attachment interception capturing files from message options, arguments, and native upload stores.',
			'Added automatic clearing of native Discord upload tasks upon successful external cloud upload.',
			'Refactored PixelDrain to use authenticated multipart upload without requiring memory array buffers.',
			'Fixed filebin.net upload endpoint with proper bin headers and content streaming.',
			'Added robust XMLHttpRequest fallbacks for Android local content URI byte reading.',
			'Upgraded 20MB limit bypass to patch native upload ability checks across the client.',
		],
	},
	{
		version: '1.2.0',
		date: '2026-11-08',
		title: 'Modular Architecture, Immich Public Sharing & Chunking',
		changes: [
			'Refactored every service and shortener into dedicated subdirectories with isolated API modules.',
			'Added Immich support with automatic public shared link creation for recipient access without credentials.',
			'Added client-side Discord 20MB upload limit bypass hook allowing file picking up to 1GB for non-nitro users.',
			'Added chunked upload and streaming support for large payloads with real-time percentage progress toasts.',
			'Added optional image compression controls with user-configurable quality (disabled by default to prevent automatic compression).',
		],
	},
	{
		version: '1.1.1',
		date: '2026-10-18',
		title: 'Alpha Release',
		changes: [
			'Upload attachments and files directly to 18+ services including Zipline, E-Z Host, Nest, S3, Catbox, 0x0, Litterbox, GoFile, tmpfiles, buzzheavier, temp.sh, filebin, PixelVault, PixelDrain, ShareX, WebDAV, and Immich.',
			'Fully configurable hosts, endpoints, tokens, and credentials with zero assumed domains.',
			'Built-in URL shortener with support for Zipline, Kutt, CleanURI, TinyURL, Dub.co, and ShareX.',
			'Automatic bypass of Discord upload limit with customizable file size threshold and clipboard integration.',
		],
	},
]
