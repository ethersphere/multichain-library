import { Dates, RollingValueProvider, System } from 'cafe-utility'
import { MultichainLibrarySettings } from './Settings.js'

export async function durableFetch(
    jsonRpcProvider: RollingValueProvider<string>,
    settings: MultichainLibrarySettings,
    method: 'GET' | 'POST',
    body?: unknown
): Promise<Response> {
    const response = await System.withRetries(
        async () => {
            const response = await fetch(jsonRpcProvider.current(), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(settings.fetchTimeoutMillis)
            })
            return response
        },
        5,
        Dates.seconds(1),
        Dates.seconds(5),
        console.error,
        () => jsonRpcProvider.next()
    )
    return response
}
