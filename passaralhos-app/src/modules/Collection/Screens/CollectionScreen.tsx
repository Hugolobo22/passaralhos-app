import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

import {
  getMyBirdRecords,
  createBirdRecord,
  type BirdRecord,
} from "../services/collectionService";

const { width } = Dimensions.get("window");

const COLORS = {
  background: "#FFFFFF",
  primary: "#1A402E",
  secondary: "#F2C94C",
  tertiary: "#6A323B",
  neutral: "#757874",
  lightBg: "#F8F8F8",
  border: "#E8E8E8",
};

type Category = "Passerine" | "Raptor" | "Other";
type FilterOption = "ALL SPECIES" | "PASSERINES" | "RAPTORS";

interface Sighting {
  id: string;
  commonName: string;
  scientificName: string;
  date: string;
  timestamp: number;
  location: string;
  category: Category;
  confidence?: number;
}

interface SectionData {
  title: string;
  data: Sighting[];
}

const inferCategory = (commonName: string, scientificName: string): Category => {
  const text = `${commonName} ${scientificName}`.toLowerCase();

  if (
    text.includes("gavião") ||
    text.includes("hawk") ||
    text.includes("eagle") ||
    text.includes("kite") ||
    text.includes("falcon") ||
    text.includes("raptor")
  ) {
    return "Raptor";
  }

  if (
    text.includes("sabiá") ||
    text.includes("robin") ||
    text.includes("goldcrest") ||
    text.includes("tangará") ||
    text.includes("passerine")
  ) {
    return "Passerine";
  }

  return "Other";
};

const formatDisplayDate = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Data desconhecida";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getSectionTitle = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

const mapRecordToSighting = (record: BirdRecord): Sighting => {
  const createdAt = record.created_at || new Date().toISOString();
  const timestamp = new Date(createdAt).getTime();

  return {
    id: record.id,
    commonName: record.common_name,
    scientificName: record.scientific_name,
    date: createdAt,
    timestamp: Number.isNaN(timestamp) ? Date.now() : timestamp,
    location: record.location || "Localização não informada",
    category: inferCategory(record.common_name, record.scientific_name),
    confidence: record.confidence,
  };
};

const groupSightingsByMonth = (sightings: Sighting[]): SectionData[] => {
  const groups: Record<string, Sighting[]> = {};

  sightings.forEach((sighting) => {
    const title = getSectionTitle(sighting.date);

    if (!groups[title]) {
      groups[title] = [];
    }

    groups[title].push(sighting);
  });

  const sections = Object.keys(groups).map((title) => ({
    title,
    data: groups[title].sort((a, b) => b.timestamp - a.timestamp),
  }));

  sections.sort((a, b) => b.data[0].timestamp - a.data[0].timestamp);

  return sections;
};

const filterSightings = (
  sightings: Sighting[],
  filter: FilterOption,
): Sighting[] => {
  if (filter === "ALL SPECIES") return sightings;
  if (filter === "PASSERINES") {
    return sightings.filter((s) => s.category === "Passerine");
  }
  if (filter === "RAPTORS") {
    return sightings.filter((s) => s.category === "Raptor");
  }

  return sightings;
};

