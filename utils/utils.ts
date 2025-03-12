export const sessionStore = new Map<string, { data: any; timeout: NodeJS.Timeout }>();

export function storeUserSession(userId: string, data: any) {
    // Remove existing session if any
    if (sessionStore.has(userId)) {
        clearTimeout(sessionStore.get(userId)!.timeout);
    }

    // Store session
    const timeout = setTimeout(() => {
        sessionStore.delete(userId);
    }, 15 * 60 * 1000); // 15 minutes

    sessionStore.set(userId, { data, timeout });
}

export function getUserSession(userId: string) {
    return sessionStore.get(userId)?.data || null;
}

export function completeUserSession(userId: string) {
    const userData = sessionStore.get(userId)?.data;

    if (userData) {
        clearTimeout(sessionStore.get(userId)!.timeout);
        sessionStore.delete(userId);
    }
}

export function calcTimeFlow(timeAmount: number, interval: number) {
    const totalTimeFlow = timeAmount * interval;
    const msg = totalTimeFlow / 60 / 60 / 24 ? totalTimeFlow / 60 / 60 / 24 + " days" : totalTimeFlow / 60 / 60 ? totalTimeFlow / 60 / 60 + " hour" : totalTimeFlow / 60 ? totalTimeFlow / 60 + " mins" : totalTimeFlow % 60 + " sec";

    return msg;
}