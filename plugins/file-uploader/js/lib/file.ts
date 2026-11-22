export interface FileInfo {
	uri: string
	name: string
	type: string
	size: number
}

declare const valenced: any

export async function getFileBlob(uri: string): Promise<Blob | null> {
	if (!uri) return null
	try {
		const res = await fetch(uri)
		const b = await res.blob()
		if (b && b.size > 0) return b
	} catch {}

	try {
		return await new Promise<Blob>((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open('GET', uri, true)
			xhr.responseType = 'blob'
			xhr.onload = () => {
				if (xhr.response) resolve(xhr.response)
				else reject(new Error('Empty blob'))
			}
			xhr.onerror = () => reject(new Error('XHR failed'))
			xhr.send()
		})
	} catch {
		return null
	}
}

export async function getFileArrayBuffer(
	uri: string,
): Promise<ArrayBuffer | null> {
	if (!uri) return null
	try {
		const res = await fetch(uri)
		const buf = await res.arrayBuffer()
		if (buf && buf.byteLength > 0) return buf
	} catch {}

	try {
		return await new Promise<ArrayBuffer>((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open('GET', uri, true)
			xhr.responseType = 'arraybuffer'
			xhr.onload = () => {
				if (xhr.response) resolve(xhr.response)
				else reject(new Error('Empty buffer'))
			}
			xhr.onerror = () => reject(new Error('XHR failed'))
			xhr.send()
		})
	} catch {
		return null
	}
}

export function extractFileInfo(raw: any): FileInfo {
	const item = raw?.item ?? raw?.file ?? raw?.upload?.item ?? raw
	const uri =
		item?.uri ?? item?.path ?? item?.url ?? raw?.uri ?? raw?.path ?? ''
	let name = item?.filename ?? item?.name ?? raw?.filename ?? raw?.name ?? ''
	if (!name && uri) {
		const clean = uri.split('?')[0].split('#')[0]
		const idx = clean.lastIndexOf('/')
		if (idx !== -1 && idx < clean.length - 1) {
			name = decodeURIComponent(clean.substring(idx + 1))
		}
	}
	if (!name) name = 'upload.bin'

	const type =
		item?.mimeType ??
		item?.type ??
		raw?.mimeType ??
		raw?.type ??
		'application/octet-stream'
	const size = Number(
		item?.fileSize ?? item?.size ?? raw?.fileSize ?? raw?.size ?? 0,
	)
	return { uri, name, type, size }
}

function getRev(): any {
	return typeof valenced !== 'undefined' ? valenced : (globalThis as any).valenced
}

function findDiscordModule(...props: string[]): any {
	try {
		const finders = getRev()?.modules?.finders
		return finders?.lookupModule?.(finders.filters.withProps(...props))?.[0]
	} catch {
		return undefined
	}
}

export function isNativeUri(uri: string): boolean {
	return /^(content|file):\/\//i.test(uri)
}

export async function resolveFileSize(info: FileInfo): Promise<number> {
	if (info.size > 0) return info.size
	if (!info.uri) return 0
	try {
		const size = Number(
			await findDiscordModule('getFileSize', 'getFileInfo')?.getFileSize?.(
				info.uri,
			),
		)
		if (size > 0) return size
	} catch {}
	try {
		const blob = await getFileBlob(info.uri)
		if (blob?.size) return blob.size
	} catch {}
	return 0
}

export function getDiscordUploadLimitBytes(rev: any): number {
	const MB = 1024 * 1024
	let currentUser: any
	try {
		currentUser = rev?.discord?.flux?.Stores?.UserStore?.getCurrentUser?.()
	} catch {}
	try {
		const limit = Number(
			findDiscordModule('getUserMaxFileSize')?.getUserMaxFileSize?.(
				currentUser,
			),
		)
		if (limit > 0) return limit
	} catch {}
	if (currentUser?.premiumType === 2) return 500 * MB
	if (currentUser?.premiumType) return 50 * MB
	return 10 * MB
}

export function removeOffloadedAttachments(
	args: any[],
	message: any,
	options: any,
	offloadedUris: Set<string>,
): void {
	const filterList = (arr: any[]) =>
		arr.filter(a => {
			const info = extractFileInfo(a)
			return !offloadedUris.has(info.uri)
		})

	if (message && typeof message === 'object') {
		if (Array.isArray(message.attachmentsToUpload)) {
			message.attachmentsToUpload = filterList(message.attachmentsToUpload)
		}
		if (Array.isArray(message.attachments)) {
			message.attachments = filterList(message.attachments)
		}
		if (Array.isArray(message.files)) {
			message.files = filterList(message.files)
		}
	}

	if (options && typeof options === 'object') {
		if (Array.isArray(options.attachmentsToUpload)) {
			options.attachmentsToUpload = filterList(options.attachmentsToUpload)
		}
		if (Array.isArray(options.attachments)) {
			options.attachments = filterList(options.attachments)
		}
		if (Array.isArray(options.files)) {
			options.files = filterList(options.files)
		}
	}

	for (let i = 0; i < args.length; i++) {
		const a = args[i]
		if (a && typeof a === 'object') {
			if (Array.isArray(a.attachmentsToUpload)) {
				a.attachmentsToUpload = filterList(a.attachmentsToUpload)
			}
			if (Array.isArray(a.attachments)) {
				a.attachments = filterList(a.attachments)
			}
			if (Array.isArray(a.files)) {
				a.files = filterList(a.files)
			}
		}
	}
}

export function clearNativeAttachments(
	args: any[],
	message: any,
	options: any,
	channelId?: string,
): void {
	if (message && typeof message === 'object') {
		message.attachmentsToUpload = undefined
		message.attachments = undefined
		message.files = undefined
		if (Array.isArray(message.attachments)) message.attachments = []
		if (Array.isArray(message.attachmentsToUpload))
			message.attachmentsToUpload = []
	}

	if (options && typeof options === 'object') {
		options.attachmentsToUpload = undefined
		options.attachments = undefined
		options.files = undefined
		if (Array.isArray(options.attachments)) options.attachments = []
		if (Array.isArray(options.attachmentsToUpload))
			options.attachmentsToUpload = []
	}

	for (let i = 0; i < args.length; i++) {
		const a = args[i]
		if (a && typeof a === 'object') {
			if ('attachmentsToUpload' in a) a.attachmentsToUpload = undefined
			if ('attachments' in a) a.attachments = undefined
			if ('files' in a) a.files = undefined
		}
	}

	if (channelId) {
		try {
			const rev =
				typeof valenced !== 'undefined'
					? valenced
					: (globalThis as any).valenced
			const dispatcher =
				rev?.discord?.flux?.Dispatcher ?? rev?.discord?.common?.flux?.Dispatcher
			if (dispatcher?.dispatch) {
				dispatcher.dispatch({
					type: 'UPLOAD_ATTACHMENT_CLEAR_ALL',
					channelId,
					draftType: 0,
				})
				dispatcher.dispatch({
					type: 'UPLOAD_CLEAR',
					channelId,
				})
			}
		} catch {}
	}
}
