export function getBaseUrl(url: string): string {
	let cleaned = url.trim().replace(/\/+$/, '')
	if (!/^https?:\/\//i.test(cleaned)) {
		cleaned = `https://${cleaned}`
	}
	return cleaned
}

export function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	msg = 'Request timed out',
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(msg)), ms)
		promise.then(
			val => {
				clearTimeout(timer)
				resolve(val)
			},
			err => {
				clearTimeout(timer)
				reject(err)
			},
		)
	})
}

export function makeRandomHex(length = 16): string {
	const chars = '0123456789abcdef'
	let res = ''
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const bytes = new Uint8Array(length)
		crypto.getRandomValues(bytes)
		for (let i = 0; i < length; i++) res += chars[bytes[i] % 16]
	} else {
		for (let i = 0; i < length; i++)
			res += chars[Math.floor(Math.random() * 16)]
	}
	return res
}

export function postFormWithProgress(
	url: string,
	headers: Record<string, string>,
	body: FormData,
	timeoutMs: number,
	timeoutMsg: string,
	onProgress?: (percent: number) => void,
): Promise<{ ok: boolean; status: number; text: string }> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open('POST', url, true)
		for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
		xhr.timeout = timeoutMs
		let lastStep = 0
		xhr.upload.onprogress = e => {
			if (!e.total) return
			const step = Math.min(90, Math.floor((e.loaded / e.total) * 10) * 10)
			if (step > lastStep) {
				lastStep = step
				onProgress?.(step)
			}
		}
		xhr.onload = () =>
			resolve({
				ok: xhr.status >= 200 && xhr.status < 300,
				status: xhr.status,
				text: String(xhr.responseText ?? ''),
			})
		xhr.onerror = () => reject(new Error('Network request failed'))
		xhr.ontimeout = () => reject(new Error(timeoutMsg))
		xhr.send(body)
	})
}
