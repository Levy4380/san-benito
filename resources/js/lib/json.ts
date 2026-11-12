export async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        signal,
    });

    if (!response.ok) {
        throw new Error(String(response.status));
    }

    return response.json() as Promise<T>;
}
