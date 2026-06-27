import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS, interestLabel, lengthLabel, formatPrice } from '../constants';

function CampCard({ camp, onPress }) {
  const matched = camp.matched_interests ?? [];
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{camp.name}</Text>
        {camp.rating ? <Text style={styles.rating}>★ {camp.rating}</Text> : null}
      </View>

      <Text style={styles.cardMeta}>
        {camp.distance_miles != null ? `${camp.distance_miles} mi` : ''} ·{' '}
        {formatPrice(camp.price_per_week_cents)}
        {camp.length_type ? ` · ${lengthLabel(camp.length_type)}` : ''}
        {camp.min_age != null ? ` · ages ${camp.min_age}-${camp.max_age}` : ''}
      </Text>

      {matched.length ? (
        <View style={styles.badgeRow}>
          {matched.map((i) => (
            <View key={i} style={styles.badge}>
              <Text style={styles.badgeText}>{interestLabel(i)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ResultsScreen({ route, navigation }) {
  const { criteria } = route.params;
  const [state, setState] = useState({ loading: true, error: null, camps: [] });
  const [widened, setWidened] = useState(false);

  const runSearch = useCallback(
    async (radius) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      const { data, error } = await supabase.rpc('search_camps', {
        ...criteria,
        p_radius_miles: radius,
      });
      if (error) {
        setState({ loading: false, error: error.message, camps: [] });
      } else {
        setState({ loading: false, error: null, camps: data ?? [] });
      }
    },
    [criteria]
  );

  useEffect(() => {
    runSearch(75);
  }, [runSearch]);

  const onWiden = () => {
    setWidened(true);
    runSearch(150);
  };

  if (state.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.centerText}>Searching camps…</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.centerText}>{state.error}</Text>
        <Pressable style={styles.retry} onPress={() => runSearch(75)}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!state.camps.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No matching camps</Text>
        <Text style={styles.centerText}>
          {widened
            ? 'Still nothing within 150 miles. Try removing a filter or a different zip.'
            : 'No camps matched within 75 miles. Want to widen the search?'}
        </Text>
        {!widened ? (
          <Pressable style={styles.retry} onPress={onWiden}>
            <Text style={styles.retryText}>Search 150 miles</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={state.camps}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <Text style={styles.count}>
          {state.camps.length} camp{state.camps.length === 1 ? '' : 's'} found
          {widened ? ' (within 150 mi)' : ''}
        </Text>
      }
      renderItem={({ item }) => (
        <CampCard camp={item} onPress={() => navigation.navigate('CampDetail', { camp: item })} />
      )}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.bg },
  count: { fontSize: 14, color: COLORS.muted, marginBottom: 10, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, paddingRight: 8 },
  rating: { fontSize: 14, color: '#b45309', fontWeight: '700' },
  cardMeta: { fontSize: 14, color: COLORS.muted, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { backgroundColor: COLORS.chipBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centerText: { fontSize: 15, color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  retry: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
});
