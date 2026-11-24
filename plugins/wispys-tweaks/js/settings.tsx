import Page from '@valenced/components/Page'
import { Design } from '@valenced/discord/design'
import { DEFAULTS } from './defaults'
import type { PluginSettingsComponent } from '@valenced/plugins/types'
import type { ComponentProps } from 'react'
import type { TweaksSettings } from './types'

const HIDES: [key: keyof TweaksSettings, label: string, subLabel: string][] = [
	['profileBanners', 'Profile Banners', 'Banner images on user profiles'],
	[
		'profileThemes',
		'Profile Themes',
		'Use your app theme on profiles instead of their colors',
	],
	[
		'addServerButton',
		'Add Server Button',
		'Add a Server button at the bottom of the server list',
	],
	[
		'nitroLockedEmojis',
		'Nitro-locked Reaction Emojis',
		'Emojis you cannot use in the reaction picker',
	],
]

export default function Settings({
	api: { jsonStorage },
}: ComponentProps<PluginSettingsComponent<{ jsonStorage: TweaksSettings }>>) {
	const settings = { ...DEFAULTS, ...jsonStorage.use() }
	return (
		<Page>
			<Design.TableRowGroup title="You bar shortcuts">
				<Design.TableSwitchRow
					label="Launchpad"
					subLabel="Replaces the pull tab. Launchpad must be set to pull tab in Discord's settings"
					value={settings.showLaunchpad}
					onValueChange={showLaunchpad => jsonStorage.set({ showLaunchpad })}
				/>
			</Design.TableRowGroup>
			<Design.TableRowGroup title="Launchpad">
				<Design.TableSwitchRow
					label="Instant Launchpad"
					subLabel="Opens and closes the Launchpad without the slide animation. Needs a reload"
					value={settings.instantLaunchpad}
					onValueChange={instantLaunchpad =>
						jsonStorage.set({ instantLaunchpad })
					}
				/>
			</Design.TableRowGroup>
			<Design.TableRowGroup title="Hide">
				{HIDES.map(([key, label, subLabel]) => (
					<Design.TableSwitchRow
						key={key}
						label={label}
						subLabel={subLabel}
						value={settings[key]}
						onValueChange={value => jsonStorage.set({ [key]: value })}
					/>
				))}
			</Design.TableRowGroup>
		</Page>
	)
}
