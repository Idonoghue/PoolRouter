/** biome-ignore-all lint/style/useNamingConvention: redis is not camelCase */
import process from 'node:process'
import {createClient} from '@redis/client'

// get all addresses
export const GET = async (_: Request) => {
	const client = await createClient({url: process.env.REDIS_URL}).connect()

	let cursor = 0
	const matchedKeys: string[] = []

	// Scan for matching keys
	do {
		const result = await client.scan(String(cursor), {
			MATCH: '*',
			COUNT: 100
		})

		cursor = Number(result.cursor)
		matchedKeys.push(...result.keys)
	} while (cursor !== 0)

	if (matchedKeys.length === 0) {
		return {error: 'No addresses found'}
	}

	// Get values
	const values = await client.mGet(matchedKeys)

	// Map keys to values
	const result: Record<string, string | null> = {}
	matchedKeys.forEach((key, i) => {
		result[key] = values[i]
	})

	await client.destroy()
	return result
}

// add addresses to redis
export const POST = async (request: Request) => {
	const redis = await createClient({url: process.env.REDIS_URL}).connect()

	await redis.set('key', 'value')
	const value = await redis.get('key')
}
