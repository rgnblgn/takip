import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { validateCredentials, saveToken } from './utils/auth';
import { useRouter } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function onLogin() {
        if (!email || !password) { setError('Lütfen e-posta ve şifre girin'); return; }
        try {
            const res = await fetch('http://localhost:4000/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
            if (!res.ok) throw new Error('invalid');
            const data = await res.json();
            if (data && data.token) {
                await saveToken(data.token);
            }
            // also save locally for offline
            await (await import('./utils/auth')).saveCredentials(email, password);
            router.replace('/');
            return;
        } catch (e) {
            // fallback to local validation
            const ok = await validateCredentials(email, password);
            if (!ok) { setError('Hatalı kullanıcı adı veya şifre'); return; }
            router.replace('/');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Giriş Yap</ThemedText>
            {error ? <ThemedText>{error}</ThemedText> : null}
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-posta" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Şifre" secureTextEntry />
            <TouchableOpacity onPress={onLogin} style={styles.btn}><ThemedText>Giriş</ThemedText></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/signup')} style={styles.link}><ThemedText type="link">Hesabın yok mu? Kayıt Ol</ThemedText></TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
    btn: { marginTop: 12, padding: 12, backgroundColor: '#007AFF', alignItems: 'center', borderRadius: 6 }
    , link: { marginTop: 12, alignItems: 'center' }
});
