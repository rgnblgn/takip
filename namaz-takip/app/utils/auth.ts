// Lightweight auth helper: tries to use expo-secure-store if available,
// otherwise falls back to in-memory storage (not persistent).
let SecureStore: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SecureStore = require('expo-secure-store');
} catch (e) {
    SecureStore = null;
}

const STORAGE_KEY = 'namaz-takip-auth';
let inMemory: { email?: string; password?: string } = {};

export async function saveCredentials(email: string, password: string) {
    if (SecureStore && SecureStore.setItemAsync) {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ email, password }));
    } else {
        inMemory.email = email;
        inMemory.password = password;
    }
}

export async function getStoredCredentials(): Promise<{ email?: string; password?: string } | null> {
    if (SecureStore && SecureStore.getItemAsync) {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    } else {
        return inMemory.email ? { email: inMemory.email, password: inMemory.password } : null;
    }
}

export async function validateCredentials(email: string, password: string) {
    const stored = await getStoredCredentials();
    if (!stored) return false;
    return stored.email === email && stored.password === password;
}
