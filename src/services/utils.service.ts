import Dexie from 'dexie'

export async function isDbExists(dbName: string): Promise<boolean> {
    try {
        const isExists: boolean = await Dexie.exists(dbName)
        return isExists
    } catch (error) {
        console.error(`[UtilsService] isDbExists error: ${error.message}`)
        return false
    }
}

export function getCacheKey(url: string): string {
    return btoa(url)
}
export function decodeKey(url: string): string {
    return atob(url)
}

export function isValidTTL(updatedAt: number, ttl: number): boolean {
    const now: number = Date.now()
    const diff: number = now - updatedAt

    return diff < ttl
}

export function getDefaultRecordReference(requestUrl: string): string {
    const { pathname } = new URL(requestUrl)
    return pathname
}
