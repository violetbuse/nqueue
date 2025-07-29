import { initClient } from '@ts-rest/core'
import { contract } from 'shared'

export const createClient = (baseUrl: string) => {
    const client = initClient(contract, {
        baseUrl,
    })

    return client;
}
