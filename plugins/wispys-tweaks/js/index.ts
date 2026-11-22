import { DEFAULTS } from './defaults'
import { patchLaunchpad } from './launchpad'
import { initModules } from './lib/modules'
import { patchAll } from './lib/patches'
import { setStorage } from './lib/state'
import Settings from './settings'
import type { TweaksSettings } from './types'

export default plugin<{ jsonStorage: TweaksSettings }>({
	jsonStorage: { load: true, default: DEFAULTS },
	SettingsComponent: Settings,
	start(api) {
		const { cleanup, jsonStorage, plugin } = api
		if (plugin.startedLate) {
			plugin.requireReload()
			return
		}
		initModules(error => plugin.reportError(error))
		setStorage(jsonStorage)
		patchLaunchpad(api)
		try {
			patchAll(cleanup)
		} catch (error) {
			plugin.reportError(error)
		}
	},
	stop({ plugin }) {
		plugin.requireReload()
	},
})
