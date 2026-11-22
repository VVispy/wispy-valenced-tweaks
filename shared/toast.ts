import { ToastActionCreators } from '@valenced/discord/actions'

declare const valenced: any
declare const revenge: any

function getValenced(): any {
	try {
		if (typeof valenced !== 'undefined') return valenced
	} catch {}
	try {
		if (typeof revenge !== 'undefined') return revenge
	} catch {}
	return (globalThis as any).valenced ?? (globalThis as any).revenge
}

export function showToast(content: string, key = 'SharedToast') {
	try {
		const rev = getValenced()
		const creators = (rev?.discord?.actions?.ToastActionCreators ?? ToastActionCreators) as any
		if (!creators) return
		const mana = { text: content }
		if (typeof creators.openMana === 'function') {
			creators.openMana(key, mana)
			return
		}
		if (typeof creators.open === 'function') {
			creators.open({ key, content }, mana)
		}
	} catch {}
}