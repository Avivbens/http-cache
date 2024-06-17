import type { CACHE_DB_INDEX_KEYS } from '../constants/config'

export enum IndexedDbTable {
    Requests = 'requests',
}
export type CacheTableIndexKeys = (typeof CACHE_DB_INDEX_KEYS)[number]
