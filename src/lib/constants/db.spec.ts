import Dexie from 'dexie'
import * as getDBService from './db'

describe('getDB', () => {
    it('should return httpCacheDB', () => {
        // @ts-ignore
        getDBService.httpCacheDb = undefined
        jest.spyOn(Dexie.prototype, 'version')
        const result = getDBService.getDB()
        expect(result instanceof Dexie).toBeTruthy()
    })

    it('should not call to httpCacheDB.version', () => {
        // @ts-ignore
        getDBService.httpCacheDb = new Dexie('test')
        jest.spyOn(Dexie.prototype, 'version')
        const result = getDBService.getDB()
        expect(result.version).not.toHaveBeenCalled()
    })

    it('should call httpCacheDB.open', () => {
        jest.spyOn(Dexie.prototype, 'open')
        const result = getDBService.getDB()
        expect(result.open).toHaveBeenCalled()
    })

    it('should call httpCacheDB.version', () => {
        // @ts-ignore
        getDBService.httpCacheDb = undefined
        jest.spyOn(Dexie.prototype, 'version')
        const result = getDBService.getDB()
        expect(result.version).toHaveBeenCalled()
    })
})
