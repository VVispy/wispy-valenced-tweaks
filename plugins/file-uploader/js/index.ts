import { setupChangelog } from '../../../shared/changelog'
import { showToast } from '../../../shared/toast'
import { CHANGELOG } from './changelog'
import { setupDiscordLimitBypass } from './lib/bypass'
import {
	clearNativeAttachments,
	extractFileInfo,
	getDiscordUploadLimitBytes,
	removeOffloadedAttachments,
	resolveFileSize,
} from './lib/file'
import { getFileUploaderStorage, initStorage } from './lib/storage'
import { isServiceConfigured, uploadFile } from './services'
import { isDomainExcluded, shortenUrl } from './shorteners'
import { DEFAULT_STORAGE } from './types'
import Settings from './ui/Settings'
import type { FileUploaderStorage } from './types'

declare const plugin: <T = any>(def: any) => any
declare const valenced: any

const URL_REGEX = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gi

export default plugin<{ jsonStorage: FileUploaderStorage }>({
	jsonStorage: {
		load: true,
		default: DEFAULT_STORAGE,
	},

	start(api) {
		const cleanups: (() => void)[] = []
		const cleanStorage = initStorage(api.jsonStorage)
		cleanups.push(cleanStorage)

		try {
			api.cleanup(setupChangelog(api, CHANGELOG))
		} catch {}

		try {
			const unbypass = setupDiscordLimitBypass(getFileUploaderStorage)
			if (typeof unbypass === 'function') cleanups.push(unbypass)
		} catch {}

		const setClipboard = (text: string) => {
			try {
				const rev =
					typeof valenced !== 'undefined'
						? valenced
						: (globalThis as any).valenced
				const rn = rev?.react?.ReactNative
				rn?.Clipboard?.setString?.(text)
			} catch {}
		}

		const patchMessageActions = (mod: any) => {
			const target = mod?.default ?? mod
			if (!target) return
			const rev =
				typeof valenced !== 'undefined'
					? valenced
					: (globalThis as any).valenced
			const patcher = rev?.patcher

			const patchMethod = (methodName: 'sendMessage' | '_sendMessage') => {
				if (typeof target[methodName] !== 'function' || !patcher?.instead)
					return

				const unpatch = patcher.instead(
					target,
					methodName,
					async (args: any[], orig: any) => {
						const storage = getFileUploaderStorage()
						const serviceReady = isServiceConfigured(storage)

						if (
							(!storage.enabled || !serviceReady) &&
							!storage.shortenEnabled
						) {
							return orig.apply(target, args)
						}

						const channelId = typeof args[0] === 'string' ? args[0] : ''
						const message = args[1]
						if (!message || typeof message !== 'object') {
							return orig.apply(target, args)
						}

						if ((message as any).__fileUploaderHandled) {
							return orig.apply(target, args)
						}
						;(message as any).__fileUploaderHandled = true

						let options: any = null
						for (let i = args.length - 1; i >= 1; i--) {
							if (
								args[i] &&
								typeof args[i] === 'object' &&
								!('then' in args[i])
							) {
								options = args[i]
								break
							}
						}

						let content: string = message.content ?? ''

						const rawAttachments: any[] = []
						for (let i = 1; i < args.length; i++) {
							const a = args[i]
							if (a && typeof a === 'object' && !('then' in a)) {
								if (Array.isArray(a.attachmentsToUpload))
									rawAttachments.push(...a.attachmentsToUpload)
								if (Array.isArray(a.attachments))
									rawAttachments.push(...a.attachments)
								if (Array.isArray(a.files)) rawAttachments.push(...a.files)
							}
						}

						if (channelId) {
							try {
								const storeUploads =
									rev?.discord?.flux?.Stores?.UploadAttachmentStore?.getUploads?.(
										channelId,
										0,
									)
								if (Array.isArray(storeUploads)) {
									for (const u of storeUploads) {
										if (u?.item) rawAttachments.push(u.item)
										else if (u) rawAttachments.push(u)
									}
								}
							} catch {}
						}

						const seenUris = new Set<string>()
						const uniqueRaw: any[] = []
						for (const raw of rawAttachments) {
							const info = extractFileInfo(raw)
							if (info.uri && !seenUris.has(info.uri)) {
								seenUris.add(info.uri)
								uniqueRaw.push(raw)
							}
						}

						const thresholdBytes = getDiscordUploadLimitBytes(rev)
						const eligibleAttachments: Array<{ raw: any; info: any }> = []

						if (storage.enabled && serviceReady) {
							for (const raw of uniqueRaw) {
								const info = extractFileInfo(raw)
								if (!info.uri) continue
								const realSize = await resolveFileSize(info)
								info.size = realSize
								if (realSize > thresholdBytes) {
									eligibleAttachments.push({ raw, info })
								}
							}
						}

						const uploadedUrls: string[] = []
						const offloadedUris = new Set<string>()

						if (eligibleAttachments.length > 0) {
							for (const { info } of eligibleAttachments) {
								showToast(`Uploading ${info.name}...`)
								try {
									const res = await uploadFile(info, storage, pct => {
										showToast(`Uploading ${info.name} (${pct}%)...`)
									})
									uploadedUrls.push(res.url)
									offloadedUris.add(info.uri)
								} catch (err: any) {
									showToast(`Upload failed: ${err?.message || err}`)
								}
							}

							if (uploadedUrls.length > 0) {
								if (offloadedUris.size >= uniqueRaw.length) {
									clearNativeAttachments(args, message, options, channelId)
								} else {
									removeOffloadedAttachments(
										args,
										message,
										options,
										offloadedUris,
									)
								}
								const block = uploadedUrls.join('\n')
								content = content ? `${content}\n${block}` : block
								message.content = content

								if (storage.autoCopyUrl) {
									setClipboard(uploadedUrls[uploadedUrls.length - 1])
								}
								showToast(
									uploadedUrls.length === 1
										? 'Uploaded file successfully'
										: `Uploaded ${uploadedUrls.length} files successfully`,
								)
							}
						}

						if (storage.shortenEnabled && content.trim()) {
							const matches = content.match(URL_REGEX) ?? []
							const uniqueUrls = [...new Set(matches)].filter(
								u => !isDomainExcluded(u, storage),
							)

							let shortenedCount = 0
							for (const rawUrl of uniqueUrls) {
								try {
									const shortened = await shortenUrl(rawUrl, storage)
									if (shortened && shortened !== rawUrl) {
										content = content.split(rawUrl).join(shortened)
										shortenedCount++
									}
								} catch (err: any) {
									showToast(`Shorten failed: ${err?.message || err}`)
								}
							}

							if (shortenedCount > 0) {
								message.content = content
							}
						}

						return orig.apply(target, args)
					},
				)
				cleanups.push(unpatch)
			}

			patchMethod('sendMessage')
			patchMethod('_sendMessage')
		}

		try {
			const rev =
				typeof valenced !== 'undefined'
					? valenced
					: (globalThis as any).valenced
			const finders = rev?.modules?.finders
			const importedFinders = rev?.discord?.utils?.modules?.finders
			const mod =
				importedFinders?.lookupModuleWithImportedPath?.(
					'actions/MessageActionCreators.tsx',
				)?.[0] ??
				finders?.lookupModule?.(
					finders?.filters?.withProps?.('sendMessage', 'editMessage'),
				)?.[0]

			if (mod) patchMessageActions(mod)

			if (importedFinders?.waitForModuleWithImportedPath) {
				const unsub = importedFinders.waitForModuleWithImportedPath(
					'actions/MessageActionCreators.tsx',
					(m: any) => {
						if (m) patchMessageActions(m)
					},
				)
				if (unsub) cleanups.push(unsub)
			}
		} catch {}

		api.cleanup(() => {
			for (const fn of cleanups) {
				try {
					fn()
				} catch {}
			}
		})
	},

	SettingsComponent: Settings,
})
