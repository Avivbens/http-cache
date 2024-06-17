import type { Observable } from 'rxjs'
import { from, lastValueFrom, of, switchMap } from 'rxjs'
import { DB_NAME, DEFAULT_TTL, DEFAULT_VERSION } from '../constants/config'
import { getDB } from '../constants/db'
import type { HttpCacheItem } from '../models/http-cache-item.model'
import type { HttpCacheOptions } from '../models/http-cache-options.model'
import type { CacheTableIndexKeys } from '../models/table.model'
import { IndexedDbTable } from '../models/table.model'
import { getCacheKey, getDefaultRecordReference, isDbExists, isValidTTL } from './utils.service'

export async function setCacheValue<T = unknown>(key: string, payload: T, options: HttpCacheOptions): Promise<void> {
    try {
        const {
            ttl = DEFAULT_TTL,
            version = DEFAULT_VERSION,
            url,
            reference = getDefaultRecordReference(url),
        } = options
        const updatedAt: number = Date.now()
        const cacheValue: Omit<HttpCacheItem<T>, 'id' | 'method'> = {
            key,
            res: payload,
            ttl,
            version,
            updatedAt,
            url,
            reference,
        }

        const db = await getDB()

        await db.table<Omit<HttpCacheItem<T>, 'id' | 'method'>>(IndexedDbTable.Requests).add(cacheValue, key)
    } catch (error) {
        console.error(`[HttpCacheService] setCacheValue error: ${error.message}`)
    }
}

export function setCacheValueOperator<T = unknown>(
    key: string,
    options: HttpCacheOptions,
): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>) =>
        source.pipe(
            switchMap((payload: T) => {
                payload && setCacheValue(key, payload, options)
                return of(payload)
            }),
        )
}

export async function deleteRecordByProperty(indexProperty: CacheTableIndexKeys, value: string): Promise<boolean> {
    const db = await getDB()
    return (
        db
            ?.table(IndexedDbTable.Requests)
            ?.where?.(indexProperty)
            ?.equals(value)
            ?.delete()
            ?.then(() => true)
            ?.catch(() => false) ?? Promise.resolve(false)
    )
}

export function deleteRecordsByReference(reference: string): Observable<boolean> {
    return from(deleteRecordByProperty('reference', reference))
}

export async function getCacheValue<T = unknown>(key: string, skipCache = false): Promise<T | null> {
    try {
        const db = await getDB()
        const cacheValue: HttpCacheItem<T> | undefined = await db.table<HttpCacheItem<T>>(IndexedDbTable.Requests).get({
            key,
        })
        if (!cacheValue) {
            return null
        }

        const { updatedAt, ttl, res, reference } = cacheValue

        const isCacheValid: boolean = !!ttl && isValidTTL(updatedAt, ttl)
        if (!isCacheValid || skipCache) {
            await lastValueFrom(deleteRecordsByReference(reference))
            return null
        }

        return res
    } catch (error) {
        console.error(`[HttpCacheService] getCacheValue error: ${error.message}`)
        return null
    }
}

export function withCache<T = unknown>(httpCall: Observable<T>, options: HttpCacheOptions): Observable<T> {
    const { url, skipCache = false } = options
    const key: string = getCacheKey(url)

    return from(isDbExists(DB_NAME)).pipe(
        switchMap((isExist: boolean) => {
            if (!isExist) {
                return httpCall.pipe(setCacheValueOperator(key, options))
            }

            return from(getCacheValue<T>(key, skipCache)).pipe(
                switchMap((cacheValue: T | null) => {
                    switch (true) {
                        case !cacheValue:
                            return httpCall.pipe(setCacheValueOperator(key, options))
                        default:
                            return of(cacheValue)
                    }
                }),
            )
        }),
    )
}
