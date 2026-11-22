import React from 'react'
import {
	DEFAULT_STORAGE,
	SERVICE_LABELS,
	ServiceType,
	SHORTENER_LABELS,
	ShortenerType,
} from '../types'
import type { PluginApi } from '@valenced/plugins/types'
import type { FileUploaderStorage } from '../types'

declare const valenced: any

function SettingTextInput({
	label,
	value,
	onChange,
	placeholder,
	secureTextEntry,
	multiline,
	numberOfLines,
	keyboardType,
}: {
	label?: string
	value?: string
	onChange: (val: string) => void
	placeholder?: string
	secureTextEntry?: boolean
	multiline?: boolean
	numberOfLines?: number
	keyboardType?: string
}) {
	const rev =
		typeof valenced !== 'undefined' ? valenced : (globalThis as any).valenced
	const { View } = rev.react.ReactNative
	const { Text, TextInput } = rev.discord.design.Design
	const [text, setText] = React.useState(value ?? '')

	React.useEffect(() => {
		setText(value ?? '')
	}, [value])

	const handleChange = (eOrText: any) => {
		const val =
			typeof eOrText === 'string'
				? eOrText
				: eOrText?.nativeEvent?.text !== undefined
					? eOrText.nativeEvent.text
					: typeof eOrText?.target?.value === 'string'
						? eOrText.target.value
						: ''
		setText(val)
		onChange(val)
	}

	return (
		<View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
			{label ? (
				<Text
					variant="text-sm/medium"
					color="text-muted"
					style={{ marginBottom: 4 }}
				>
					{label}
				</Text>
			) : null}
			<TextInput
				value={text}
				onChangeText={handleChange}
				onChange={handleChange}
				placeholder={placeholder}
				secureTextEntry={secureTextEntry}
				multiline={multiline}
				numberOfLines={numberOfLines}
				keyboardType={keyboardType}
				autoCapitalize="none"
				autoCorrect={false}
			/>
		</View>
	)
}

