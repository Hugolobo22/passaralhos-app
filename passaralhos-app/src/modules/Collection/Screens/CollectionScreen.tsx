import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

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

type Category = 'Passerine' | 'Raptor' | 'Other';
type FilterOption = 'ALL SPECIES' | 'PASSERINES' | 'RAPTORS';

interface Sighting {
  id: string;
  commonName: string;
  scientificName: string;
  date: string;       // ISO string (YYYY-MM-DD)
  timestamp: number;  // for sorting
  location: string;
  category: Category;
}

interface SectionData {
  title: string;
  data: Sighting[];
}

// Storage key
const STORAGE_KEY = '@BirdJournal:sightings';

// Initial mock data (only used if storage is empty)
const INITIAL_SIGHTINGS: Sighting[] = [
  {
    id: '1',
    commonName: 'Azure Kingfisher',
    scientificName: 'Alcedo azurea',
    date: '2023-10-12',
    timestamp: new Date(2023, 9, 12).getTime(),
    location: 'River Creek',
    category: 'Other',
  },
  {
    id: '2',
    commonName: 'Goldcrest',
    scientificName: 'Regulus regulus',
    date: '2023-10-08',
    timestamp: new Date(2023, 9, 8).getTime(),
    location: 'Oak Valley',
    category: 'Passerine',
  },
  {
    id: '3',
    commonName: 'Red Kite',
    scientificName: 'Milvus milvus',
    date: '2023-09-24',
    timestamp: new Date(2023, 8, 24).getTime(),
    location: 'High Peaks',
    category: 'Raptor',
  },
  {
    id: '4',
    commonName: 'European Robin',
    scientificName: 'Erithacus rubecula',
    date: '2023-09-15',
    timestamp: new Date(2023, 8, 15).getTime(),
    location: 'Old Grouse',
    category: 'Passerine',
  },
];

// Helper: format date to "Month Day, Year" for display
const formatDisplayDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper: get section title from ISO date (e.g., "October 2023")
const getSectionTitle = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Group sightings by month/year and sort sections descending
const groupSightingsByMonth = (sightings: Sighting[]): SectionData[] => {
  const groups: Record<string, Sighting[]> = {};
  sightings.forEach(sighting => {
    const title = getSectionTitle(sighting.date);
    if (!groups[title]) groups[title] = [];
    groups[title].push(sighting);
  });
  // Sort sections by newest first (based on first item's timestamp in each group)
  const sections = Object.keys(groups).map(title => ({
    title,
    data: groups[title].sort((a, b) => b.timestamp - a.timestamp),
  }));
  sections.sort((a, b) => b.data[0].timestamp - a.data[0].timestamp);
  return sections;
};

// Filter sightings based on selected filter
const filterSightings = (sightings: Sighting[], filter: FilterOption): Sighting[] => {
  if (filter === 'ALL SPECIES') return sightings;
  if (filter === 'PASSERINES') return sightings.filter(s => s.category === 'Passerine');
  if (filter === 'RAPTORS') return sightings.filter(s => s.category === 'Raptor');
  return sightings;
};

// Props for navigation (allows parent app to control tabs)
interface ColectionScreenProps {
  onNavigateToHome?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToRanking?: () => void;
  onNavigateToProfile?: () => void;
}

