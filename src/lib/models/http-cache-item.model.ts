/**
 * @description currently support for only GET method
 */
export type HttpMethod = 'GET'
// export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface HttpCacheItem<T = unknown> {
    id: string
    key: string
    method: HttpMethod
    res: T
    ttl?: number
    version?: string
    updatedAt: number
}
