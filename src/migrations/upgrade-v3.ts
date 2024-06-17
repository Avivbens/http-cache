import type { HttpCacheItem } from '../models/http-cache-item.model'
import { decodeKey, getDefaultRecordReference } from '../services/utils.service'

export const upgradeTableToV3 = (request: HttpCacheItem) => {
    const { key } = request
    const url = decodeKey(key)
    !request.reference && (request.reference = getDefaultRecordReference(url))
    !request.url && (request.url = url)
}
