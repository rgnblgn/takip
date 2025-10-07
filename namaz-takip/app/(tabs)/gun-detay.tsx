import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoute } from '@react-navigation/native';

export default function GunDetayScreen() {
    const router = useRouter();
    const params = useLocalSearchParams() as { date?: string };
    const route = useRoute();
    // route.params may be undefined or contain the param depending on how the screen was navigated
    const navParams = (route && (route as any).params) || {};
    console.log('GunDetay expo-router params:', params, 'react-nav params:', navParams);

    // Prefer local search params, fallback to navigation params
    const dateStr = params?.date ?? navParams?.date;

    let display = 'Tarih seçilmedi';
    if (dateStr) {
        try {
            const d = new Date(dateStr + 'T00:00:00');
            display = d.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            display = dateStr;
        }
    }

    // prayer check state
    const [sab, setSab] = useState(false);
    const [ogle, setOgle] = useState(false);
    const [ikindi, setIkindi] = useState(false);
    const [aksam, setAksam] = useState(false);
    const [yatsi, setYatsi] = useState(false);
    const [vitr, setVitr] = useState(false);

    const allFarzDone = useMemo(() => sab && ogle && ikindi && aksam && yatsi, [sab, ogle, ikindi, aksam, yatsi]);

    return (
        <ThemedView style={styles.container}>
            <View style={styles.row}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText>{'< Geri'}</ThemedText>
                </TouchableOpacity>
            </View>

            <ThemedText type="title">Gün Detay</ThemedText>
            <ThemedText type="subtitle">{display}</ThemedText>

            <View style={styles.checkList}>
                <PrayRow label="Sabah" value={sab} onToggle={() => setSab(s => !s)} />
                <PrayRow label="Öğle" value={ogle} onToggle={() => setOgle(s => !s)} />
                <PrayRow label="İkindi" value={ikindi} onToggle={() => setIkindi(s => !s)} />
                <PrayRow label="Akşam" value={aksam} onToggle={() => setAksam(s => !s)} />
                <PrayRow label="Yatsı" value={yatsi} onToggle={() => setYatsi(s => !s)} />
                <PrayRow label="Vitr" value={vitr} onToggle={() => setVitr(s => !s)} />
            </View>

            {allFarzDone ? (
                <View style={styles.completeBox}>
                    <ThemedText type="title">✓</ThemedText>
                    <ThemedText type="defaultSemiBold">tüm farzlar tamamlandı</ThemedText>
                </View>
            ) : null}
        </ThemedView>
    );
}

function PrayRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
    return (
        <TouchableOpacity style={prayerStyles.row} onPress={onToggle}>
            <View style={[prayerStyles.box, value ? prayerStyles.boxChecked : undefined]}>
                {value ? <ThemedText style={prayerStyles.check}>✓</ThemedText> : null}
            </View>
            <ThemedText>{label}</ThemedText>
        </TouchableOpacity>
    );
}

const prayerStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    box: { width: 22, height: 22, borderWidth: 1, borderColor: '#666', alignItems: 'center', justifyContent: 'center' },
    boxChecked: { backgroundColor: '#0a9d43', borderColor: '#0a9d43' },
    check: { color: '#fff' },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 8,
    },
    row: { flexDirection: 'row', width: '100%', justifyContent: 'flex-start' },
    backButton: { padding: 8 },
    checkList: { marginTop: 12 },
    completeBox: { marginTop: 16, alignItems: 'center', gap: 6, padding: 12, backgroundColor: 'rgba(10,157,67,0.08)', borderRadius: 8 },
});
