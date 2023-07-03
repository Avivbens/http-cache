import Dexie from 'dexie'
import { of } from 'rxjs'
import * as getDB from '../constants/db'
import {
    getCacheKey,
    getCacheValue,
    isValidTTL,
    setCacheValue,
    setCacheValueOperator,
    withCache,
} from './http-cache.service'
import * as httpCacheService from './http-cache.service'
import * as httpUtilsService from './utils.service'

describe('http-cache.service', () => {
    const mockTable = {
        get: jest.fn(),
        add: jest.fn(),
        delete: jest.fn(),
    }
    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()

        jest.spyOn(Dexie.prototype, 'table').mockReturnValue(mockTable as any)
    })

    // must be UP
    describe('setCacheValue', () => {
        it('should call db.table.add', async () => {
            const key = 'key'
            const payload = 'payload'
            const options = { url: 'url', ttl: 1000 }
            mockTable.add.mockResolvedValue({ key })
            await setCacheValue(key, payload, options)
            expect(mockTable.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    key,
                    res: payload,
                    ttl: options.ttl,
                }),
                key,
            )
        })
    })

    describe('isValidTTL', () => {
        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(new Date('01/01/2022'))
        })
        it('should return false if ttl is invalid', () => {
            const updatedAt = Date.now() - 1000
            const ttl = 500
            const result = isValidTTL(updatedAt, ttl)
            expect(result).toBeFalsy()
        })

        it('should return true if ttl is valid', () => {
            const updatedAt = Date.now() - 1000
            const ttl = 2000
            const result = isValidTTL(updatedAt, ttl)
            expect(result).toBeTruthy()
        })
    })

    describe('Operator setCacheValueOperator', () => {
        beforeEach(() => {
            jest.spyOn(httpCacheService, 'setCacheValue')
        })
        it('should return payload', () => {
            const payload = 'payload'
            const source = of(payload)
            source.pipe(setCacheValueOperator('key', { url: 'url' })).subscribe((res) => {
                expect(httpCacheService.setCacheValue).toHaveBeenCalled()
                expect(res).toEqual(payload)
            })
        })

        it('should return null and not call setCacheValue', (done) => {
            const payload = null
            const source = of(payload)
            source.pipe(setCacheValueOperator('key', { url: 'url' })).subscribe((res) => {
                expect(httpCacheService.setCacheValue).not.toHaveBeenCalled()
                expect(res).toEqual(payload)
                done()
            })
        })
    })

    describe('getCacheValue', () => {
        it('should return null if cacheValue is undefined or null', async () => {
            jest.spyOn(getDB, 'getDB').mockReturnValue(new Dexie('test'))
            const res = null
            mockTable.get.mockResolvedValue(res)
            const result = await getCacheValue('key')
            expect(result).toEqual(res)
        })

        it('should return null if cache is not valid', async () => {
            jest.spyOn(getDB, 'getDB').mockReturnValue(new Dexie('test'))
            const res = null
            const id = 1
            jest.spyOn(httpCacheService, 'isValidTTL').mockReturnValue(false)
            mockTable.get.mockResolvedValue({ id })
            mockTable.delete.mockResolvedValue(undefined)
            const result = await getCacheValue('key')
            expect(result).toEqual(res)
        })

        it('should return res if cache is valid', async () => {
            jest.spyOn(getDB, 'getDB').mockReturnValue(new Dexie('test'))
            const res = true
            const id = 1
            jest.spyOn(httpCacheService, 'isValidTTL').mockReturnValue(true)
            mockTable.get.mockResolvedValue({ id, updatedAt: new Date().getTime(), ttl: 1, res })
            const result = await getCacheValue('key')
            expect(result).toEqual(res)
        })

        it('should call delete if cache is not valid', async () => {
            jest.spyOn(getDB, 'getDB').mockReturnValue(new Dexie('test'))
            const res: Promise<unknown> = Promise.resolve(true)
            const id = 1
            jest.spyOn(httpCacheService, 'isValidTTL').mockReturnValue(false)
            mockTable.get.mockResolvedValue({ id, res })
            const result = await getCacheValue('key')
            expect(mockTable.delete).toHaveBeenCalledWith(id)
        })
    })

    describe('getCacheKey', () => {
        it('should return base64 encoded string', () => {
            const url = 'https://example.com'
            const result = getCacheKey(url)
            const expected = btoa(url)
            expect(result).toBe(expected)
        })
    })

    describe('isDbExists', () => {
        it('should return true if db exists', async () => {
            const res = true
            jest.spyOn(Dexie, 'exists').mockResolvedValue(res)
            const result = await httpUtilsService.isDbExists()
            expect(result).toEqual(res)
        })

        it('should return false if db does not exist', async () => {
            const res = false
            jest.spyOn(Dexie, 'exists').mockResolvedValue(res)
            const result = await httpUtilsService.isDbExists()
            expect(result).toEqual(res)
        })
    })

    describe('withCache', () => {
        beforeEach(() => {
            jest.spyOn(httpCacheService, 'getCacheKey').mockReturnValue('key')
        })
        it('should return httpCall if db is not exists', (done) => {
            jest.spyOn(httpUtilsService, 'isDbExists').mockResolvedValueOnce(false)
            jest.spyOn(httpCacheService, 'setCacheValueOperator').mockReturnValueOnce((source) => source)
            const httpCall = of('httpCall')
            const options = { url: 'url' }
            const result = withCache(httpCall, options)
            result.subscribe((res) => {
                expect(res).toEqual('httpCall')
                done()
            })
        })
        it('should return httpCall if db is exists and cacheValue is not exists', (done) => {
            jest.spyOn(httpUtilsService, 'isDbExists').mockResolvedValueOnce(true)
            jest.spyOn(httpCacheService, 'getCacheValue').mockResolvedValueOnce(null)
            jest.spyOn(httpCacheService, 'setCacheValueOperator').mockReturnValueOnce((source) => source)
            const httpCall = of('httpCall')
            const options = { url: 'url' }
            const result = withCache(httpCall, options)
            result.subscribe((res) => {
                expect(res).toEqual('httpCall')
                done()
            })
        })

        it.skip('should return cacheValue if db is exists and cacheValue is exists', (done) => {
            jest.spyOn(httpUtilsService, 'isDbExists').mockImplementation(async () => true)
            // jest.spyOn(Dexie,'exists').mockResolvedValueOnce(true)
            //   jest.spyOn(httpCacheService, 'getCacheValue').mockResolvedValueOnce('cacheValue');
            jest.spyOn(httpCacheService, 'setCacheValueOperator').mockReturnValueOnce((source) => source)
            const httpCall = of('httpCall')
            const options = { url: 'url' }
            const result = withCache(httpCall, options)
            result.subscribe((res) => {
                expect(res).toEqual('cacheValue')
                done()
            })
        })
    })
})