export default function CollectionScreen() {
  const [allSightings, setAllSightings] = useState<Sighting[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<FilterOption>("ALL SPECIES");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [newSighting, setNewSighting] = useState({
    commonName: "",
    scientificName: "",
    location: "",
    confidence: "90",
  });

  async function loadRecords() {
    try {
      setLoading(true);

      const response = await getMyBirdRecords();

      const mapped = response.records.map(mapRecordToSighting);

      setAllSightings(mapped);
    } catch (error) {
      console.log("[COLLECTION_LOAD_ERROR]", error);
      Alert.alert("Erro", "Não foi possível carregar sua coleção.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const speciesCount = useMemo(() => {
    return new Set(allSightings.map((s) => s.scientificName.toLowerCase()))
      .size;
  }, [allSightings]);

  const displayedSightings = useMemo(() => {
    return filterSightings(allSightings, activeFilter);
  }, [allSightings, activeFilter]);

  const sections = useMemo(() => {
    return groupSightingsByMonth(displayedSightings);
  }, [displayedSightings]);

  const resetForm = () => {
    setNewSighting({
      commonName: "",
      scientificName: "",
      location: "",
      confidence: "90",
    });
  };

  const addSighting = async () => {
    if (
      !newSighting.commonName.trim() ||
      !newSighting.scientificName.trim() ||
      !newSighting.location.trim()
    ) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha nome popular, nome científico e localização.",
      );
      return;
    }

    try {
      setSaving(true);

      await createBirdRecord({
        common_name: newSighting.commonName.trim(),
        scientific_name: newSighting.scientificName.trim(),
        location: newSighting.location.trim(),
        confidence: Number(newSighting.confidence) || 0,
        audio_url: null,
      });

      resetForm();
      setIsAddModalVisible(false);

      await loadRecords();

      Alert.alert("Sucesso", "Registro adicionado à sua coleção.");
    } catch (error) {
      console.log("[COLLECTION_CREATE_ERROR]", error);
      Alert.alert("Erro", "Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
  };

  const playBirdSound = (commonName: string) => {
    Alert.alert("Canto da ave", `Reproduzindo o canto de ${commonName}...`);
  };

  const getCategoryStyle = (category: Category) => {
    if (category === "Passerine") {
      return {
        backgroundColor: "#D4F0E3",
        color: "#065F46",
      };
    }

    if (category === "Raptor") {
      return {
        backgroundColor: "#F2D1D1",
        color: "#9B2C2C",
      };
    }

    return {
      backgroundColor: "#E5E7EB",
      color: "#4B5563",
    };
  };

  const renderSightingItem = ({ item }: { item: Sighting }) => (
    <TouchableOpacity style={styles.sightingCard} activeOpacity={0.7}>
      <TouchableOpacity
        style={styles.audioIconContainer}
        onPress={() => playBirdSound(item.commonName)}
        activeOpacity={0.7}
      >
        <Icon name="play" size={18} color={COLORS.primary} />
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

        {typeof item.confidence === "number" && (
          <Text style={styles.confidenceText}>
            Confiança: {Math.round(item.confidence)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Carregando coleção...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Coleção</Text>
          <Text style={styles.speciesCount}>
            {speciesCount} espécie{speciesCount === 1 ? "" : "s"} registrada
            {speciesCount === 1 ? "" : "s"}
          </Text>

          <View style={styles.filtersContainer}>
            {(["ALL SPECIES", "PASSERINES", "RAPTORS"] as FilterOption[]).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    activeFilter === filter && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.filterTextActive,
                    ]}
                  >
                    {filter === "ALL SPECIES"
                      ? "TODAS"
                      : filter === "PASSERINES"
                        ? "PASSERIFORMES"
                        : "RAPINAS"}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

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
              <Icon name="feather" size={40} color={COLORS.neutral} />
              <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
              <Text style={styles.emptySubtext}>
                Toque em + para adicionar sua primeira observação.
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Icon name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Registro</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nome popular *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.commonName}
                onChangeText={(text) =>
                  setNewSighting((prev) => ({
                    ...prev,
                    commonName: text,
                  }))
                }
                placeholder="Ex: Bem-te-vi"
              />

              <Text style={styles.inputLabel}>Nome científico *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.scientificName}
                onChangeText={(text) =>
                  setNewSighting((prev) => ({
                    ...prev,
                    scientificName: text,
                  }))
                }
                placeholder="Ex: Pitangus sulphuratus"
              />

              <Text style={styles.inputLabel}>Localização *</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.location}
                onChangeText={(text) =>
                  setNewSighting((prev) => ({
                    ...prev,
                    location: text,
                  }))
                }
                placeholder="Ex: Natal, RN"
              />

              <Text style={styles.inputLabel}>Confiança da identificação</Text>
              <TextInput
                style={styles.textInput}
                value={newSighting.confidence}
                onChangeText={(text) =>
                  setNewSighting((prev) => ({
                    ...prev,
                    confidence: text.replace(/[^0-9.]/g, ""),
                  }))
                }
                keyboardType="numeric"
                placeholder="Ex: 94"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsAddModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addSighting}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: COLORS.neutral,
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    paddingTop: Platform.OS === "android" ? 20 : 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 34,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
  },
  speciesCount: {
    fontSize: 16,
    color: COLORS.neutral,
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: "row",
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
    fontWeight: "600",
    color: COLORS.neutral,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: "capitalize",
  },
  sightingCard: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sightingInfo: {
    flex: 1,
  },
  commonName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.tertiary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 8,
  },
  confidenceText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.neutral,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    width: "85%",
    maxHeight: "80%",
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
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
    backgroundColor: "#F9FAFB",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.neutral,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.neutral,
    marginTop: 8,
    textAlign: "center",
  },
});