import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { COLORS, interestLabel, lengthLabel, formatPrice } from '../constants';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function CampDetailScreen({ route }) {
  const { camp } = route.params;
  const interests = (camp.interests ?? []).map(interestLabel).join(', ');
  const ageRange = camp.min_age != null ? `${camp.min_age}–${camp.max_age} years` : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{camp.name}</Text>
      {camp.rating ? <Text style={styles.rating}>★ {camp.rating}</Text> : null}

      {camp.description ? <Text style={styles.desc}>{camp.description}</Text> : null}

      <View style={styles.divider} />

      <Row label="Price" value={formatPrice(camp.price_per_week_cents)} />
      <Row label="Length" value={camp.length_type ? lengthLabel(camp.length_type) : null} />
      <Row label="Ages" value={ageRange} />
      <Row label="Interests" value={interests || null} />
      <Row label="Distance" value={camp.distance_miles != null ? `${camp.distance_miles} miles` : null} />
      <Row label="Address" value={camp.address} />

      {camp.phone ? (
        <Pressable style={styles.action} onPress={() => Linking.openURL(`tel:${camp.phone}`)}>
          <Text style={styles.actionText}>Call {camp.phone}</Text>
        </Pressable>
      ) : null}

      {camp.website ? (
        <Pressable
          style={[styles.action, styles.actionSecondary]}
          onPress={() => Linking.openURL(camp.website)}
        >
          <Text style={[styles.actionText, styles.actionTextSecondary]}>Visit website</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  rating: { fontSize: 15, color: '#b45309', fontWeight: '700', marginTop: 4 },
  desc: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginTop: 12 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 18 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { width: 100, fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  rowValue: { flex: 1, fontSize: 15, color: COLORS.text },
  action: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary, marginTop: 12 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionTextSecondary: { color: COLORS.primary },
});
