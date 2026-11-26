const retryDelays = [250, 1_000, 3_000];

export async function reconcileUsage(
    reservation: string,
    write: () => PromiseLike<{ error: unknown }>,
    reportFailure: (reservationId: string, attempt: number, willRetry: boolean) => void,
    wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
): Promise<void> {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        try {
            const { error } = await write();
            if (!error) return;
        } catch {
            // A lost response may follow a successful write. The same reservation is safe to retry.
        }
        const delay = retryDelays[attempt];
        reportFailure(reservation, attempt + 1, delay !== undefined);
        if (delay !== undefined) await wait(delay);
    }
}
