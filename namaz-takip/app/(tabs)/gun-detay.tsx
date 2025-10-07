import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function GunDetayScreen() {
    const router = useRouter();
    const params = useLocalSearchParams() as { date?: string };
    const dateStr = params.date;

    let display = 'Tarih seçilmedi';
    if (dateStr) {
        try {
            const d = new Date(dateStr + 'T00:00:00');
            display = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            display = dateStr;
        }
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText>{'< Geri'}</ThemedText>
                </TouchableOpacity>
            </View>

            <ThemedText type="title">Gün Detay</ThemedText>
            <ThemedText>{display}</ThemedText>
            <ThemedText>Burada seçilen güne ait detaylar (namaz vakitleri vs.) gösterilecek.</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 8,
    },
    row: { flexDirection: 'row', width: '100%', justifyContent: 'flex-start' },
    backButton: { padding: 8 },
});