export default function Settings({
	api,
}: {
	api: PluginApi<{ jsonStorage: FileUploaderStorage }>
}) {
	const rev =
		typeof valenced !== 'undefined' ? valenced : (globalThis as any).valenced
	const { ScrollView, View, TouchableOpacity } = rev.react.ReactNative
	const {
		Stack,
		Text,
		TableRowGroup,
		TableSwitchRow,
		TableRow,
		SegmentedControl,
		SegmentedControlPages,
		useSegmentedControlState,
	} = rev.discord.design.Design
	const { useState } = rev.react.React

	const [pageWidth, setPageWidth] = useState(0)
	const [showServicePicker, setShowServicePicker] = useState(false)
	const [showShortenerPicker, setShowShortenerPicker] = useState(false)

	const live = api.jsonStorage.use()
	const s: FileUploaderStorage = { ...DEFAULT_STORAGE, ...(live ?? {}) }
	const set = (patch: Partial<FileUploaderStorage>) =>
		api.jsonStorage.set({ ...s, ...patch })

	const segmented = useSegmentedControlState({
		items: [
			{
				id: 'upload',
				label: 'File Upload',
				page: (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ padding: 16 }}
					>
						<Stack spacing={16}>
							<TableRowGroup title="GENERAL">
								<TableSwitchRow
									label="Enable File Uploads"
									subLabel="Intercept outbound attachments exceeding upload limit and upload to external host"
									value={s.enabled}
									onValueChange={v => set({ enabled: v })}
								/>
								<TableSwitchRow
									label="Bypass Discord Picker Limit"
									subLabel="Unlock the file picker to allow selecting files over Discord's limit"
									value={s.bypassDiscordUpload}
									onValueChange={v => set({ bypassDiscordUpload: v })}
								/>
								<TableRow
									label="Upload Threshold"
									subLabel="Files exceeding your Discord upload limit upload to your external provider. Smaller files upload directly to Discord."
								/>
								<TableSwitchRow
									label="Auto Copy URL"
									subLabel="Copy the resulting file URL to clipboard after upload"
									value={s.autoCopyUrl}
									onValueChange={v => set({ autoCopyUrl: v })}
								/>
							</TableRowGroup>

							<TableRowGroup title="CHUNKING & STREAMING">
								<TableSwitchRow
									label="Enable Chunked Uploads"
									subLabel="Split large files into chunks for supported services (Zipline, S3, Buzzheavier)"
									value={s.chunkedUpload}
									onValueChange={v => set({ chunkedUpload: v })}
								/>
								{s.chunkedUpload && (
									<SettingTextInput
										label="Chunk Size (MB)"
										value={String(s.chunkSizeMB || 50)}
										onChange={v =>
											set({
												chunkSizeMB: Math.max(1, parseInt(v, 10) || 50),
											})
										}
										keyboardType="numeric"
										placeholder="50"
									/>
								)}
							</TableRowGroup>

							<TableRowGroup title="IMAGE COMPRESSION">
								<TableSwitchRow
									label="Compress Images Before Upload"
									subLabel="Downsample large images before uploading to conserve bandwidth"
									value={s.compressFiles}
									onValueChange={v => set({ compressFiles: v })}
								/>
								{s.compressFiles && (
									<SettingTextInput
										label="Image Quality (10-100%)"
										value={String(s.compressionQuality || 80)}
										onChange={v =>
											set({
												compressionQuality: Math.max(
													10,
													Math.min(100, parseInt(v, 10) || 80),
												),
											})
										}
										keyboardType="numeric"
										placeholder="80"
									/>
								)}
							</TableRowGroup>

							<TableRowGroup title="ACTIVE SERVICE">
								<TouchableOpacity
									onPress={() => setShowServicePicker(!showServicePicker)}
								>
									<TableRow
										label="Uploader Provider"
										subLabel={SERVICE_LABELS[s.serviceType] || s.serviceType}
										trailing={() => (
											<Text variant="text-md/bold" color="text-brand">
												{showServicePicker ? '▲ Hide' : '▼ Choose'}
											</Text>
										)}
									/>
								</TouchableOpacity>

								{showServicePicker && (
									<View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
										{(Object.keys(SERVICE_LABELS) as ServiceType[]).map(key => (
											<TouchableOpacity
												key={key}
												onPress={() => {
													set({ serviceType: key })
													setShowServicePicker(false)
												}}
											>
												<TableRow
													label={SERVICE_LABELS[key]}
													trailing={() => (
														<Text
															variant="text-md/bold"
															color={
																s.serviceType === key
																	? 'text-brand'
																	: 'text-muted'
															}
														>
															{s.serviceType === key ? '✓' : ''}
														</Text>
													)}
												/>
											</TouchableOpacity>
										))}
									</View>
								)}
							</TableRowGroup>

							{s.serviceType === ServiceType.ZIPLINE && (
								<TableRowGroup title="ZIPLINE CONFIGURATION">
									<SettingTextInput
										label="Instance Host"
										value={s.ziplineHost}
										onChange={v => set({ ziplineHost: v })}
										placeholder="https://zipline.example.com"
									/>
									<SettingTextInput
										label="Authorization Token"
										value={s.ziplineToken}
										onChange={v => set({ ziplineToken: v })}
										placeholder="Paste Zipline user token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.EZHOST && (
								<TableRowGroup title="E-Z HOST CONFIGURATION">
									<SettingTextInput
										label="Custom Domain (Optional)"
										value={s.ezHostDomain}
										onChange={v => set({ ezHostDomain: v })}
										placeholder="api.e-z.host"
									/>
									<SettingTextInput
										label="API Key"
										value={s.ezHostKey}
										onChange={v => set({ ezHostKey: v })}
										placeholder="E-Z Host user key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.NEST && (
								<TableRowGroup title="NEST CONFIGURATION">
									<SettingTextInput
										label="Host URL"
										value={s.nestHost}
										onChange={v => set({ nestHost: v })}
										placeholder="https://nest.rip"
									/>
									<SettingTextInput
										label="Authorization Token"
										value={s.nestToken}
										onChange={v => set({ nestToken: v })}
										placeholder="Nest auth token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.ENCRYPTINGHOST && (
								<TableRowGroup title="ENCRYPTING.HOST CONFIGURATION">
									<SettingTextInput
										label="Custom Subdomain / Vanity"
										value={s.encryptingHostDomain}
										onChange={v => set({ encryptingHostDomain: v })}
										placeholder="offensive"
									/>
									<SettingTextInput
										label="User Key"
										value={s.encryptingHostKey}
										onChange={v => set({ encryptingHostKey: v })}
										placeholder="Encrypting.host user key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.S3 && (
								<TableRowGroup title="S3-COMPATIBLE STORAGE">
									<SettingTextInput
										label="Endpoint URL"
										value={s.s3Endpoint}
										onChange={v => set({ s3Endpoint: v })}
										placeholder="https://<account>.r2.cloudflarestorage.com"
									/>
									<SettingTextInput
										label="Bucket Name"
										value={s.s3Bucket}
										onChange={v => set({ s3Bucket: v })}
										placeholder="my-bucket"
									/>
									<SettingTextInput
										label="Region"
										value={s.s3Region}
										onChange={v => set({ s3Region: v })}
										placeholder="auto"
									/>
									<SettingTextInput
										label="Access Key ID"
										value={s.s3AccessKeyId}
										onChange={v => set({ s3AccessKeyId: v })}
										placeholder="Access key ID"
									/>
									<SettingTextInput
										label="Secret Access Key"
										value={s.s3SecretAccessKey}
										onChange={v => set({ s3SecretAccessKey: v })}
										placeholder="Secret access key"
										secureTextEntry
									/>
									<SettingTextInput
										label="Custom Public Base URL (Optional)"
										value={s.s3PublicUrl}
										onChange={v => set({ s3PublicUrl: v })}
										placeholder="https://cdn.example.com"
									/>
									<TableSwitchRow
										label="Force Path Style"
										subLabel="Required for R2, MinIO, and local endpoints"
										value={s.s3ForcePathStyle}
										onValueChange={v => set({ s3ForcePathStyle: v })}
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.CATBOX && (
								<TableRowGroup title="CATBOX.MOE CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain (Optional)"
										value={s.catboxHost}
										onChange={v => set({ catboxHost: v })}
										placeholder="catbox.moe"
									/>
									<SettingTextInput
										label="User Hash (Optional)"
										value={s.catboxUserhash}
										onChange={v => set({ catboxUserhash: v })}
										placeholder="Optional account userhash"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.ZEROX0 && (
								<TableRowGroup title="0X0.ST CONFIGURATION">
									<SettingTextInput
										label="Host / Instance URL"
										value={s.zerox0Host}
										onChange={v => set({ zerox0Host: v })}
										placeholder="0x0.st or ttm.sh"
									/>
									<SettingTextInput
										label="Secret Token (Optional)"
										value={s.zerox0Secret}
										onChange={v => set({ zerox0Secret: v })}
										placeholder="Optional deletion token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.LITTERBOX && (
								<TableRowGroup title="LITTERBOX CONFIGURATION">
									<SettingTextInput
										label="Host URL (Optional)"
										value={s.litterboxHost}
										onChange={v => set({ litterboxHost: v })}
										placeholder="litterbox.catbox.moe"
									/>
									<View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
										<Text
											variant="text-sm/medium"
											color="text-muted"
											style={{ marginBottom: 4 }}
										>
											Retention Time
										</Text>
										<View
											style={{
												flexDirection: 'row',
												gap: 8,
												marginTop: 4,
											}}
										>
											{(['1h', '12h', '24h', '72h'] as const).map(time => (
												<TouchableOpacity
													key={time}
													onPress={() => set({ litterboxExpiry: time })}
													style={{
														paddingHorizontal: 12,
														paddingVertical: 6,
														borderRadius: 4,
														backgroundColor:
															s.litterboxExpiry === time
																? '#5865F2'
																: '#2B2D31',
													}}
												>
													<Text
														variant="text-sm/bold"
														color={
															s.litterboxExpiry === time
																? 'text-normal'
																: 'text-muted'
														}
													>
														{time}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									</View>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.GOFILE && (
								<TableRowGroup title="GOFILE CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain (Optional)"
										value={s.gofileHost}
										onChange={v => set({ gofileHost: v })}
										placeholder="api.gofile.io"
									/>
									<SettingTextInput
										label="API Token (Optional)"
										value={s.gofileToken}
										onChange={v => set({ gofileToken: v })}
										placeholder="Optional GoFile account token"
										secureTextEntry
									/>
									<SettingTextInput
										label="Folder ID (Optional)"
										value={s.gofileFolderId}
										onChange={v => set({ gofileFolderId: v })}
										placeholder="Target folder ID"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.TMPFILES && (
								<TableRowGroup title="TMPFILES.ORG CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.tmpfilesHost}
										onChange={v => set({ tmpfilesHost: v })}
										placeholder="tmpfiles.org"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.BUZZHEAVIER && (
								<TableRowGroup title="BUZZHEAVIER CONFIGURATION">
									<SettingTextInput
										label="Upload Host / Custom Domain"
										value={s.buzzheavierHost}
										onChange={v => set({ buzzheavierHost: v })}
										placeholder="w.buzzheavier.com"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.TEMPSH && (
								<TableRowGroup title="TEMP.SH CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.tempshHost}
										onChange={v => set({ tempshHost: v })}
										placeholder="temp.sh"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.FILEBIN && (
								<TableRowGroup title="FILEBIN CONFIGURATION">
									<SettingTextInput
										label="Host / Instance URL"
										value={s.filebinHost}
										onChange={v => set({ filebinHost: v })}
										placeholder="filebin.net"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.PIXELVAULT && (
								<TableRowGroup title="PIXELVAULT CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.pixelVaultHost}
										onChange={v => set({ pixelVaultHost: v })}
										placeholder="pixelvault.co"
									/>
									<SettingTextInput
										label="API Key"
										value={s.pixelVaultKey}
										onChange={v => set({ pixelVaultKey: v })}
										placeholder="PixelVault upload key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.PIXELDRAIN && (
								<TableRowGroup title="PIXELDRAIN CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.pixelDrainHost}
										onChange={v => set({ pixelDrainHost: v })}
										placeholder="pixeldrain.com"
									/>
									<SettingTextInput
										label="API Key (Required for uploads)"
										value={s.pixelDrainKey}
										onChange={v => set({ pixelDrainKey: v })}
										placeholder="PixelDrain API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.SHAREX && (
								<TableRowGroup title="SHAREX CUSTOM UPLOADER">
									<SettingTextInput
										label="Configuration JSON (.sxcu)"
										value={s.sharexConfigText}
										onChange={v => set({ sharexConfigText: v })}
										placeholder="Paste .sxcu JSON here"
										multiline
										numberOfLines={6}
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.WEBDAV && (
								<TableRowGroup title="WEBDAV CONFIGURATION">
									<SettingTextInput
										label="Server WebDAV URL"
										value={s.webdavUrl}
										onChange={v => set({ webdavUrl: v })}
										placeholder="https://cloud.example.com/remote.php/dav/files/user"
									/>
									<SettingTextInput
										label="Username"
										value={s.webdavUser}
										onChange={v => set({ webdavUser: v })}
										placeholder="Username"
									/>
									<SettingTextInput
										label="Password / App Token"
										value={s.webdavPass}
										onChange={v => set({ webdavPass: v })}
										placeholder="Password or App Token"
										secureTextEntry
									/>
									<SettingTextInput
										label="Target Directory"
										value={s.webdavDirectory}
										onChange={v => set({ webdavDirectory: v })}
										placeholder="Uploads (optional)"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.IMMICH && (
								<TableRowGroup title="IMMICH CONFIGURATION">
									<SettingTextInput
										label="Instance URL"
										value={s.immichUrl}
										onChange={v => set({ immichUrl: v })}
										placeholder="https://immich.example.com"
									/>
									<SettingTextInput
										label="API Key"
										value={s.immichApiKey}
										onChange={v => set({ immichApiKey: v })}
										placeholder="Immich API Key"
										secureTextEntry
									/>
									<TableSwitchRow
										label="Create Public Share Link"
										subLabel="Generate a public /share link so recipients without Immich accounts can view photos/videos"
										value={s.immichCreatePublicShare}
										onValueChange={v => set({ immichCreatePublicShare: v })}
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.UGUU && (
								<TableRowGroup title="UGUU CONFIGURATION">
									<SettingTextInput
										label="Host / Instance URL (Optional)"
										value={s.uguuHost}
										onChange={v => set({ uguuHost: v })}
										placeholder="uguu.se"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.POMF && (
								<TableRowGroup title="POMF CONFIGURATION">
									<SettingTextInput
										label="Host / Instance URL"
										value={s.pomfHost}
										onChange={v => set({ pomfHost: v })}
										placeholder="pomf.lain.la"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.OSHI && (
								<TableRowGroup title="OSHI.AT CONFIGURATION">
									<SettingTextInput
										label="Host / Instance URL"
										value={s.oshiHost}
										onChange={v => set({ oshiHost: v })}
										placeholder="oshi.at"
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.IMGUR && (
								<TableRowGroup title="IMGUR CONFIGURATION">
									<SettingTextInput
										label="Client-ID"
										value={s.imgurClientId}
										onChange={v => set({ imgurClientId: v })}
										placeholder="Imgur application Client-ID"
									/>
									<SettingTextInput
										label="Bearer Token (Optional)"
										value={s.imgurBearerToken}
										onChange={v => set({ imgurBearerToken: v })}
										placeholder="User account access token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.CLOUDINARY && (
								<TableRowGroup title="CLOUDINARY CONFIGURATION">
									<SettingTextInput
										label="Cloud Name"
										value={s.cloudinaryCloudName}
										onChange={v => set({ cloudinaryCloudName: v })}
										placeholder="your-cloud-name"
									/>
									<SettingTextInput
										label="Upload Preset (Optional)"
										value={s.cloudinaryUploadPreset}
										onChange={v => set({ cloudinaryUploadPreset: v })}
										placeholder="unsigned_preset"
									/>
									<SettingTextInput
										label="API Key (Optional)"
										value={s.cloudinaryApiKey}
										onChange={v => set({ cloudinaryApiKey: v })}
										placeholder="Cloudinary API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.GYAZO && (
								<TableRowGroup title="GYAZO CONFIGURATION">
									<SettingTextInput
										label="Access Token"
										value={s.gyazoAccessToken}
										onChange={v => set({ gyazoAccessToken: v })}
										placeholder="Gyazo personal access token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.serviceType === ServiceType.KRAKENFILES && (
								<TableRowGroup title="KRAKENFILES CONFIGURATION">
									<SettingTextInput
										label="API Key"
										value={s.krakenfilesApiKey}
										onChange={v => set({ krakenfilesApiKey: v })}
										placeholder="KrakenFiles user API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}
						</Stack>
					</ScrollView>
				),
			},
			{
				id: 'shorten',
				label: 'URL Shortener',
				page: (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ padding: 16 }}
					>
						<Stack spacing={16}>
							<TableRowGroup title="GENERAL">
								<TableSwitchRow
									label="Enable Link Shortener"
									subLabel="Automatically shorten outbound links found in message text"
									value={s.shortenEnabled}
									onValueChange={v => set({ shortenEnabled: v })}
								/>
							</TableRowGroup>

							<TableRowGroup title="SHORTENER SERVICE">
								<TouchableOpacity
									onPress={() => setShowShortenerPicker(!showShortenerPicker)}
								>
									<TableRow
										label="Selected Service"
										subLabel={
											SHORTENER_LABELS[s.shortenerService] || s.shortenerService
										}
										trailing={() => (
											<Text variant="text-md/bold" color="text-brand">
												{showShortenerPicker ? '▲ Hide' : '▼ Choose'}
											</Text>
										)}
									/>
								</TouchableOpacity>

								{showShortenerPicker && (
									<View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
										{(Object.keys(SHORTENER_LABELS) as ShortenerType[]).map(
											key => (
												<TouchableOpacity
													key={key}
													onPress={() => {
														set({ shortenerService: key })
														setShowShortenerPicker(false)
													}}
												>
													<TableRow
														label={SHORTENER_LABELS[key]}
														trailing={() => (
															<Text
																variant="text-md/bold"
																color={
																	s.shortenerService === key
																		? 'text-brand'
																		: 'text-muted'
																}
															>
																{s.shortenerService === key ? '✓' : ''}
															</Text>
														)}
													/>
												</TouchableOpacity>
											),
										)}
									</View>
								)}
							</TableRowGroup>

							{s.shortenerService === ShortenerType.ZIPLINE && (
								<TableRowGroup title="ZIPLINE SHORTENER">
									<View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
										<Text
											variant="text-sm/medium"
											color="text-muted"
											style={{ marginBottom: 4 }}
										>
											Uses host and token from the File Upload tab:
										</Text>
										<Text variant="text-sm/bold" color="text-normal">
											{s.ziplineHost ||
												'Not configured (set in File Upload tab)'}
										</Text>
									</View>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.KUTT && (
								<TableRowGroup title="KUTT CONFIGURATION">
									<SettingTextInput
										label="Host URL"
										value={s.kuttHost}
										onChange={v => set({ kuttHost: v })}
										placeholder="https://kutt.it"
									/>
									<SettingTextInput
										label="API Key"
										value={s.kuttApiKey}
										onChange={v => set({ kuttApiKey: v })}
										placeholder="Kutt API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.CLEANURI && (
								<TableRowGroup title="CLEANURI CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.cleanuriHost}
										onChange={v => set({ cleanuriHost: v })}
										placeholder="cleanuri.com"
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.TINYURL && (
								<TableRowGroup title="TINYURL CONFIGURATION">
									<SettingTextInput
										label="API Key (Optional)"
										value={s.tinyurlApiKey}
										onChange={v => set({ tinyurlApiKey: v })}
										placeholder="Optional TinyURL API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.DUB && (
								<TableRowGroup title="DUB.CO CONFIGURATION">
									<SettingTextInput
										label="Host / Custom Domain"
										value={s.dubHost}
										onChange={v => set({ dubHost: v })}
										placeholder="api.dub.co"
									/>
									<SettingTextInput
										label="API Key"
										value={s.dubApiKey}
										onChange={v => set({ dubApiKey: v })}
										placeholder="Dub API key"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.SHAREX && (
								<TableRowGroup title="SHAREX SHORTENER">
									<SettingTextInput
										label="ShareX Shortener JSON (.sxcu)"
										value={s.sharexShortenerConfigText}
										onChange={v => set({ sharexShortenerConfigText: v })}
										placeholder="Paste .sxcu URL shortener config here"
										multiline
										numberOfLines={6}
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.ISGD && (
								<TableRowGroup title="IS.GD / V.GD CONFIGURATION">
									<SettingTextInput
										label="Host Domain"
										value={s.isgdHost}
										onChange={v => set({ isgdHost: v })}
										placeholder="is.gd or v.gd"
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.CLCKRU && (
								<TableRowGroup title="CLCK.RU CONFIGURATION">
									<SettingTextInput
										label="Host Domain"
										value={s.clckruHost}
										onChange={v => set({ clckruHost: v })}
										placeholder="clck.ru"
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.BITLY && (
								<TableRowGroup title="BITLY CONFIGURATION">
									<SettingTextInput
										label="Generic Access Token"
										value={s.bitlyApiKey}
										onChange={v => set({ bitlyApiKey: v })}
										placeholder="Bitly OAuth / Generic Access Token"
										secureTextEntry
									/>
									<SettingTextInput
										label="Custom Domain (Optional)"
										value={s.bitlyDomain}
										onChange={v => set({ bitlyDomain: v })}
										placeholder="bit.ly"
									/>
								</TableRowGroup>
							)}

							{s.shortenerService === ShortenerType.TLY && (
								<TableRowGroup title="T.LY CONFIGURATION">
									<SettingTextInput
										label="API Token"
										value={s.tlyApiKey}
										onChange={v => set({ tlyApiKey: v })}
										placeholder="T.ly API token"
										secureTextEntry
									/>
								</TableRowGroup>
							)}

							<TableRowGroup title="DOMAIN EXCLUSIONS">
								<SettingTextInput
									label="Excluded Domains (comma separated)"
									value={s.shortenExcludedDomains}
									onChange={v => set({ shortenExcludedDomains: v })}
									placeholder="discord.com, tenor.com"
									multiline
								/>
							</TableRowGroup>
						</Stack>
					</ScrollView>
				),
			},
		],
		pageWidth,
	})

	return (
		<View
			style={{ flex: 1, backgroundColor: '#111214' }}
			onLayout={(e: any) => setPageWidth(e.nativeEvent.layout.width)}
		>
			<View
				style={{ paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16 }}
			>
				<SegmentedControl
					state={segmented}
					variant="default"
					keyboardShouldPersistTaps="handled"
				/>
			</View>
			<SegmentedControlPages state={segmented} style={{ flex: 1 }} />
		</View>
	)
}
