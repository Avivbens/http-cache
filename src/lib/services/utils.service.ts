import Dexie from 'dexie'
import { DB_NAME } from '../constants/config'

export async function isDbExists(): Promise<boolean> {
    try {
        const isExists: boolean = await Dexie.exists(DB_NAME)
        return isExists
    } catch (error) {
        console.error(`[UtilsService] isDbExists error: ${error.message}`)
        return false
    }
}
