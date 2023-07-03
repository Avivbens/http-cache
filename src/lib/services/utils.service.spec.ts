import Dexie from 'dexie'
import * as httpUtilsService from './utils.service'

describe('UtilsService', () => {
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
})
