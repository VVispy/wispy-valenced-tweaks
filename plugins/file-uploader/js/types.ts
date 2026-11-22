export enum ServiceType {
	ZIPLINE = 'zipline',
	EZHOST = 'ezhost',
	NEST = 'nest',
	ENCRYPTINGHOST = 'encryptinghost',
	S3 = 's3',
	CATBOX = 'catbox',
	ZEROX0 = '0x0',
	LITTERBOX = 'litterbox',
	SHAREX = 'sharex',
	GOFILE = 'gofile',
	TMPFILES = 'tmpfiles',
	BUZZHEAVIER = 'buzzheavier',
	TEMPSH = 'tempsh',
	FILEBIN = 'filebin',
	PIXELVAULT = 'pixelvault',
	PIXELDRAIN = 'pixeldrain',
	WEBDAV = 'webdav',
	IMMICH = 'immich',
	UGUU = 'uguu',
	POMF = 'pomf',
	OSHI = 'oshi',
	IMGUR = 'imgur',
	CLOUDINARY = 'cloudinary',
	GYAZO = 'gyazo',
	KRAKENFILES = 'krakenfiles',
}

export enum ShortenerType {
	ZIPLINE = 'zipline',
	KUTT = 'kutt',
	SHAREX = 'sharex',
	CLEANURI = 'cleanuri',
	TINYURL = 'tinyurl',
	DUB = 'dub',
	ISGD = 'isgd',
	CLCKRU = 'clckru',
	BITLY = 'bitly',
	TLY = 'tly',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
	[ServiceType.ZIPLINE]: 'Zipline',
	[ServiceType.EZHOST]: 'E-Z Host',
	[ServiceType.NEST]: 'Nest',
	[ServiceType.ENCRYPTINGHOST]: 'Encrypting.host',
	[ServiceType.S3]: 'S3-Compatible',
	[ServiceType.CATBOX]: 'Catbox.moe',
	[ServiceType.ZEROX0]: '0x0.st',
	[ServiceType.LITTERBOX]: 'Litterbox',
	[ServiceType.SHAREX]: 'ShareX Custom Uploader',
	[ServiceType.GOFILE]: 'GoFile',
	[ServiceType.TMPFILES]: 'tmpfiles.org',
	[ServiceType.BUZZHEAVIER]: 'buzzheavier.com',
	[ServiceType.TEMPSH]: 'temp.sh',
	[ServiceType.FILEBIN]: 'filebin.net',
	[ServiceType.PIXELVAULT]: 'PixelVault',
	[ServiceType.PIXELDRAIN]: 'PixelDrain',
	[ServiceType.WEBDAV]: 'WebDAV',
	[ServiceType.IMMICH]: 'Immich',
	[ServiceType.UGUU]: 'Uguu.se',
	[ServiceType.POMF]: 'Pomf (pomf.lain.la)',
	[ServiceType.OSHI]: 'Oshi.at',
	[ServiceType.IMGUR]: 'Imgur',
	[ServiceType.CLOUDINARY]: 'Cloudinary',
	[ServiceType.GYAZO]: 'Gyazo',
	[ServiceType.KRAKENFILES]: 'KrakenFiles',
}

export const SHORTENER_LABELS: Record<ShortenerType, string> = {
	[ShortenerType.ZIPLINE]: 'Zipline',
	[ShortenerType.KUTT]: 'Kutt.it',
	[ShortenerType.SHAREX]: 'ShareX Shortener',
	[ShortenerType.CLEANURI]: 'CleanURI',
	[ShortenerType.TINYURL]: 'TinyURL',
	[ShortenerType.DUB]: 'Dub.co',
	[ShortenerType.ISGD]: 'is.gd / v.gd',
	[ShortenerType.CLCKRU]: 'clck.ru',
	[ShortenerType.BITLY]: 'Bitly',
	[ShortenerType.TLY]: 'T.ly',
}

export interface ShareXConfig {
	Version?: string
	Name?: string
	DestinationType?: string
	RequestMethod?: string
	RequestURL?: string
	Headers?: Record<string, string>
	Body?: string
	FileFormName?: string
	Arguments?: Record<string, string>
	URL?: string
	ErrorMessage?: string
}

export interface FileUploaderStorage {
	enabled: boolean
	uploadAllFiles: boolean
	serviceType: ServiceType
	bypassDiscordUpload: boolean
	bypassOnlyOverLimit: boolean
	customLimitMB: number
	autoCopyUrl: boolean

	compressFiles: boolean
	compressionQuality: number

	chunkedUpload: boolean
	chunkSizeMB: number

