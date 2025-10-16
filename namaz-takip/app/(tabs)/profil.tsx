import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getToken } from '../utils/auth';

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
    const router = useRouter();
    const [mukellefSince, setMukellefSince] = useState('');
    const [startedPrayerAt, setStartedPrayerAt] = useState('');
    const [showPickerFor, setShowPickerFor] = useState<null | 'mukellef' | 'started'>(null);
    const [pickerViewDate, setPickerViewDate] = useState(() => new Date());
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // kaza modal state and counters
    const [showKazaModal, setShowKazaModal] = useState(false);
    const [kazaCounts, setKazaCounts] = useState({ sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 });
    const [kazaNote, setKazaNote] = useState('');
    // accumulated kaza totals (in-memory for now)
    const [kazaTotals, setKazaTotals] = useState({ sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 });

    function formatDateYMD(d: Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    }

    const startDate = useMemo(() => parseYMD(mukellefSince), [mukellefSince]);
    const startedDate = useMemo(() => parseYMD(startedPrayerAt), [startedPrayerAt]);

    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            const token = await getToken();
            setIsLoggedIn(!!token);
            if (!token) return;
            try {
                const res = await fetch('http://localhost:4000/api/profile', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                if (data && data.profile) {
                    if (data.profile.mukellefSince) setMukellefSince(data.profile.mukellefSince);
                    if (data.profile.startedPrayerAt) setStartedPrayerAt(data.profile.startedPrayerAt);
                    if (data.profile.kazaTotals) setKazaTotals(data.profile.kazaTotals);
                }
            } catch (e) {
                // ignore
            }
        }
        loadProfile();
        return () => { mounted = false; };
    }, []);

    let daysDiff: number | null = null;
    if (startDate && startedDate) {
        const ms = Math.abs(startDate.getTime() - startedDate.getTime());
        daysDiff = Math.floor(ms / (1000 * 60 * 60 * 24));
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Profil</ThemedText>

            <View style={styles.rowButtons}>
                {!isLoggedIn ? (
                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.btnPrimary}>
                        <ThemedText style={styles.btnPrimaryText}>Giriş Yap</ThemedText>
                    </TouchableOpacity>
                ) : null}
            </View>

            <ThemedText style={styles.label}>Bu mükellef olduğun gün</ThemedText>
            <TouchableOpacity onPress={() => { setPickerViewDate(mukellefSince ? new Date(mukellefSince) : new Date()); setShowPickerFor('mukellef'); }} style={styles.inputWrap}>
                <ThemedText style={styles.inputText}>{mukellefSince || 'YYYY-MM-DD'}</ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.label}>Namaza başladığın gün</ThemedText>
            <TouchableOpacity onPress={() => { setPickerViewDate(startedPrayerAt ? new Date(startedPrayerAt) : new Date()); setShowPickerFor('started'); }} style={styles.inputWrap}>
                <ThemedText style={styles.inputText}>{startedPrayerAt || 'YYYY-MM-DD'}</ThemedText>
            </TouchableOpacity>

            <Modal visible={!!showPickerFor} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => { setShowYearPicker(false); setPickerViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }}><ThemedText>{'<'}</ThemedText></TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowYearPicker(s => !s)}>
                                <ThemedText type="title">{pickerViewDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setShowYearPicker(false); setPickerViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }}><ThemedText>{'>'}</ThemedText></TouchableOpacity>
                        </View>
                        {showYearPicker ? (
                            <View style={{ maxHeight: 240 }}>
                                <ScrollView>
                                    {(() => {
                                        const years: number[] = [];
                                        const current = new Date().getFullYear();
                                        for (let y = 1900; y <= current; y++) years.push(y);
                                        return years.reverse().map(y => (
                                            <TouchableOpacity key={y} onPress={() => { setPickerViewDate(d => new Date(y, d.getMonth(), 1)); setShowYearPicker(false); }} style={{ padding: 8 }}>
                                                <ThemedText>{String(y)}</ThemedText>
                                            </TouchableOpacity>
                                        ));
                                    })()}
                                </ScrollView>
                            </View>
                        ) : (
                            <CalendarGrid
                                viewDate={pickerViewDate}
                                onSelect={(d: Date) => {
                                    const formatted = formatDateYMD(d);
                                    if (showPickerFor === 'mukellef') setMukellefSince(formatted);
                                    if (showPickerFor === 'started') setStartedPrayerAt(formatted);
                                    setShowPickerFor(null);
                                }}
                            />
                        )}
                        <TouchableOpacity onPress={() => setShowPickerFor(null)} style={{ marginTop: 12 }}><ThemedText>İptal</ThemedText></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity onPress={async () => {
                // save to backend if token
                const token = await getToken();
                if (token) {
                    try {
                        await fetch('http://localhost:4000/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ mukellefSince, startedPrayerAt }) });
                    } catch (e) { /* ignore */ }
                }
            }} style={styles.saveBtn}>
                <ThemedText style={styles.saveBtnText}>Kaydet</ThemedText>
            </TouchableOpacity>

            <View style={styles.result}>
                {daysDiff === null ? (
                    <ThemedText>İki geçerli tarih girin.</ThemedText>
                ) : (
                    <>
                        <ThemedText>{`${daysDiff} gün (toplam)`}</ThemedText>
                        {/* compute owed per vakit: daysDiff minus kazaTotals for each */}
                        {(() => {
                            const owed = {
                                sabah: Math.max(0, daysDiff - kazaTotals.sabah),
                                ogle: Math.max(0, daysDiff - kazaTotals.ogle),
                                ikindi: Math.max(0, daysDiff - kazaTotals.ikindi),
                                aksam: Math.max(0, daysDiff - kazaTotals.aksam),
                                yatsi: Math.max(0, daysDiff - kazaTotals.yatsi),
                            };
                            return (
                                <>
                                    <ThemedText style={styles.bold}>{`Sabah: ${owed.sabah} adet`}</ThemedText>
                                    <ThemedText style={styles.bold}>{`Öğle: ${owed.ogle} adet`}</ThemedText>
                                    <ThemedText style={styles.bold}>{`İkindi: ${owed.ikindi} adet`}</ThemedText>
                                    <ThemedText style={styles.bold}>{`Akşam: ${owed.aksam} adet`}</ThemedText>
                                    <ThemedText style={styles.bold}>{`Yatsı: ${owed.yatsi} adet`}</ThemedText>
                                </>
                            );
                        })()}
                    </>
                )}
            </View>

            {/* Persistent bottom button */}
            <TouchableOpacity style={styles.kazaButton} onPress={() => setShowKazaModal(true)}>
                <ThemedText style={styles.kazaButtonText}>kaza namazı kıldım</ThemedText>
            </TouchableOpacity>

            {/* Kaza modal */}
            <Modal visible={showKazaModal} transparent animationType="fade" onRequestClose={() => setShowKazaModal(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.kazaModalContent}>
                        <ThemedText type="title" style={styles.kazaTitle}>Kaza Namazı Bildir</ThemedText>

                        {[{ key: 'sabah', label: 'Sabah' }, { key: 'ogle', label: 'Öğle' }, { key: 'ikindi', label: 'İkindi' }, { key: 'aksam', label: 'Akşam' }, { key: 'yatsi', label: 'Yatsı' }].map(it => (
                            <View key={it.key} style={styles.kazaRow}>
                                <ThemedText style={styles.kazaLabel}>{it.label}</ThemedText>
                                <View style={styles.kazaControls}>
                                    <TouchableOpacity style={styles.kazaBtn} onPress={() => setKazaCounts(s => ({ ...s, [it.key]: Math.max(0, (s as any)[it.key] - 1) }))}>
                                        <ThemedText style={styles.kazaBtnText}>−</ThemedText>
                                    </TouchableOpacity>
                                    <ThemedText style={styles.kazaCount}>{(kazaCounts as any)[it.key]}</ThemedText>
                                    <TouchableOpacity style={styles.kazaBtn} onPress={() => setKazaCounts(s => ({ ...s, [it.key]: (s as any)[it.key] + 1 }))}>
                                        <ThemedText style={styles.kazaBtnText}>+</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <ThemedText style={{ marginTop: 8 }}>Dua / Not (opsiyonel)</ThemedText>
                        <TextInput value={kazaNote} onChangeText={setKazaNote} placeholder="Kısa not veya niyet" style={styles.kazaNoteInput} multiline />

                        <View style={styles.kazaActions}>
                            <TouchableOpacity style={styles.kazaCancel} onPress={() => setShowKazaModal(false)}>
                                <ThemedText style={styles.kazaCancelText}>İptal</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.kazaConfirmBtn} onPress={async () => {
                                // try to POST to backend
                                const token = await getToken();
                                if (token) {
                                    try {
                                        const res = await fetch('http://localhost:4000/api/kaza', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(kazaCounts) });
                                        if (res.ok) {
                                            const data = await res.json();
                                            if (data && data.kazaTotals) {
                                                setKazaTotals(data.kazaTotals);
                                            }
                                        } else {
                                            // fallback to in-memory apply
                                            setKazaTotals(prev => ({
                                                sabah: prev.sabah + kazaCounts.sabah,
                                                ogle: prev.ogle + kazaCounts.ogle,
                                                ikindi: prev.ikindi + kazaCounts.ikindi,
                                                aksam: prev.aksam + kazaCounts.aksam,
                                                yatsi: prev.yatsi + kazaCounts.yatsi,
                                            }));
                                        }
                                    } catch (e) {
                                        // network error -> apply in-memory
                                        setKazaTotals(prev => ({
                                            sabah: prev.sabah + kazaCounts.sabah,
                                            ogle: prev.ogle + kazaCounts.ogle,
                                            ikindi: prev.ikindi + kazaCounts.ikindi,
                                            aksam: prev.aksam + kazaCounts.aksam,
                                            yatsi: prev.yatsi + kazaCounts.yatsi,
                                        }));
                                    }
                                } else {
                                    // no token -> local apply
                                    setKazaTotals(prev => ({
                                        sabah: prev.sabah + kazaCounts.sabah,
                                        ogle: prev.ogle + kazaCounts.ogle,
                                        ikindi: prev.ikindi + kazaCounts.ikindi,
                                        aksam: prev.aksam + kazaCounts.aksam,
                                        yatsi: prev.yatsi + kazaCounts.yatsi,
                                    }));
                                }
                                // finalize UI
                                setShowKazaModal(false);
                                setKazaCounts({ sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 });
                                setKazaNote('');
                            }}>
                                <ThemedText style={styles.kazaConfirmText}>Onayla</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    rowButtons: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    btnPrimary: { padding: 10, backgroundColor: '#007AFF', borderRadius: 6 },
    btnPrimaryText: { color: '#fff' },
    btnSecondary: { padding: 10, backgroundColor: '#34C759', borderRadius: 6 },
    btnSecondaryText: { color: '#fff' },
    label: { marginTop: 8, marginBottom: 4, color: '#333' },
    inputWrap: { borderWidth: 1, borderColor: '#e0e0e0', padding: 12, borderRadius: 8, backgroundColor: '#fafafa' },
    inputText: { color: '#111' },
    saveBtn: { marginTop: 12, padding: 12, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '600' },
    kazaButton: { position: 'absolute', left: 16, right: 16, bottom: 24, padding: 12, backgroundColor: '#444', borderRadius: 8, alignItems: 'center' },
    kazaButtonText: { color: '#fff', textTransform: 'lowercase' },
    kazaModalContent: { width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 10, padding: 16 },
    kazaTitle: { textAlign: 'center', fontWeight: '600', marginBottom: 12 },
    kazaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
    kazaLabel: { fontSize: 16, flex: 1 },
    kazaControls: { flexDirection: 'row', alignItems: 'center' },
    kazaBtn: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
    kazaBtnText: { fontSize: 20, lineHeight: 20, fontWeight: '600' },
    kazaCount: { minWidth: 28, textAlign: 'center', fontSize: 16 },
    kazaNoteInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, marginTop: 8, minHeight: 40 },
    kazaActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    kazaCancel: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 8 },
    kazaCancelText: { color: '#555' },
    kazaConfirmBtn: { backgroundColor: '#2a9d8f', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6 },
    kazaConfirmText: { color: '#fff', fontWeight: '600' },
});
