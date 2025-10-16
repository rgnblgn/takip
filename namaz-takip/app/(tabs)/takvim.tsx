import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter, useFocusEffect } from 'expo-router';

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getMonthMatrix(date: Date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const matrix: (Date | null)[] = [];

    const startDay = start.getDay();
    // JS: Sunday=0 .. Saturday=6; we want week to start on Monday maybe, but keep Sunday start for simplicity
    for (let i = 0; i < startDay; i++) matrix.push(null);

    for (let d = 1; d <= end.getDate(); d++) {
        matrix.push(new Date(date.getFullYear(), date.getMonth(), d));
    }

    // pad to full weeks (7 columns)
    while (matrix.length % 7 !== 0) matrix.push(null);
    return matrix;
}

export default function TakvimScreen() {
    const router = useRouter();
    const [viewDate, setViewDate] = useState(() => new Date());
    const [logsByDate, setLogsByDate] = useState<Record<string, any>>({});
    const [startedPrayerAt, setStartedPrayerAt] = useState<string | null>(null);

    // Fetch startedPrayerAt once on mount
    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            try {
                const token = (await import('../utils/auth')).getToken();
                const t = await token;
                if (!t) return;
                const headers: any = { 'content-type': 'application/json', Authorization: `Bearer ${t}` };
                const res = await fetch('http://localhost:4000/api/profile', { headers });
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                if (data.startedPrayerAt) setStartedPrayerAt(data.startedPrayerAt);
            } catch { }
        }
        loadProfile();
        return () => { mounted = false; };
    }, []);

    // Fetch logs for visible month
    const fetchLogs = useCallback(async () => {
        try {
            const y = viewDate.getFullYear();
            const m = String(viewDate.getMonth() + 1).padStart(2, '0');
            const start = `${y}-${m}-01`;
            const endDay = String(new Date(y, viewDate.getMonth() + 1, 0).getDate()).padStart(2, '0');
            const end = `${y}-${m}-${endDay}`;
            const token = (await import('../utils/auth')).getToken();
            const t = await token;
            const headers: any = { 'content-type': 'application/json' };
            if (t) headers.Authorization = `Bearer ${t}`;
            const res = await fetch(`http://localhost:4000/api/prayer-logs?start=${start}&end=${end}`, { headers });
            if (!res.ok) return;
            const data = await res.json();
            const map: Record<string, any> = {};
            (data.logs || []).forEach((l: any) => { map[l.date] = l; });
            setLogsByDate(map);
        } catch (e) {
            // ignore
        }
    }, [viewDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [fetchLogs])
    );

    const monthMatrix = useMemo(() => getMonthMatrix(viewDate), [viewDate]);

    function prevMonth() {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }

    function nextMonth() {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }

    function openDay(date: Date) {
        // Build YYYY-MM-DD from local date components to avoid timezone shift
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${d}`;
        // navigate to gun-detay and pass date param as query
        router.push(`/gun-detay?date=${iso}`);
    }

    const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    // chunk matrix into weeks
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < monthMatrix.length; i += 7) {
        weeks.push(monthMatrix.slice(i, i + 7));
    }

    // Responsive indicator sizing
    const screenWidth = Dimensions.get('window').width;
    const dotSize = Math.max(8, Math.min(14, Math.floor((screenWidth - 64) / 40)));
    const checkSize = Math.max(20, Math.min(36, Math.floor((screenWidth - 64) / 7)));
    const isNarrow = screenWidth < 360;

    // Helper: is date between startedPrayerAt and today (inclusive)
    function isCompletedDay(date: Date) {
        if (!startedPrayerAt) return false;
        const start = new Date(startedPrayerAt);
        const end = new Date();
        // Zero out time for comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={prevMonth} style={styles.headerButton}>
                    <ThemedText>{'<'}</ThemedText>
                </TouchableOpacity>
                <ThemedText type="title">{viewDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</ThemedText>
                <TouchableOpacity onPress={nextMonth} style={styles.headerButton}>
                    <ThemedText>{'>'}</ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
                {weekDays.map(w => (
                    <View key={w} style={styles.weekCell}>
                        <ThemedText type="defaultSemiBold">{w}</ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.weeksContainer}>
                {weeks.map((week, wi) => (
                    <View key={wi} style={styles.weekRowInner}>
                        {week.map((item, di) => {
                            const isToday = item
                                ? item.toDateString() === new Date().toDateString()
                                : false;
                            const dateKey = item ? `${item.getFullYear()}-${String(item.getMonth() + 1).padStart(2, '0')}-${String(item.getDate()).padStart(2, '0')}` : null;
                            const log = dateKey ? logsByDate[dateKey] : null;
                            const completed = item && isCompletedDay(item);
                            return (
                                <TouchableOpacity
                                    key={di}
                                    style={[styles.dayCell, isToday ? styles.today : undefined]}
                                    disabled={!item}
                                    onPress={() => item && openDay(item)}
                                >
                                    <ThemedText>{item ? String(item.getDate()) : ''}</ThemedText>
                                    {item && (
                                        completed ? (
                                            <View style={[styles.checkContainer, { marginTop: 6 }]}>
                                                <View style={{ width: checkSize, height: checkSize, borderRadius: checkSize / 2, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ThemedText style={{ color: '#fff', fontSize: checkSize * 0.7, fontWeight: 'bold' }}>✓</ThemedText>
                                                </View>
                                            </View>
                                        ) : (
                                            isNarrow ? (
                                                <View style={styles.compactBadge}>
                                                    <View style={[styles.compactDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#fff', borderColor: '#bbb' }]} />
                                                </View>
                                            ) : (
                                                <View style={[styles.prayerRow, { flexWrap: 'wrap' }]}>
                                                    {['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'].map((k) => {
                                                        const done = log ? (log[k] > 0) : false;
                                                        return <View key={k} style={[
                                                            styles.prayerDot,
                                                            { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
                                                            done ? styles.prayerDone : styles.prayerMissingNeutral
                                                        ]} />;
                                                    })}
                                                </View>
                                            )
                                        )
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerButton: {
        padding: 8,
    },
    weekRow: {
        flexDirection: 'row',
        marginTop: 12,
    },
    weekCell: {
        flex: 1,
        alignItems: 'center',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weeksContainer: {
        marginTop: 8,
    },
    weekRowInner: {
        flexDirection: 'row',
    },
    today: {
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        backgroundColor: 'rgba(0,122,255,0.08)'
    },
    prayerRow: { flexDirection: 'row', marginTop: 6, gap: 4, justifyContent: 'center', flexWrap: 'wrap' },
    prayerDot: { borderWidth: 1, borderColor: '#ccc' },
    prayerDone: { backgroundColor: '#34C759', borderColor: '#2ea84d' },
    prayerMissing: { backgroundColor: '#fff', borderColor: '#ff3b30' },
    prayerMissingNeutral: { backgroundColor: 'transparent', borderColor: '#ccc' },
    compactBadge: { marginTop: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, backgroundColor: 'transparent' },
    compactDot: { borderWidth: 1, borderColor: '#bbb', backgroundColor: '#fff' },
    checkContainer: { alignItems: 'center', justifyContent: 'center' },
});
