export const DB_NAME = 'HTTP_CACHE'
/**
 * @description DEFAULT_TTL is 2 weeks in ms
 */
export const DEFAULT_TTL = 1000 * 60 * 60 * 24 * 7 * 2
export const DEFAULT_VERSION = '1'

export const CACHE_DB_INDEX_KEYS = ['key', 'method', 'res', 'ttl', 'version', 'updatedAt', 'reference', 'url'] as const
