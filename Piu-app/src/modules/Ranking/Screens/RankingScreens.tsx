import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getMyProfile, UserProfileResponse } from "../../Profile/services/profileService";

type FilterType = "Geral" | "Mensal" | "Semanal";

type RankEntry = {
  position: number;
  name: string;
  username: string;
  xp: number;
  level: number;
  species: number;
  isCurrentUser?: boolean;
};

const MOCK_TOP: Omit<RankEntry, "isCurrentUser">[] = [
  { position: 1, name: "Ana Lima",       username: "@ana_aves",     xp: 18450, level: 19, species: 142 },
  { position: 2, name: "Carlos Borges",  username: "@cborges",      xp: 14200, level: 15, species: 98  },
  { position: 3, name: "Beatriz Rios",   username: "@brios_birds",  xp: 11700, level: 12, species: 87  },
  { position: 4, name: "Diego Andrade",  username: "@dandrade",     xp: 9300,  level: 10, species: 71  },
  { position: 5, name: "Fernanda Costa", username: "@fecosta",      xp: 7800,  level: 8,  species: 63  },
  { position: 6, name: "Gustavo Silva",  username: "@gsilva",       xp: 6200,  level: 7,  species: 55  },
  { position: 7, name: "Helena Martins", username: "@hmartins",     xp: 4900,  level: 5,  species: 44  },
  { position: 8, name: "Igor Pereira",   username: "@ipereira",     xp: 3400,  level: 4,  species: 32  },
  { position: 9, name: "Juliana Nunes",  username: "@jnunes_obs",   xp: 2100,  level: 3,  species: 21  },
];

const COLORS = {
  bg:       "#F6F9F2",
  primary:  "#1A402E",
  gold:     "#F2C94C",
  silver:   "#C0C0C0",
  bronze:   "#CD7F32",
  white:    "#FFFFFF",
  neutral:  "#757874",
  border:   "#E8E8E8",
  highlight:"#D4F0E3",
  text:     "#1A1A1A",
  muted:    "#9CA3AF",
};

function medalColor(pos: number) {
  if (pos === 1) return COLORS.gold;
  if (pos === 2) return COLORS.silver;
  if (pos === 3) return COLORS.bronze;
  return COLORS.border;
}

function RankRow({ entry }: { entry: RankEntry }) {
  const isTop3 = entry.position <= 3;

  return (
    <View style={[styles.row, entry.isCurrentUser && styles.rowHighlight]}>
      <View style={[styles.medal, { borderColor: medalColor(entry.position) }]}>
        <Text style={[styles.medalText, isTop3 && { color: medalColor(entry.position) }]}>
          {entry.position}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>{entry.name}</Text>
          {entry.isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>VOCÊ</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowUsername}>{entry.username}</Text>
      </View>

      <View style={styles.rowStats}>
        <Text style={styles.rowXp}>{entry.xp.toLocaleString("pt-BR")} XP</Text>
        <Text style={styles.rowSub}>{entry.species} espécies</Text>
      </View>
    </View>
  );
}

export default function RankingScreen() {
  const [filter, setFilter] = useState<FilterType>("Geral");
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMyProfile()
        .then(setProfile)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const buildList = (): RankEntry[] => {
    if (!profile) return MOCK_TOP.map((e) => ({ ...e, isCurrentUser: false }));

    const userEntry: RankEntry = {
      position: 10,
      name: profile.name || "Você",
      username: profile.username ? `@${profile.username}` : "@você",
      xp: profile.xp,
      level: profile.level,
      species: profile.species_count,
      isCurrentUser: true,
    };

    // Insere o usuário na posição correta pelo XP
    const all: RankEntry[] = MOCK_TOP.map((e) => ({ ...e, isCurrentUser: false }));
    const insertIdx = all.findIndex((e) => profile.xp > e.xp);
    if (insertIdx === -1) {
      all.push({ ...userEntry, position: all.length + 1 });
    } else {
      all.splice(insertIdx, 0, userEntry);
      all.forEach((e, i) => { e.position = i + 1; });
    }
    return all;
  };

  const list = buildList();
  const FILTERS: FilterType[] = ["Semanal", "Mensal", "Geral"];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ranking</Text>
        <Text style={styles.headerSub}>Comunidade PIU</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <>
          {/* Pódio top 3 */}
          <View style={styles.podium}>
            {[list[1], list[0], list[2]].map((entry, i) => {
              if (!entry) return null;
              const heights = [80, 108, 64];
              return (
                <View key={entry.position} style={styles.podiumSlot}>
                  <View style={[
                    styles.podiumAvatar,
                    { borderColor: medalColor(entry.position) },
                    entry.isCurrentUser && { backgroundColor: COLORS.highlight },
                  ]}>
                    <Icon name="user" size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{entry.name.split(" ")[0]}</Text>
                  <View style={[styles.podiumBase, { height: heights[i], backgroundColor: medalColor(entry.position) }]}>
                    <Text style={styles.podiumPos}>{entry.position}º</Text>
                    <Text style={styles.podiumXp}>{(entry.xp / 1000).toFixed(1)}k</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Lista completa */}
          <FlatList
            data={list.slice(3)}
            keyExtractor={(item) => String(item.position)}
            renderItem={({ item }) => <RankRow entry={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 20 : 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: Platform.select({ ios: "Georgia-Bold", android: "serif" }),
  },
  headerSub: { fontSize: 13, color: COLORS.neutral, marginTop: 2 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:      { fontSize: 13, fontWeight: "600", color: COLORS.neutral },
  filterTextActive: { color: COLORS.white },

  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  podiumSlot:   { alignItems: "center", flex: 1 },
  podiumAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  podiumName: {
    fontSize: 12, fontWeight: "700", color: COLORS.text,
    marginBottom: 4, textAlign: "center",
  },
  podiumBase: {
    width: "100%", borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    paddingVertical: 6,
  },
  podiumPos: { fontSize: 18, fontWeight: "800", color: COLORS.white },
  podiumXp:  { fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowHighlight: { backgroundColor: COLORS.highlight, borderColor: "#9ED8B8" },

  medal: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  medalText: { fontSize: 14, fontWeight: "800", color: COLORS.neutral },

  rowInfo:     { flex: 1 },
  rowNameLine: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  rowName:     { fontSize: 15, fontWeight: "700", color: COLORS.text, flex: 1 },
  rowUsername: { fontSize: 12, color: COLORS.muted },

  youBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: { fontSize: 9, fontWeight: "800", color: COLORS.white, letterSpacing: 0.5 },

  rowStats: { alignItems: "flex-end" },
  rowXp:    { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  rowSub:   { fontSize: 11, color: COLORS.muted, marginTop: 2 },
});
