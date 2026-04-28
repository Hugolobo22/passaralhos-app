import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#FFFFFF',
  primary: '#1A402E',
  secondary: '#F2C94C',
  tertiary: '#6A323B',
  neutral: '#757874',
  lightBg: '#F8F8F8',
  border: '#E8E8E8',
};

type Sighting = {
  id: string;
  commonName: string;
  scientificName: string;
  date: string;
  location: string;
};

type SectionData = {
  title: string;
  data: Sighting[];
};

const SIGHTINGS_DATA: SectionData[] = [
  {
    title: 'October 2023',
    data: [
      { id: '1', commonName: 'Azure Kingfisher', scientificName: 'Alcedo azurea', date: 'Oct 12, 2023', location: 'River Creek' },
      { id: '2', commonName: 'Goldcrest', scientificName: 'Regulus regulus', date: 'Oct 08, 2023', location: 'Oak Valley' },
    ],
  },
  {
    title: 'September 2023',
    data: [
      { id: '3', commonName: 'Red Kite', scientificName: 'Milvus milvus', date: 'Sep 24, 2023', location: 'High Peaks' },
      { id: '4', commonName: 'European Robin', scientificName: 'Erithacus rubecula', date: 'Sep 15, 2023', location: 'Old Grouse' },
    ],
  },
];

type FilterOption = 'ALL SPECIES' | 'PASSERINES' | 'RAPTORS';

// ⚠️ Interface da prop de navegação
interface ColectionScreenProps {
  onNavigateToHome: () => void;
}

export default function ColectionScreen({ onNavigateToHome }: ColectionScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL SPECIES');

  const renderSightingItem = ({ item }: { item: Sighting }) => (
    <TouchableOpacity style={styles.sightingCard} activeOpacity={0.7}>
      <View style={styles.audioIconContainer}>
        <Text style={styles.audioIcon}>▶</Text>
      </View>
      <View style={styles.sightingInfo}>
        <Text style={styles.commonName}>{item.commonName}</Text>
        <Text style={styles.scientificName}>{item.scientificName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.date}</Text>
          <Text style={styles.metaDivider}>|</Text>
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Personal Archive</Text>
        <Text style={styles.speciesCount}>24 Species Found</Text>
        <View style={styles.filtersContainer}>
          {(['ALL SPECIES', 'PASSERINES', 'RAPTORS'] as FilterOption[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={SIGHTINGS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderSightingItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomBar}>
        {/* "Gravar" volta para Home */}
        <TabItem icon="mic" label="Gravar" onPress={onNavigateToHome} />
        <TabItem icon="grid" label="Coleção" active />
        <TabItem icon="map" label="Mapa" />
        <TabItem icon="award" label="Ranking" />
        <TabItem icon="user" label="Perfil" />
      </View>
    </View>
  );
}

function TabItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabItem, active && styles.tabActive]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Icon name={icon} size={19} color={active ? '#065F46' : '#B0ACA8'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 34, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '700', color: COLORS.primary, marginBottom: 6,
  },
  speciesCount: { fontSize: 16, color: COLORS.neutral, marginBottom: 20 },
  filtersContainer: { flexDirection: 'row', gap: 10 },
  filterButton: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: COLORS.lightBg, borderWidth: 1, borderColor: COLORS.border,
  },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.neutral },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionHeader: { marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary, letterSpacing: 0.5 },
  sightingCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightBg,
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  audioIconContainer: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  audioIcon: { fontSize: 18, color: COLORS.primary, marginLeft: 2 },
  sightingInfo: { flex: 1 },
  commonName: {
    fontSize: 17, fontWeight: '700', color: COLORS.primary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 4,
  },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: COLORS.tertiary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: COLORS.neutral },
  metaDivider: { marginHorizontal: 6, color: COLORS.neutral, fontSize: 13 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row',
    justifyContent: 'space-around', paddingVertical: 12,
    paddingBottom: Platform.select({ ios: 20, android: 12 }),
  },
  tabItem: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 14, gap: 3,
  },
  tabActive: { backgroundColor: '#D4F0E3' },
  tabLabel: { fontSize: 10, color: '#B0ACA8', fontWeight: '500', letterSpacing: 0.3 },
  tabLabelActive: { color: '#065F46' },
});