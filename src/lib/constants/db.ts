import Dexie from 'dexie'
import { IndexedDbTable } from '../models/table.enum'
import { DB_NAME } from './config'

const DB_KEYS = ['++id', 'key', 'method', 'res', 'ttl', 'version', 'updatedAt'].join(',')
export let httpCacheDb: Dexie

export function getDB(): Dexie {
    if (httpCacheDb) {
        httpCacheDb.open()
        return httpCacheDb
    }

    httpCacheDb = new Dexie(DB_NAME)
    httpCacheDb.version(1).stores({
        [IndexedDbTable.Requests]: DB_KEYS,
    })

    httpCacheDb.open()
    return httpCacheDb
}
