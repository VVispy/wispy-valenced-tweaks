import { hexFromBytes, hmacSha256Bytes, sha256Hex } from '../../lib/crypto'
import { getFileArrayBuffer } from '../../lib/file'
import { getBaseUrl, makeRandomHex, withTimeout } from '../../lib/http'
import type { FileInfo } from '../../lib/file'
import type { FileUploaderStorage } from '../../types'

export async function uploadToS3(
	file: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (percent: number) => void,
): Promise<string> {
	if (
		!storage.s3Endpoint?.trim() ||
		!storage.s3Bucket?.trim() ||
		!storage.s3AccessKeyId?.trim() ||
		!storage.s3SecretAccessKey?.trim()
	) {
		throw new Error(
			'S3 endpoint, bucket, access key ID, and secret access key are required',
		)
	}
	const buf = await getFileArrayBuffer(file.uri)
	if (!buf) throw new Error('Could not read file for S3 upload')

	const endpoint = new URL(getBaseUrl(storage.s3Endpoint))
	const region = storage.s3Region?.trim() || 'auto'
	const bucket = storage.s3Bucket.trim()
	const ext = file.name.includes('.')
		? file.name.slice(file.name.lastIndexOf('.'))
		: ''
	const objectKey = `${Date.now()}-${makeRandomHex(8)}${ext}`

	const host = storage.s3ForcePathStyle
		? endpoint.host
		: `${bucket}.${endpoint.host}`
	const canonicalUri = storage.s3ForcePathStyle
		? `/${bucket}/${encodeURIComponent(objectKey)}`
		: `/${encodeURIComponent(objectKey)}`

	const uploadUrl = `${endpoint.protocol}//${host}${canonicalUri}`

	const now = new Date()
	const pad = (n: number) => String(n).padStart(2, '0')
	const amzDate = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
	const dateStamp = amzDate.slice(0, 8)

	onProgress?.(30)
	const payloadHash = await sha256Hex(buf)
	const mime = file.type || 'application/octet-stream'

	const canonicalHeaders = `content-type:${mime}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
	const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

	const canonicalRequest = [
		'PUT',
		canonicalUri,
		'',
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join('\n')
	const scope = `${dateStamp}/${region}/s3/aws4_request`
	const stringToSign = [
		'AWS4-HMAC-SHA256',
		amzDate,
		scope,
		await sha256Hex(canonicalRequest),
	].join('\n')

	const kDate = await hmacSha256Bytes(
		`AWS4${storage.s3SecretAccessKey.trim()}`,
		dateStamp,
	)
	const kRegion = await hmacSha256Bytes(kDate, region)
	const kService = await hmacSha256Bytes(kRegion, 's3')
	const kSigning = await hmacSha256Bytes(kService, 'aws4_request')
	const signature = hexFromBytes(await hmacSha256Bytes(kSigning, stringToSign))

	const auth = `AWS4-HMAC-SHA256 Credential=${storage.s3AccessKeyId.trim()}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

	onProgress?.(60)
	const res = await withTimeout(
		fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				Authorization: auth,
				'Content-Type': mime,
				'x-amz-content-sha256': payloadHash,
				'x-amz-date': amzDate,
			},
			body: buf,
		}),
		120000,
	)
	if (!res.ok)
		throw new Error(
			`S3 upload failed (${res.status}): ${await res.text().catch(() => '')}`,
		)

	onProgress?.(100)
	if (storage.s3PublicUrl?.trim()) {
		return `${storage.s3PublicUrl.trim().replace(/\/+$/, '')}/${objectKey}`
	}
	return uploadUrl
}
