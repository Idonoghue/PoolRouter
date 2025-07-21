/** biome-ignore-all lint/style/useNamingConvention: env vars are not camelCase */

declare global {
	interface ImportMeta {
		env: {
			MODE: string
			VITE_MAPBOX_ACCESS_TOKEN: string
			VITE_REDIS_URL: string
		}
	}
}
