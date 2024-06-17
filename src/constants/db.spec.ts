import Dexie from 'dexie'
import * as getDBService from './db'

describe('getDB', () => {
    beforeEach(() => {
        jest.spyOn(Dexie.prototype, 'open').mockResolvedValue(new Dexie('test'))
    })
    it('should return httpCacheDB', async () => {
        ;(getDBService.httpCacheDb as Dexie) = undefined
        jest.spyOn(Dexie.prototype, 'version')
        const result = await getDBService.getDB()
        expect(result instanceof Dexie).toBeTruthy()
    })

    it('should not call to httpCacheDB.version', async () => {
        ;(getDBService.httpCacheDb as Dexie) = new Dexie('test')
        jest.spyOn(Dexie.prototype, 'version')
        const result = await getDBService.getDB()
        expect(result.version).not.toHaveBeenCalled()
        expect(result.open).not.toHaveBeenCalled()
    })

    it('should call httpCacheDB.open', async () => {
        ;(getDBService.httpCacheDb as Dexie) = undefined
        jest.spyOn(Dexie.prototype, 'open')
        const result = await getDBService.getDB()
        expect(result.open).toHaveBeenCalled()
    })

    it('should call httpCacheDB.version', async () => {
        ;(getDBService.httpCacheDb as Dexie) = undefined
        jest.spyOn(Dexie.prototype, 'version')
        const result = await getDBService.getDB()
        expect(result.version).toHaveBeenCalled()
    })
})