export default function ColectionScreen({
  onNavigateToHome,
  onNavigateToMap,
  onNavigateToRanking,
  onNavigateToProfile,
}: ColectionScreenProps) {
  // State
  const [allSightings, setAllSightings] = useState<Sighting[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL SPECIES');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  
  // New sighting form state
  const [newSighting, setNewSighting] = useState({
    commonName: '',
    scientificName: '',
    location: '',
    date: new Date().toISOString().split('T')[0], // today's date as YYYY-MM-DD
    category: 'Other' as Category,
  });

  // Load data from AsyncStorage
  useEffect(() => {
    loadSightings();
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    if (allSightings.length > 0 || INITIAL_SIGHTINGS) {
      saveSightings(allSightings);
    }
  }, [allSightings]);

  const loadSightings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAllSightings(JSON.parse(stored));
      } else {
        setAllSightings(INITIAL_SIGHTINGS);
      }
    } catch (error) {
      console.error('Failed to load sightings', error);
      setAllSightings(INITIAL_SIGHTINGS);
    }
  };

  const saveSightings = async (sightings: Sighting[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sightings));
    } catch (error) {
      console.error('Failed to save sightings', error);
    }
  };

  // Compute distinct species count (unique common names)
  const speciesCount = new Set(allSightings.map(s => s.commonName)).size;

  // Apply filter to get displayed sightings
  const displayedSightings = filterSightings(allSightings, activeFilter);
  const sections = groupSightingsByMonth(displayedSightings);

  // Add new sighting
  const addSighting = () => {
    if (!newSighting.commonName.trim() || !newSighting.scientificName.trim() || !newSighting.location.trim()) {
      Alert.alert('Missing Fields', 'Please fill common name, scientific name and location.');
      return;
    }

    const timestamp = new Date(newSighting.date).getTime();
    const newId = Date.now().toString();
    const sightingToAdd: Sighting = {
      id: newId,
      commonName: newSighting.commonName.trim(),
      scientificName: newSighting.scientificName.trim(),
      date: newSighting.date,
      timestamp: isNaN(timestamp) ? Date.now() : timestamp,
      location: newSighting.location.trim(),
      category: newSighting.category,
    };

    setAllSightings(prev => [...prev, sightingToAdd]);
    // Reset form and close modal
    setNewSighting({
      commonName: '',
      scientificName: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
    });
    setIsAddModalVisible(false);
    Alert.alert('Success', 'Sighting added to your collection!');
  };

  // Delete sighting
  const deleteSighting = (id: string) => {
    Alert.alert(
      'Remove Sighting',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAllSightings(prev => prev.filter(s => s.id !== id));
          },
        },
      ]
    );
  };

  // Play bird sound (simulated)
  const playBirdSound = (commonName: string) => {
    Alert.alert('🔊 Bird Song', `Playing the song of ${commonName}...`);
  };

  // Render each sighting item
  const renderSightingItem = ({ item }: { item: Sighting }) => (
    <TouchableOpacity
      style={styles.sightingCard}
      activeOpacity={0.7}
      onLongPress={() => deleteSighting(item.id)}
      delayLongPress={500}
    >
      <TouchableOpacity
        style={styles.audioIconContainer}
        onPress={() => playBirdSound(item.commonName)}
        activeOpacity={0.7}
      >
        <Text style={styles.audioIcon}>▶</Text>
      </TouchableOpacity>
      <View style={styles.sightingInfo}>
        <Text style={styles.commonName}>{item.commonName}</Text>
        <Text style={styles.scientificName}>{item.scientificName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatDisplayDate(item.date)}</Text>
          <Text style={styles.metaDivider}>|</Text>
          <Text style={styles.metaText}>{item.location}</Text>
          <Text style={[styles.categoryBadge, getCategoryStyle(item.category)]}>
            {item.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getCategoryStyle = (category: Category) => {
    if (category === 'Passerine') return { backgroundColor: '#D4F0E3', color: '#065F46' };
    if (category === 'Raptor') return { backgroundColor: '#F2D1D1', color: '#9B2C2C' };
    return { backgroundColor: '#E5E7EB', color: '#4B5563' };
  };

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  // Bottom tab helpers
  const handleRecordPress = () => {
    if (onNavigateToHome) onNavigateToHome();
    else Alert.alert('Navigate', 'Go to Record screen');
  };
  const handleMapPress = () => {
    if (onNavigateToMap) onNavigateToMap();
    else Alert.alert('Navigate', 'Go to Map screen');
  };
  const handleRankingPress = () => {
    if (onNavigateToRanking) onNavigateToRanking();
    else Alert.alert('Navigate', 'Go to Ranking screen');
  };
  const handleProfilePress = () => {
    if (onNavigateToProfile) onNavigateToProfile();
    else Alert.alert('Navigate', 'Go to Profile screen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Personal Archive</Text>
          <Text style={styles.speciesCount}>{speciesCount} Species Found</Text>
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

        {/* SectionList */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderSightingItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sightings found.</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first observation!</Text>
            </View>
          }
        />

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
          <Icon name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomBar}>
          <TabItem icon="mic" label="Gravar" onPress={handleRecordPress} />
          <TabItem icon="grid" label="Coleção" active />
          <TabItem icon="map" label="Mapa" onPress={handleMapPress} />
          <TabItem icon="award" label="Ranking" onPress={handleRankingPress} />
          <TabItem icon="user" label="Perfil" onPress={handleProfilePress} />
        </View>
      </View>

      {/* Modal: Add New Sighting */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Sighting</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Common Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.commonName}
                onChangeText={(text) => setNewSighting(prev => ({ ...prev, commonName: text }))}
                placeholder="e.g., Azure Kingfisher"
              />

              <Text style={styles.inputLabel}>Scientific Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.scientificName}
                onChangeText={(text) => setNewSighting(prev => ({ ...prev, scientificName: text }))}
                placeholder="e.g., Alcedo azurea"
              />

              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.location}
                onChangeText={(text) => setNewSighting(prev => ({ ...prev, location: text }))}
                placeholder="e.g., River Creek"
              />

              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>{formatDisplayDate(newSighting.date)}</Text>
                <Icon name="calendar" size={18} color={COLORS.primary} />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelector}>
                {(['Passerine', 'Raptor', 'Other'] as Category[]).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, newSighting.category === cat && styles.categoryChipActive]}
                    onPress={() => setNewSighting(prev => ({ ...prev, category: cat }))}
                  >
                    <Text style={[styles.categoryChipText, newSighting.category === cat && { color: '#FFF' }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAddModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={addSighting}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker */}
      {isDatePickerVisible && (
        <DateTimePicker
          value={new Date(newSighting.date)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setIsDatePickerVisible(false);
            if (selectedDate) {
              const formatted = selectedDate.toISOString().split('T')[0];
              setNewSighting(prev => ({ ...prev, date: formatted }));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

// Tab item component
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 34,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  speciesCount: {
    fontSize: 16,
    color: COLORS.neutral,
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.neutral,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 90,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  sightingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioIcon: {
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 2,
  },
  sightingInfo: {
    flex: 1,
  },
  commonName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.tertiary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: COLORS.neutral,
  },
  metaDivider: {
    marginHorizontal: 6,
    color: COLORS.neutral,
    fontSize: 13,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: Platform.select({ ios: 20, android: 12 }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 3,
  },
  tabActive: {
    backgroundColor: '#D4F0E3',
  },
  tabLabel: {
    fontSize: 10,
    color: '#B0ACA8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#065F46',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '85%',
    maxHeight: '80%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontWeight: '500',
    color: '#4B5563',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.neutral,
    marginTop: 8,
  },
});