import type { Transaction } from 'dexie'
import Dexie from 'dexie'
import { upgradeTableToV3 } from '../migrations/upgrade-v3'
import { IndexedDbTable } from '../models/table.model'
import { CACHE_DB_INDEX_KEYS, DB_NAME } from './config'

export let httpCacheDb: Dexie

const DB_KEYS = ['++id', ...CACHE_DB_INDEX_KEYS].join(',')

export async function getDB(): Promise<Dexie> {
    try {
        if (httpCacheDb) {
            return httpCacheDb
        }

        httpCacheDb = new Dexie(DB_NAME)

        /**
         * update version after migration
         */
        httpCacheDb
            .version(3)
            .stores({
                [IndexedDbTable.Requests]: DB_KEYS,
            })
            .upgrade((transaction: Transaction) =>
                transaction.table(IndexedDbTable.Requests).toCollection().modify(upgradeTableToV3),
            )

        await httpCacheDb.open()
        return httpCacheDb
    } catch (error) {
        console.error(`[CacheDb] error in getting db: ${error}`)
        throw error
    }
}
