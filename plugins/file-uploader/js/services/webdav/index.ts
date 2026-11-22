import { getFileArrayBuffer } from '../../lib/file'
import { withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToWebdav(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (!storage.webdavUrl?.trim()) throw new Error('WebDAV URL is required')
	const buf = await getFileArrayBuffer(file.uri)
	if (!buf) throw new Error('Could not read file for WebDAV PUT upload')

	const baseUrl = storage.webdavUrl.trim().replace(/\/+$/, '')
	const dir = (storage.webdavDirectory || '').replace(/^\/+|\/+$/g, '')
	const encodedDir = dir
		? dir.split('/').map(encodeURIComponent).join('/') + '/'
		: ''
	const uploadUrl = `${baseUrl}/${encodedDir}${encodeURIComponent(file.name)}`

	const headers: Record<string, string> = {
		'Content-Type': file.type || 'application/octet-stream',
	}
	if (storage.webdavUser?.trim() && storage.webdavPass?.trim()) {
		const b64 =
			typeof btoa !== 'undefined'
				? btoa(`${storage.webdavUser.trim()}:${storage.webdavPass.trim()}`)
				: ''
		if (b64) headers.Authorization = `Basic ${b64}`
	}

	onProgress?.(50)
	const res = await withTimeout(
		fetch(uploadUrl, { method: 'PUT', headers, body: buf }),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`WebDAV upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)

	try {
		const origin = new URL(storage.webdavUrl).origin
		const relativePath = dir ? `${dir}/${file.name}` : file.name
		const ocsUrl = `${origin}/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json`
		const ocsHeaders: Record<string, string> = {
			'OCS-APIRequest': 'true',
			'Content-Type': 'application/x-www-form-urlencoded',
		}
		if (headers.Authorization) ocsHeaders.Authorization = headers.Authorization
		const ocsRes = await fetch(ocsUrl, {
			method: 'POST',
			headers: ocsHeaders,
			body: `path=/${encodeURIComponent(relativePath)}&shareType=3&permissions=1`,
		})
		if (ocsRes.ok) {
			const ocsData = await ocsRes.json()
			const token = ocsData?.ocs?.data?.token
			if (token) {
				onProgress?.(100)
				return `${origin}/s/${token}`
			}
		}
	} catch {}

	onProgress?.(100)
	return uploadUrl
}