	ziplineHost: string
	ziplineToken: string
	ziplineChunkUpload: boolean
	ziplineChunkSizeMB: number

	ezHostDomain: string
	ezHostKey: string

	nestHost: string
	nestToken: string

	encryptingHostKey: string
	encryptingHostDomain: string

	s3Endpoint: string
	s3Bucket: string
	s3Region: string
	s3AccessKeyId: string
	s3SecretAccessKey: string
	s3PublicUrl: string
	s3ForcePathStyle: boolean

	catboxHost: string
	catboxUserhash: string

	zerox0Host: string
	zerox0Secret: string

	litterboxHost: string
	litterboxExpiry: '1h' | '12h' | '24h' | '72h'

	gofileHost: string
	gofileToken: string
	gofileFolderId: string

	tmpfilesHost: string

	buzzheavierHost: string

	tempshHost: string

	filebinHost: string

	pixelVaultHost: string
	pixelVaultKey: string

	pixelDrainHost: string
	pixelDrainKey: string

	sharexConfigText: string

	webdavUrl: string
	webdavUser: string
	webdavPass: string
	webdavDirectory: string

	immichUrl: string
	immichApiKey: string
	immichCreatePublicShare: boolean

	uguuHost: string

	pomfHost: string

	oshiHost: string

	imgurClientId: string
	imgurBearerToken: string

	cloudinaryCloudName: string
	cloudinaryUploadPreset: string
	cloudinaryApiKey: string

	gyazoAccessToken: string

	krakenfilesApiKey: string

	shortenEnabled: boolean
	shortenerService: ShortenerType
	kuttHost: string
	kuttApiKey: string
	dubHost: string
	dubApiKey: string
	tinyurlApiKey: string
	cleanuriHost: string
	isgdHost: string
	clckruHost: string
	bitlyApiKey: string
	bitlyDomain: string
	tlyApiKey: string
	sharexShortenerConfigText: string
	shortenExcludedDomains: string
}

export const DEFAULT_STORAGE: FileUploaderStorage = {
	enabled: false,
	uploadAllFiles: true,
	serviceType: ServiceType.ZIPLINE,
	bypassDiscordUpload: true,
	bypassOnlyOverLimit: false,
	customLimitMB: 10,
	autoCopyUrl: false,

	compressFiles: false,
	compressionQuality: 80,

	chunkedUpload: true,
	chunkSizeMB: 50,

	ziplineHost: '',
	ziplineToken: '',
	ziplineChunkUpload: true,
	ziplineChunkSizeMB: 50,

	ezHostDomain: '',
	ezHostKey: '',

	nestHost: '',
	nestToken: '',

	encryptingHostKey: '',
	encryptingHostDomain: '',

	s3Endpoint: '',
	s3Bucket: '',
	s3Region: 'auto',
	s3AccessKeyId: '',
	s3SecretAccessKey: '',
	s3PublicUrl: '',
	s3ForcePathStyle: true,

	catboxHost: '',
	catboxUserhash: '',

	zerox0Host: '',
	zerox0Secret: '',

	litterboxHost: '',
	litterboxExpiry: '24h',

	gofileHost: '',
	gofileToken: '',
	gofileFolderId: '',

	tmpfilesHost: '',

	buzzheavierHost: '',

	tempshHost: '',

	filebinHost: '',

	pixelVaultHost: '',
	pixelVaultKey: '',

	pixelDrainHost: '',
	pixelDrainKey: '',

	sharexConfigText: '',

	webdavUrl: '',
	webdavUser: '',
	webdavPass: '',
	webdavDirectory: '',

	immichUrl: '',
	immichApiKey: '',
	immichCreatePublicShare: true,

	uguuHost: '',

	pomfHost: '',

	oshiHost: '',

	imgurClientId: '',
	imgurBearerToken: '',

	cloudinaryCloudName: '',
	cloudinaryUploadPreset: '',
	cloudinaryApiKey: '',

	gyazoAccessToken: '',

	krakenfilesApiKey: '',

	shortenEnabled: false,
	shortenerService: ShortenerType.ZIPLINE,
	kuttHost: '',
	kuttApiKey: '',
	dubHost: '',
	dubApiKey: '',
	tinyurlApiKey: '',
	cleanuriHost: '',
	isgdHost: '',
	clckruHost: '',
	bitlyApiKey: '',
	bitlyDomain: '',
	tlyApiKey: '',
	sharexShortenerConfigText: '',
	shortenExcludedDomains:
		'discord.com, discordapp.com, cdn.discordapp.com, media.discordapp.net, tenor.com, giphy.com',
}
