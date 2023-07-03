import type { Observable } from 'rxjs'
import { from, of, switchMap } from 'rxjs'
import { DEFAULT_TTL, DEFAULT_VERSION } from '../constants/config'
import { getDB } from '../constants/db'
import type { HttpCacheItem, HttpCacheOptions } from '../models'
import { IndexedDbTable } from '../models'
import { isDbExists } from './utils.service'

export async function setCacheValue<T = unknown>(key: string, payload: T, options: HttpCacheOptions): Promise<void> {
    try {
        const { ttl = DEFAULT_TTL, version = DEFAULT_VERSION } = options
        const updatedAt: number = Date.now()
        const cacheValue: Omit<HttpCacheItem<T>, 'id' | 'method'> = {
            key,
            res: payload,
            ttl,
            version,
            updatedAt,
        }

        const db = getDB()

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

export function getCacheKey(url: string): string {
    return btoa(url)
}

export function isValidTTL(updatedAt: number, ttl: number): boolean {
    const now: number = Date.now()
    const diff: number = now - updatedAt

    return diff < ttl
}

export async function getCacheValue<T = unknown>(key: string, skipCache = false): Promise<T> {
    try {
        const db = getDB()
        const cacheValue: HttpCacheItem<T> = await db.table<HttpCacheItem<T>>(IndexedDbTable.Requests).get({
            key,
        })
        if (!cacheValue) {
            return null
        }

        const { id, updatedAt, ttl, res } = cacheValue

        const isCacheValid: boolean = isValidTTL(updatedAt, ttl)
        if (!isCacheValid || skipCache) {
            db.table<HttpCacheItem<T>>(IndexedDbTable.Requests).delete(id)
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

    return from(isDbExists()).pipe(
        switchMap((isExist: boolean) => {
            if (!isExist) {
                return httpCall.pipe(setCacheValueOperator(key, options))
            }

            return from(getCacheValue<T>(key, skipCache)).pipe(
                switchMap((cacheValue: T) => {
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
