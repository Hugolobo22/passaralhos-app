import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";

import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { BottomTabsParamList } from "../../../navigation/BottomTabsNavigator";

const { width } = Dimensions.get("window");

type Props = BottomTabScreenProps<BottomTabsParamList, "Collection">;

const COLORS = {
  background: "#FFFFFF",
  primary: "#1A402E",
  secondary: "#F2C94C",
  tertiary: "#6A323B",
  neutral: "#757874",
  lightBg: "#F8F8F8",
  border: "#E8E8E8",
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
    title: "October 2023",
    data: [
      {
        id: "1",
        commonName: "Azure Kingfisher",
        scientificName: "Alcedo azurea",
        date: "Oct 12, 2023",
        location: "River Creek",
      },
      {
        id: "2",
        commonName: "Goldcrest",
        scientificName: "Regulus regulus",
        date: "Oct 08, 2023",
        location: "Oak Valley",
      },
    ],
  },
  {
    title: "September 2023",
    data: [
      {
        id: "3",
        commonName: "Red Kite",
        scientificName: "Milvus milvus",
        date: "Sep 24, 2023",
        location: "High Peaks",
      },
      {
        id: "4",
        commonName: "European Robin",
        scientificName: "Erithacus rubecula",
        date: "Sep 15, 2023",
        location: "Old Grouse",
      },
    ],
  },
];

type FilterOption = "ALL SPECIES" | "PASSERINES" | "RAPTORS";

export default function ColectionScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("ALL SPECIES");

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
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Personal Archive</Text>
        <Text style={styles.speciesCount}>24 Species Found</Text>

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
                  {filter}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      {/* LISTA */}
      <SectionList
        sections={SIGHTINGS_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderSightingItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {/* BOTÃO VOLTAR PRA HOME (opcional) */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Icon name="arrow-left" size={18} color="#FFF" />
        <Text style={styles.floatingText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
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
    paddingBottom: 120,
  },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
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

  audioIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },

  sightingInfo: {
    flex: 1,
  },

  commonName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.primary,
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
  },

  metaText: {
    fontSize: 13,
    color: COLORS.neutral,
  },

  metaDivider: {
    marginHorizontal: 6,
    color: COLORS.neutral,
  },

  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },

  floatingText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
