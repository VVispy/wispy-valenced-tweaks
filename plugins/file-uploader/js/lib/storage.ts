import { DEFAULT_STORAGE } from '../types'
import type { FileUploaderStorage } from '../types'

declare const valenced: any

let memoryStorage: FileUploaderStorage = { ...DEFAULT_STORAGE }
let activeJsonStorage: any = null

export function initStorage(jsonStorage: any): () => void {
	activeJsonStorage = jsonStorage

	if (jsonStorage?.cache && typeof jsonStorage.cache === 'object') {
		memoryStorage = { ...DEFAULT_STORAGE, ...jsonStorage.cache }
	}

	if (typeof jsonStorage?.get === 'function') {
		jsonStorage
			.get()
			.then((val: any) => {
				if (val && typeof val === 'object') {
					memoryStorage = { ...DEFAULT_STORAGE, ...val }
				}
			})
			.catch(() => {})
	}

	let unsub: (() => void) | undefined
	if (typeof jsonStorage?.subscribe === 'function') {
		unsub = jsonStorage.subscribe((val: any) => {
			const current = val || jsonStorage?.cache
			if (current && typeof current === 'object') {
				memoryStorage = { ...DEFAULT_STORAGE, ...current }
			}
		})
	}

	return () => {
		unsub?.()
		activeJsonStorage = null
	}
}

export function getFileUploaderStorage(): FileUploaderStorage {
	if (
		activeJsonStorage?.cache &&
		typeof activeJsonStorage.cache === 'object' &&
		Object.keys(activeJsonStorage.cache).length > 0
	) {
		return { ...DEFAULT_STORAGE, ...activeJsonStorage.cache }
	}
	try {
		const rev =
			typeof valenced !== 'undefined' ? valenced : (globalThis as any).valenced
		const p =
			'/data/user/0/app.valenced/files/valenced/plugins/storage/primary/wispy.file-uploader/storage.json'
		const raw = rev?.modules?.native?.callNativeMethodSync?.(
			'valenced.fs.read',
			[p],
		)
		if (raw && typeof raw === 'string') {
			const parsed = JSON.parse(raw)
			if (parsed && typeof parsed === 'object') {
				memoryStorage = { ...DEFAULT_STORAGE, ...parsed }
				return memoryStorage
			}
		}
	} catch {}
	return memoryStorage
}

export function setFileUploaderStorage(
	partial: Partial<FileUploaderStorage>,
): void {
	memoryStorage = { ...memoryStorage, ...partial }
	if (activeJsonStorage?.set) {
		activeJsonStorage.set(partial)
	}
}
