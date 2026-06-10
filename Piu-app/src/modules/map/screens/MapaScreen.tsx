import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import type { BottomTabsParamList } from "../../../navigation/BottomTabsNavigator";
import { getMyBirdRecords, BirdRecord } from "../../Collection/services/collectionService";

type Props = BottomTabScreenProps<BottomTabsParamList, "Map">;

const COLORS = {
  background: "#F6F9F2",
  primary: "#1A402E",
  secondary: "#F2C94C",
  tertiary: "#6A323B",
  neutral: "#757874",
  white: "#FFFFFF",
  border: "#E8E8E8",
};

export default function MapaScreen({ navigation }: Props) {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recentRecords, setRecentRecords] = useState<BirdRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getMyBirdRecords()
        .then(({ records }) => setRecentRecords(records.slice(-3).reverse()))
        .catch(() => {});
    }, []),
  );

  async function loadUserLocation() {
    try {
      setLoading(true);
      setPermissionDenied(false);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      });
    } catch (error) {
      console.log("[MAPA] Erro ao obter localização:", error);

      setRegion({
        latitude: -5.7945,
        longitude: -35.211,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.logo}>PIU</Text>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Buscando sua localização...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="map-pin" size={48} color={COLORS.primary} />
        <Text style={styles.errorTitle}>Localização desativada</Text>
        <Text style={styles.errorText}>
          Permita o acesso à localização para visualizar seus registros no mapa.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadUserLocation}
        >
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        />
      )}

      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerTitle}>Mapa de Registros</Text>
          <Text style={styles.headerSubtitle}>
            {recentRecords.length > 0
              ? `${recentRecords.length} registro${recentRecords.length > 1 ? "s" : ""} recente${recentRecords.length > 1 ? "s" : ""}`
              : "Nenhum registro ainda"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="mic" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomTitle}>Últimos registros</Text>

        {recentRecords.length === 0 ? (
          <Text style={styles.emptyText}>
            Grave um pássaro para ver seus registros aqui.
          </Text>
        ) : (
          recentRecords.map((record) => (
            <View key={record.id} style={styles.birdRow}>
              <View style={styles.pinCircle}>
                <Icon name="map-pin" size={15} color={COLORS.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.birdName}>{record.common_name}</Text>
                <Text style={styles.birdScientific}>{record.scientific_name}</Text>
              </View>

              <Text style={styles.birdDate}>
                {new Date(record.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 36,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: COLORS.neutral,
  },
  errorTitle: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    color: COLORS.neutral,
    textAlign: "center",
    lineHeight: 23,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  headerCard: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    fontWeight: "700",
    color: COLORS.primary,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.neutral,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D4F0E3",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  bottomTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  birdRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  birdName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  birdScientific: {
    fontSize: 12,
    fontStyle: "italic",
    color: COLORS.tertiary,
    marginTop: 2,
  },
  birdDate: {
    fontSize: 12,
    color: COLORS.neutral,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.neutral,
    textAlign: "center",
    paddingVertical: 8,
  },
});
