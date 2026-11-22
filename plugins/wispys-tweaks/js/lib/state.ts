import { DEFAULTS } from '../defaults'
import type { JsonStorage } from '@valenced/json-storage'
import type { TweaksSettings } from '../types'

let storage: JsonStorage<TweaksSettings> | undefined

export function setStorage(handle: JsonStorage<TweaksSettings>) {
	storage = handle
}

export function getSettings(): TweaksSettings {
	return { ...DEFAULTS, ...(storage?.cache ?? {}) }
}
