import { processFileCompression } from '../lib/compression'
import { ServiceType } from '../types'
import { uploadTo0x0 } from './0x0'
import { uploadToBuzzheavier } from './buzzheavier'
import { uploadToCatbox } from './catbox'
import { uploadToCloudinary } from './cloudinary'
import { uploadToEncryptingHost } from './encryptinghost'
import { uploadToEzHost } from './ezhost'
import { uploadToFilebin } from './filebin'
import { uploadToGofile } from './gofile'
import { uploadToGyazo } from './gyazo'
import { uploadToImgur } from './imgur'
import { uploadToImmich } from './immich'
import { uploadToKrakenFiles } from './krakenfiles'
import { uploadToLitterbox } from './litterbox'
import { uploadToNest } from './nest'
import { uploadToOshi } from './oshi'
import { uploadToPixelDrain } from './pixeldrain'
import { uploadToPixelVault } from './pixelvault'
import { uploadToPomf } from './pomf'
import { uploadToS3 } from './s3'
import { uploadToShareX } from './sharex'
import { uploadToTempSh } from './tempsh'
import { uploadToTmpfiles } from './tmpfiles'
import { uploadToUguu } from './uguu'
import { uploadToWebdav } from './webdav'
import { uploadToZipline } from './zipline'
import type { FileInfo } from '../lib/file'
import type { FileUploaderStorage } from '../types'

export interface UploadResult {
	url: string
	name: string
}

export function isServiceConfigured(storage: FileUploaderStorage): boolean {
	switch (storage.serviceType) {
		case ServiceType.ZIPLINE:
			return Boolean(
				storage.ziplineHost?.trim() && storage.ziplineToken?.trim(),
			)
		case ServiceType.EZHOST:
			return Boolean(storage.ezHostKey?.trim())
		case ServiceType.NEST:
			return Boolean(storage.nestToken?.trim())
		case ServiceType.ENCRYPTINGHOST:
			return Boolean(storage.encryptingHostKey?.trim())
		case ServiceType.S3:
			return Boolean(
				storage.s3Endpoint?.trim() &&
					storage.s3Bucket?.trim() &&
					storage.s3AccessKeyId?.trim() &&
					storage.s3SecretAccessKey?.trim(),
			)
		case ServiceType.CATBOX:
			return true
		case ServiceType.ZEROX0:
			return true
		case ServiceType.LITTERBOX:
			return true
		case ServiceType.GOFILE:
			return true
		case ServiceType.TMPFILES:
			return true
		case ServiceType.BUZZHEAVIER:
			return true
		case ServiceType.TEMPSH:
			return true
		case ServiceType.FILEBIN:
			return true
		case ServiceType.PIXELVAULT:
			return Boolean(storage.pixelVaultKey?.trim())
		case ServiceType.PIXELDRAIN:
			return Boolean(storage.pixelDrainKey?.trim())
		case ServiceType.SHAREX:
			return Boolean(storage.sharexConfigText?.trim())
		case ServiceType.WEBDAV:
			return Boolean(storage.webdavUrl?.trim())
		case ServiceType.IMMICH:
			return Boolean(storage.immichUrl?.trim() && storage.immichApiKey?.trim())
		case ServiceType.UGUU:
			return true
		case ServiceType.POMF:
			return true
		case ServiceType.OSHI:
			return true
		case ServiceType.IMGUR:
			return Boolean(
				storage.imgurClientId?.trim() || storage.imgurBearerToken?.trim(),
			)
		case ServiceType.CLOUDINARY:
			return Boolean(storage.cloudinaryCloudName?.trim())
		case ServiceType.GYAZO:
			return Boolean(storage.gyazoAccessToken?.trim())
		case ServiceType.KRAKENFILES:
			return Boolean(storage.krakenfilesApiKey?.trim())
		default:
			return false
	}
}

export async function uploadFile(
	rawFile: FileInfo,
	storage: FileUploaderStorage,
	onProgress?: (pct: number) => void,
): Promise<UploadResult> {
	const file = await processFileCompression(rawFile, storage)
	let url = ''

	switch (storage.serviceType) {
		case ServiceType.ZIPLINE:
			url = await uploadToZipline(file, storage, onProgress)
			break
		case ServiceType.EZHOST:
			url = await uploadToEzHost(file, storage, onProgress)
			break
		case ServiceType.NEST:
			url = await uploadToNest(file, storage, onProgress)
			break
		case ServiceType.ENCRYPTINGHOST:
			url = await uploadToEncryptingHost(file, storage, onProgress)
			break
		case ServiceType.S3:
			url = await uploadToS3(file, storage, onProgress)
			break
		case ServiceType.CATBOX:
			url = await uploadToCatbox(file, storage, onProgress)
			break
		case ServiceType.ZEROX0:
			url = await uploadTo0x0(file, storage, onProgress)
			break
		case ServiceType.LITTERBOX:
			url = await uploadToLitterbox(file, storage, onProgress)
			break
		case ServiceType.GOFILE:
			url = await uploadToGofile(file, storage, onProgress)
			break
		case ServiceType.TMPFILES:
			url = await uploadToTmpfiles(file, storage, onProgress)
			break
		case ServiceType.BUZZHEAVIER:
			url = await uploadToBuzzheavier(file, storage, onProgress)
			break
		case ServiceType.TEMPSH:
			url = await uploadToTempSh(file, storage, onProgress)
			break
		case ServiceType.FILEBIN:
			url = await uploadToFilebin(file, storage, onProgress)
			break
		case ServiceType.PIXELVAULT:
			url = await uploadToPixelVault(file, storage, onProgress)
			break
		case ServiceType.PIXELDRAIN:
			url = await uploadToPixelDrain(file, storage, onProgress)
			break
		case ServiceType.SHAREX:
			url = await uploadToShareX(file, storage, onProgress)
			break
		case ServiceType.WEBDAV:
			url = await uploadToWebdav(file, storage, onProgress)
			break
		case ServiceType.IMMICH:
			url = await uploadToImmich(file, storage, onProgress)
			break
		case ServiceType.UGUU:
			url = await uploadToUguu(file, storage, onProgress)
			break
		case ServiceType.POMF:
			url = await uploadToPomf(file, storage, onProgress)
			break
		case ServiceType.OSHI:
			url = await uploadToOshi(file, storage, onProgress)
			break
		case ServiceType.IMGUR:
			url = await uploadToImgur(file, storage, onProgress)
			break
		case ServiceType.CLOUDINARY:
			url = await uploadToCloudinary(file, storage, onProgress)
			break
		case ServiceType.GYAZO:
			url = await uploadToGyazo(file, storage, onProgress)
			break
		case ServiceType.KRAKENFILES:
			url = await uploadToKrakenFiles(file, storage, onProgress)
			break
		default:
			throw new Error(`Unsupported upload service: ${storage.serviceType}`)
	}

	return { url, name: file.name }
}

export {
	uploadTo0x0,
	uploadToBuzzheavier,
	uploadToCatbox,
	uploadToCloudinary,
	uploadToEncryptingHost,
	uploadToEzHost,
	uploadToFilebin,
	uploadToGofile,
	uploadToGyazo,
	uploadToImgur,
	uploadToImmich,
	uploadToKrakenFiles,
	uploadToLitterbox,
	uploadToNest,
	uploadToOshi,
	uploadToPixelDrain,
	uploadToPixelVault,
	uploadToPomf,
	uploadToS3,
	uploadToShareX,
	uploadToTempSh,
	uploadToTmpfiles,
	uploadToUguu,
	uploadToWebdav,
	uploadToZipline,
}
