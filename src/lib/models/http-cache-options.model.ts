export interface HttpCacheOptions {
    /**
     * @description the url of the request, used as a key for the cache
     */
    url: string
    /**
     * @description ttl in ms
     */
    ttl?: number
    version?: string
    /**
     * @description skipCache will skip the cache and make a request, default is false
     */
    skipCache?: boolean
}
