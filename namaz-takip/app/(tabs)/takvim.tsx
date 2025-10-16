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
    // Her gün hücresinin boyutunu dinamik almak için
    const [cellSize, setCellSize] = useState(0);
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
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    }

    function nextMonth() {
        // Don't allow navigating to future months
        const now = new Date();
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        if (next > new Date(now.getFullYear(), now.getMonth(), 1)) return;
        setViewDate(next);
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

    // Don't allow navigating to future months
    const now = new Date();
    const isCurrentMonth = viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={prevMonth} style={styles.headerButton}>
                    <ThemedText>{'<'}</ThemedText>
                </TouchableOpacity>
                <ThemedText type="title">{viewDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</ThemedText>
                <TouchableOpacity onPress={nextMonth} style={styles.headerButton} disabled={isCurrentMonth}>
                    <ThemedText style={isCurrentMonth ? { color: '#bbb' } : undefined}>{'>'}</ThemedText>
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
                            const isFuture = item ? item > now : false;
                            const dateKey = item ? `${item.getFullYear()}-${String(item.getMonth() + 1).padStart(2, '0')}-${String(item.getDate()).padStart(2, '0')}` : null;
                            const log = dateKey ? logsByDate[dateKey] : null;
                            const completed = item && isCompletedDay(item);
                            // Determine if all 5 vakits are done for this day
                            const vakitKeys = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'];
                            const allDone = vakitKeys.every(k => log && log[k] > 0);
                            // Yarım çember için açıları ve pozisyonları tanımla
                            const circlePositions = [
                                { angle: -90, vakit: 'sabah' },      // üst
                                { angle: -45, vakit: 'ogle' },       // sağ üst
                                { angle: 0, vakit: 'ikindi' },       // sağ
                                { angle: 45, vakit: 'aksam' },       // sağ alt
                                { angle: 90, vakit: 'yatsi' },       // alt
                            ];
                            // Yarıçapı gün hücresinin boyutuna göre ayarla (hücre boyutuna göre dinamik)
                            const center = cellSize / 2;
                            const R = Math.max(cellSize * 0.38, 12); // hücreye göre yarıçap
                            console.log("cellSize, R:", cellSize, R);
                            return (
                                <TouchableOpacity
                                    key={di}
                                    style={[styles.dayCell, isToday ? styles.today : undefined, styles.dayCellBorder]}
                                    disabled={!item || isFuture}
                                    onPress={() => item && !isFuture && openDay(item)}
                                    onLayout={e => {
                                        const size = e.nativeEvent.layout.width;
                                        if (size && size !== cellSize) setCellSize(size);
                                    }}
                                >
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {/* Yarım çemberde 5 vakit noktası */}
                                        {item && !(completed || allDone) && cellSize > 0 && (
                                            circlePositions.map((pos, idx) => {
                                                const rad = (Math.PI / 180) * pos.angle;
                                                const x = Math.cos(rad) * R;
                                                const y = Math.sin(rad) * R;
                                                const done = log ? (log[pos.vakit] > 0) : false;
                                                return (
                                                    <View
                                                        key={pos.vakit}
                                                        style={[
                                                            styles.prayerDot,
                                                            styles.prayerDotSmall,
                                                            done ? styles.prayerDone : styles.prayerMissingNeutral,
                                                            {
                                                                position: 'absolute',
                                                                left: (center / 10) + 3 + x - 3.5, // 3.5 = dot yarıçapı (7/2)
                                                                top: (center / 1.05) + 1 + y - 3.5,
                                                            }
                                                        ]}
                                                    />
                                                );
                                            })
                                        )}
                                        {/* Gün numarası */}
                                        <ThemedText style={{ zIndex: 2, fontWeight: 'bold' }}>{item ? String(item.getDate()) : ''}</ThemedText>
                                        {/* Tamamlandıysa tik */}
                                        {item && (completed || allDone) ? (
                                            <View style={[styles.checkContainer, { marginLeft: 6, position: 'absolute' }]}>
                                                <View style={{ width: checkSize, height: checkSize, borderRadius: checkSize / 2, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ThemedText style={{ color: '#fff', fontSize: checkSize * 0.7, fontWeight: 'bold' }}>✓</ThemedText>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
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
        backgroundColor: '#f6f8fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e9eef6',
        marginHorizontal: 2,
    },
    weekRow: {
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 2,
    },
    weekCell: {
        flex: 1,
        alignItems: 'center',
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        color: '#6b7280',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        transitionProperty: 'box-shadow',
        transitionDuration: '0.2s',
    },
    dayCellBorder: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    weeksContainer: {
        marginTop: 4,
    },
    weekRowInner: {
        flexDirection: 'row',
    },
    today: {
        borderWidth: 2,
        borderColor: '#2563eb',
        borderRadius: 12,
        backgroundColor: '#e0e7ff',
        shadowColor: '#2563eb',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    prayerRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 4,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    prayerCol: {
        flexDirection: 'column',
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    prayerDot: {
        borderWidth: 1.5,
        borderColor: '#d1d5db',
        marginVertical: 2,
        backgroundColor: '#f3f4f6',
    },
    prayerDone: {
        backgroundColor: '#4ade80',
        borderColor: '#22c55e',
        shadowColor: '#22c55e',
        shadowOpacity: 0.18,
        shadowRadius: 2,
        elevation: 1,
    },
    prayerMissing: {
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
    },
    prayerMissingNeutral: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
    },
    compactBadge: {
        marginTop: 6,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    compactDot: {
        borderWidth: 1.5,
        borderColor: '#bbb',
        backgroundColor: '#fff',
    },
    checkContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 2,
        shadowColor: '#22c55e',
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 2
    },
    prayerDotRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2
    },
    dayCustomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    prayerDotTopRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        gap: 2,
    },
    prayerDotRightCol: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        gap: 2,
    },
    prayerDotSmall: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginHorizontal: 1,
        marginVertical: 0
    }
});
