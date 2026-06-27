import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { INTERESTS, LENGTH_TYPES, COLORS } from '../constants';

// Reusable multi-select chip row.
function ChipGroup({ options, selected, onToggle }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt.slug);
        return (
          <Pressable
            key={opt.slug}
            onPress={() => onToggle(opt.slug)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({ label, children, hint }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export default function SearchScreen({ navigation }) {
  const [numChildren, setNumChildren] = useState('1');
  const [childAge, setChildAge] = useState('');
  const [interests, setInterests] = useState([]);
  const [zip, setZip] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [lengths, setLengths] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const toggle = (list, setList) => (slug) =>
    setList(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);

  const onSearch = () => {
    if (!/^\d{5}$/.test(zip.trim())) {
      setError('Please enter a 5-digit zip code.');
      return;
    }
    setError('');
    navigation.navigate('Results', {
      criteria: {
        p_zip: zip.trim(),
        p_child_age: childAge ? parseInt(childAge, 10) : null,
        p_interests: interests.length ? interests : null,
        p_min_price_cents: minPrice ? Math.round(parseFloat(minPrice) * 100) : null,
        p_max_price_cents: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : null,
        p_length_types: lengths.length ? lengths : null,
        p_start_date: startDate.trim() || null,
        p_end_date: endDate.trim() || null,
      },
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Find a summer camp</Text>
      <Text style={styles.subtitle}>Camps within 75 miles, ranked for your child.</Text>

      <Field label="Number of children">
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={numChildren}
          onChangeText={setNumChildren}
        />
      </Field>

      <Field label="Child's age">
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="e.g. 8"
          value={childAge}
          onChangeText={setChildAge}
        />
      </Field>

      <Field label="Interests">
        <ChipGroup options={INTERESTS} selected={interests} onToggle={toggle(interests, setInterests)} />
      </Field>

      <Field label="Zip code" hint="Used to search a 75-mile radius.">
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="98101"
          maxLength={5}
          value={zip}
          onChangeText={setZip}
        />
      </Field>

      <Field label="Weekly price range ($)">
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            keyboardType="number-pad"
            placeholder="Min"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <TextInput
            style={[styles.input, styles.half]}
            keyboardType="number-pad"
            placeholder="Max"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
      </Field>

      <Field label="Length of camp">
        <ChipGroup options={LENGTH_TYPES} selected={lengths} onToggle={toggle(lengths, setLengths)} />
      </Field>

      <Field label="Dates" hint="Format: YYYY-MM-DD (optional).">
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Start 2026-06-22"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="End 2026-06-26"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
      </Field>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={onSearch}>
        <Text style={styles.buttonText}>Search camps</Text>
      </Pressable>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.muted, marginTop: 4, marginBottom: 16 },
  field: { marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  hint: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: COLORS.chipActiveBg, borderColor: COLORS.chipActiveBg },
  chipText: { color: COLORS.primaryDark, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  error: { color: '#dc2626', marginBottom: 12, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
