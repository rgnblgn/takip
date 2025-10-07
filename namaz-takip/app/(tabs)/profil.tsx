import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function parseYMD(s?: string) {
    if (!s) return null;
    // accept YYYY-MM-DD
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const date = new Date(y, mo, d);
    if (isNaN(date.getTime())) return null;
    return date;
}

export default function ProfilScreen() {
    const [mukellefSince, setMukellefSince] = useState('');
    const [startedPrayerAt, setStartedPrayerAt] = useState('');
    const [showPickerFor, setShowPickerFor] = useState<null | 'mukellef' | 'started'>(null);
    const [pickerViewDate, setPickerViewDate] = useState(() => new Date());

    function formatDateYMD(d: Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }

    const startDate = useMemo(() => parseYMD(mukellefSince), [mukellefSince]);
    const startedDate = useMemo(() => parseYMD(startedPrayerAt), [startedPrayerAt]);

    let daysDiff: number | null = null;
    if (startDate && startedDate) {
        const ms = Math.abs(startDate.getTime() - startedDate.getTime());
        daysDiff = Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Profil</ThemedText>

            <ThemedText>Bu mükellef olduğun gün</ThemedText>
            <TouchableOpacity onPress={() => { setPickerViewDate(mukellefSince ? new Date(mukellefSince) : new Date()); setShowPickerFor('mukellef'); }}>
                <TextInput value={mukellefSince} editable={false} placeholder="2025-09-13" style={styles.input} />
            </TouchableOpacity>

            <ThemedText>Namaza başladığın gün</ThemedText>
            <TouchableOpacity onPress={() => { setPickerViewDate(startedPrayerAt ? new Date(startedPrayerAt) : new Date()); setShowPickerFor('started'); }}>
                <TextInput value={startedPrayerAt} editable={false} placeholder="2020-01-01" style={styles.input} />
            </TouchableOpacity>

            <Modal visible={!!showPickerFor} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setPickerViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ThemedText>{'<'}</ThemedText></TouchableOpacity>
                            <ThemedText type="title">{pickerViewDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</ThemedText>
                            <TouchableOpacity onPress={() => setPickerViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ThemedText>{'>'}</ThemedText></TouchableOpacity>
                        </View>
                        <CalendarGrid
                            viewDate={pickerViewDate}
                            onSelect={(d: Date) => {
                                const formatted = formatDateYMD(d);
                                if (showPickerFor === 'mukellef') setMukellefSince(formatted);
                                if (showPickerFor === 'started') setStartedPrayerAt(formatted);
                                setShowPickerFor(null);
                            }}
                        />
                        <TouchableOpacity onPress={() => setShowPickerFor(null)} style={{ marginTop: 12 }}><ThemedText>İptal</ThemedText></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.result}>
                {daysDiff === null ? (
                    <ThemedText>İki geçerli tarih girin.</ThemedText>
                ) : (
                    <>
                        <ThemedText>{`${daysDiff} gün`}</ThemedText>
                        <ThemedText style={styles.bold}>{`${daysDiff} x Sabah, Öğle, İkindi, Akşam, Yatsı namaz borcunuz var`}</ThemedText>
                    </>
                )}
            </View>
        </ThemedView>
    );
}

function CalendarGrid({ viewDate, onSelect }: { viewDate: Date; onSelect: (d: Date) => void }) {
    function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
    function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const matrix: (Date | null)[] = [];
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) matrix.push(null);
    for (let d = 1; d <= end.getDate(); d++) matrix.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    while (matrix.length % 7 !== 0) matrix.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < matrix.length; i += 7) weeks.push(matrix.slice(i, i + 7));
    const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    return (
        <View>
            <View style={{ flexDirection: 'row' }}>
                {weekDays.map(w => (<View key={w} style={{ flex: 1, alignItems: 'center' }}><ThemedText>{w}</ThemedText></View>))}
            </View>
            {weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: 'row' }}>
                    {week.map((it, di) => (
                        <TouchableOpacity key={di} style={{ flex: 1, padding: 8, alignItems: 'center' }} disabled={!it} onPress={() => it && onSelect(it)}>
                            <ThemedText>{it ? String(it.getDate()) : ''}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 6,
    },
    result: {
        marginTop: 16,
        gap: 8,
    },
    bold: { fontWeight: '600' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
