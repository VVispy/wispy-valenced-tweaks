export interface TweaksSettings {
	/** Show a Launchpad shortcut on the You bar in place of the pull tab */
	showLaunchpad: boolean
	/** Open and close the Launchpad without its slide animation */
	instantLaunchpad: boolean
	/** Hide banners on user profiles */
	profileBanners: boolean
	/** Use the app theme on user profiles instead of their profile colors */
	profileThemes: boolean
	/** Hide the Add a Server button at the bottom of the server list */
	addServerButton: boolean
	/** Hide emojis that need Nitro in the reaction picker */
	nitroLockedEmojis: boolean
}
