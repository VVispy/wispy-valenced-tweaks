import type { FileUploaderStorage } from '../types'

declare const valenced: any

export function setupDiscordLimitBypass(
	getStorage: () => FileUploaderStorage,
): () => void {
	const cleanups: (() => void)[] = []
	const rev =
		typeof valenced !== 'undefined' ? valenced : (globalThis as any).valenced
	if (!rev) return () => {}

	try {
		const constants = rev.discord?.common?.constants?.Constants
		if (constants && typeof constants.MAX_ATTACHMENT_SIZE === 'number') {
			const originalLimit = constants.MAX_ATTACHMENT_SIZE
			constants.MAX_ATTACHMENT_SIZE = 1073741824
			cleanups.push(() => {
				constants.MAX_ATTACHMENT_SIZE = originalLimit
			})
		}
	} catch {}

	try {
		const stores = rev.discord?.flux?.Stores
		const premiumStore = stores?.OverridePremiumTypeStore
		if (
			premiumStore &&
			typeof premiumStore.getPremiumTypeOverride === 'function'
		) {
			const unpatch = rev.patcher.after(
				premiumStore,
				'getPremiumTypeOverride',
				(ret: any) => {
					const s = getStorage()
					if (s.enabled && (s.bypassDiscordUpload || s.uploadAllFiles)) {
						return 2
					}
					return ret
				},
			)
			if (typeof unpatch === 'function') cleanups.push(unpatch)
		}
	} catch {}

	try {
		const finders = rev.modules?.finders
		const filters = finders?.filters
		if (finders && filters?.withProps) {
			const uploadModules = finders.lookupModule(
				filters.withProps('canUploadLargeFiles'),
			)
			for (const mod of uploadModules || []) {
				const target = mod?.default ?? mod
				if (typeof target?.canUploadLargeFiles === 'function') {
					const unpatch = rev.patcher.after(
						target,
						'canUploadLargeFiles',
						(ret: any) => {
							const s = getStorage()
							if (s.enabled && (s.bypassDiscordUpload || s.uploadAllFiles)) {
								return true
							}
							return ret
						},
					)
					if (typeof unpatch === 'function') cleanups.push(unpatch)
				}
				if (typeof target?.getUserMaxFileSize === 'function') {
					const unpatch = rev.patcher.after(
						target,
						'getUserMaxFileSize',
						(ret: any) => {
							const s = getStorage()
							if (s.enabled && (s.bypassDiscordUpload || s.uploadAllFiles)) {
								return 1073741824
							}
							return ret
						},
					)
					if (typeof unpatch === 'function') cleanups.push(unpatch)
				}
			}
		}
	} catch {}

	return () => {
		for (const fn of cleanups) {
			try {
				fn()
			} catch {}
		}
	}
}
