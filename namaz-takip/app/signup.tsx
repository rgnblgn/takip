import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { saveCredentials, saveToken } from './utils/auth';
import { useRouter } from 'expo-router';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function onSignup() {
        if (!email || !password) { setError('Lütfen e-posta ve şifre girin'); return; }
        try {
            const res = await fetch('http://localhost:4000/api/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
            if (!res.ok) throw new Error('api');
            const data = await res.json();
            if (data && data.token) {
                await saveToken(data.token);
            }
            // save locally too
            await saveCredentials(email, password);
            router.replace('/');
        } catch (e) {
            // fallback to local save
            await saveCredentials(email, password);
            router.replace('/');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Kayıt Ol</ThemedText>
            {error ? <ThemedText>{error}</ThemedText> : null}
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-posta" />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Şifre" secureTextEntry />
            <TouchableOpacity onPress={onSignup} style={styles.btn}><ThemedText>Kaydol</ThemedText></TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 8 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 },
    btn: { marginTop: 12, padding: 12, backgroundColor: '#007AFF', alignItems: 'center', borderRadius: 6 }
});
