import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

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
                            return (
                                <TouchableOpacity
                                    key={di}
                                    style={[styles.dayCell, isToday ? styles.today : undefined]}
                                    disabled={!item}
                                    onPress={() => item && openDay(item)}
                                >
                                    <ThemedText>{item ? String(item.getDate()) : ''}</ThemedText>
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
});
