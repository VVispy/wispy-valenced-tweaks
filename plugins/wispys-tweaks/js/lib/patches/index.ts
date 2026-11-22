import { patchAddServerButton } from './addServerButton'
import { patchNitroLockedEmojis } from './nitroLockedEmojis'
import { patchProfileBanners } from './profileBanners'
import { patchProfileThemes } from './profileThemes'
import type { PluginCleanupApi } from '@valenced/plugins/types'

export function patchAll(cleanup: PluginCleanupApi): void {
	patchProfileBanners(cleanup)
	patchProfileThemes(cleanup)
	patchAddServerButton(cleanup)
	patchNitroLockedEmojis(cleanup)
}
