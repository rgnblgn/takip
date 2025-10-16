import React, { useMemo, useState, useEffect } from 'react';
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

    // load prayer log for date
    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!dateStr) return;
            try {
                const token = (await import('../utils/auth')).getToken();
                const t = await token;
                const headers: any = { 'content-type': 'application/json' };
                if (t) headers.Authorization = `Bearer ${t}`;
                const res = await fetch(`http://localhost:4000/api/prayer-logs?start=${dateStr}&end=${dateStr}`, { headers });
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                const log = (data.logs && data.logs[0]) || null;
                if (log) {
                    setSab(Boolean(log.sabah));
                    setOgle(Boolean(log.ogle));
                    setIkindi(Boolean(log.ikindi));
                    setAksam(Boolean(log.aksam));
                    setYatsi(Boolean(log.yatsi));
                    setVitr(Boolean(log.vitr));
                } else {
                    // clear previous day's state when no log exists for this date
                    setSab(false);
                    setOgle(false);
                    setIkindi(false);
                    setAksam(false);
                    setYatsi(false);
                    setVitr(false);
                }
            } catch (e) {
                // ignore
            }
        }
        load();
        return () => { mounted = false; };
    }, [dateStr]);

    const allFarzDone = useMemo(() => sab && ogle && ikindi && aksam && yatsi, [sab, ogle, ikindi, aksam, yatsi]);

    // helper: persist given values for this date (explicit payload avoids state race)
    async function saveForDate(d: string, vals: { sabah?: number; ogle?: number; ikindi?: number; aksam?: number; yatsi?: number; vitr?: number }) {
        if (!d) return;
        try {
            const token = (await import('../utils/auth')).getToken();
            const t = await token;
            const headers: any = { 'content-type': 'application/json' };
            if (t) headers.Authorization = `Bearer ${t}`;
            await fetch('http://localhost:4000/api/prayer-log', {
                method: 'POST', headers, body: JSON.stringify({ date: d, ...vals })
            });
        } catch (e) {
            // ignore
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
            <ThemedText type="subtitle">{display}</ThemedText>

            <View style={styles.checkList}>
                <PrayRow label="Sabah" value={sab} onToggle={async () => { const nv = !sab; setSab(nv); await saveForDate(dateStr, { sabah: nv ? 1 : 0, ogle: ogle ? 1 : 0, ikindi: ikindi ? 1 : 0, aksam: aksam ? 1 : 0, yatsi: yatsi ? 1 : 0, vitr: vitr ? 1 : 0 }); }} />
                <PrayRow label="Öğle" value={ogle} onToggle={async () => { const nv = !ogle; setOgle(nv); await saveForDate(dateStr, { sabah: sab ? 1 : 0, ogle: nv ? 1 : 0, ikindi: ikindi ? 1 : 0, aksam: aksam ? 1 : 0, yatsi: yatsi ? 1 : 0, vitr: vitr ? 1 : 0 }); }} />
                <PrayRow label="İkindi" value={ikindi} onToggle={async () => { const nv = !ikindi; setIkindi(nv); await saveForDate(dateStr, { sabah: sab ? 1 : 0, ogle: ogle ? 1 : 0, ikindi: nv ? 1 : 0, aksam: aksam ? 1 : 0, yatsi: yatsi ? 1 : 0, vitr: vitr ? 1 : 0 }); }} />
                <PrayRow label="Akşam" value={aksam} onToggle={async () => { const nv = !aksam; setAksam(nv); await saveForDate(dateStr, { sabah: sab ? 1 : 0, ogle: ogle ? 1 : 0, ikindi: ikindi ? 1 : 0, aksam: nv ? 1 : 0, yatsi: yatsi ? 1 : 0, vitr: vitr ? 1 : 0 }); }} />
                <PrayRow label="Yatsı" value={yatsi} onToggle={async () => { const nv = !yatsi; setYatsi(nv); await saveForDate(dateStr, { sabah: sab ? 1 : 0, ogle: ogle ? 1 : 0, ikindi: ikindi ? 1 : 0, aksam: aksam ? 1 : 0, yatsi: nv ? 1 : 0, vitr: vitr ? 1 : 0 }); }} />
                <PrayRow label="Vitr" value={vitr} onToggle={async () => { const nv = !vitr; setVitr(nv); await saveForDate(dateStr, { sabah: sab ? 1 : 0, ogle: ogle ? 1 : 0, ikindi: ikindi ? 1 : 0, aksam: aksam ? 1 : 0, yatsi: yatsi ? 1 : 0, vitr: nv ? 1 : 0 }); }} />
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
