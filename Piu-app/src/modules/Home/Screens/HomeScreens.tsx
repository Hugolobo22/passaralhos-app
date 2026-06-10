// src/modules/Home/screens/HomeScreen.tsx
// Integração real da IA de detecção de pássaros substituindo o mock

import React, { useRef, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Audio } from "expo-av";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import type { BottomTabsParamList } from "../../../navigation/BottomTabsNavigator";
import { tokenManager } from "../../../core/auth/tokenManager";
import { useAuthStore } from "../../../store/authStore";
import { createBirdRecord } from "../../Collection/services/collectionService";
import { predictBird } from "../../../core/api/birdsApi";

const { width } = Dimensions.get("window");

type Props = BottomTabScreenProps<BottomTabsParamList, "Home">;

const BARS: { height: number; dark?: boolean; opacity?: number }[] = [
  { height: 18, opacity: 0.35 },
  { height: 28, opacity: 0.5 },
  { height: 42, opacity: 0.65 },
  { height: 60, dark: false },
  { height: 76, dark: true },
  { height: 52, dark: true },
  { height: 90, dark: true },
  { height: 64, dark: true },
  { height: 48, dark: true },
  { height: 60, dark: false },
  { height: 30, opacity: 0.55 },
  { height: 20, opacity: 0.38 },
];

function WaveBar({
  item,
  isListening,
}: {
  item: (typeof BARS)[0];
  index: number;
  isListening: boolean;
}) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.35 + Math.random() * 0.65,
            duration: 300 + Math.random() * 400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + Math.random() * 400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    anim.stopAnimation();
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  }, [isListening, anim]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          height: item.height,
          opacity: item.opacity ?? 1,
          backgroundColor: item.dark ? "#003B1F" : "#5A7B64",
          transform: [{ scaleY: anim }],
        },
      ]}
    />
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [isListening, setIsListening]     = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [locationName, setLocationName]   = useState("Obtendo localização...");

  const recordingRef      = useRef<Audio.Recording | null>(null);
  const recordingInitRef  = useRef<Promise<boolean> | null>(null); // resolve quando recording está pronto
  const recordingStartRef = useRef<number>(0); // timestamp de quando o áudio começou a fluir
  const MIN_RECORD_MS     = 1000; // mínimo de 1 segundo para ter dados válidos
  const { restoreSession } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  // ── Localização ───────────────────────────────────────────────
  useEffect(() => {
    async function loadLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setLocationName("Localização indisponível"); return; }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const reverse = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        if (reverse.length > 0) {
          const place = reverse[0];
          const city = place.city || place.district || place.subregion || place.region || "Local desconhecido";
          const country = place.country || "";
          setLocationName(country ? `${city}, ${country}` : city);
        } else {
          setLocationName("Local desconhecido");
        }
      } catch {
        setLocationName("Localização indisponível");
      }
    }
    loadLocation();
  }, []);

  // ── Animação do botão ─────────────────────────────────────────
  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      loop.start();
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      return () => loop.stop();
    }
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
    Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  }, [isListening]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.55] });

  // ── Inicia gravação ───────────────────────────────────────────
  async function handlePressIn() {
    if (isSavingRecord) return;

    // Guarda a promise de inicialização para handlePressOut aguardar
    recordingInitRef.current = (async (): Promise<boolean> => {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão necessária", "Precisamos acesso ao microfone para identificar pássaros.");
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      recordingStartRef.current = Date.now();
      setIsListening(true);
      console.log("[BIRD] gravação iniciada, uri:", recording.getURI());
      return true;
    })();

    try {
      await recordingInitRef.current;
    } catch (e: any) {
      console.log("[BIRD] erro ao iniciar gravação:", e.message);
      Alert.alert("Erro", e.message ?? "Não foi possível iniciar a gravação.");
    }
  }

  // ── Para gravação, envia para IA e salva registro ─────────────
  async function handlePressOut() {
    // Aguarda a inicialização da gravação caso ainda esteja em andamento
    if (recordingInitRef.current) {
      try { await recordingInitRef.current; } catch { /* erro já tratado em handlePressIn */ }
      recordingInitRef.current = null;
    }

    setIsListening(false);

    if (!recordingRef.current || isSavingRecord) {
      console.log("[BIRD] handlePressOut ignorado — recording:", !!recordingRef.current, "isSaving:", isSavingRecord);
      return;
    }

    try {
      setIsSavingRecord(true);

      // Garante tempo mínimo de gravação para ter dados de áudio válidos no buffer
      const elapsed = Date.now() - recordingStartRef.current;
      if (elapsed < MIN_RECORD_MS) {
        await new Promise<void>((r) => setTimeout(r, MIN_RECORD_MS - elapsed));
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      console.log("[BIRD] arquivo gravado:", uri);
      if (!uri) throw new Error("Arquivo de gravação não encontrado");

      console.log("[BIRD] chamando predictBird...");
      const prediction = await predictBird(uri);
      console.log("[BIRD] predição:", prediction.species, prediction.confidence);

      // Salva no histórico (falha silenciosa para não bloquear o resultado)
      const result = await createBirdRecord({
        common_name:     prediction.species,
        scientific_name: prediction.species,
        confidence:      Math.round(prediction.confidence * 100),
        audio_url:       null,
        location:        locationName,
      }).catch((err) => { console.log("[BIRD] erro ao salvar registro:", err); return null; });

      const confidencePct = Math.round(prediction.confidence * 100);
      const top2 = prediction.top5?.[1];

      Alert.alert(
        "Ave identificada!",
        `${prediction.species}\n\nConfiança: ${confidencePct}%\n` +
        (top2 ? `2ª possibilidade: ${top2.species} (${Math.round(top2.probability * 100)}%)\n` : "") +
        `\nXP ganho: ${result?.xp_gained ?? 0}`,
        [{ text: "Ver coleção", onPress: () => navigation.navigate("Collection" as any) }, { text: "OK" }],
      );

    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e.message ?? "Erro desconhecido";
      console.log("[BIRD] erro na detecção:", e?.response?.status, detail);
      Alert.alert("Não identificado", detail, [{ text: "OK" }]);
    } finally {
      setIsSavingRecord(false);
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    }
  }

  // ── Logout ────────────────────────────────────────────────────
  async function handleLogout() {
    Alert.alert("Sair da conta", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await tokenManager.clearTokens();
            await restoreSession();
          } catch {
            Alert.alert("Erro", "Não foi possível sair da conta.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F2" />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Icon name="book-open" size={22} color="#065F46" />
          <Text style={styles.logoText}>PIU</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={handleLogout}
        >
          <Icon name="log-out" size={20} color="#8A3A3A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {isSavingRecord ? "Analisando…" : isListening ? "Ouvindo…" : "Ouça\ncom Atenção"}
          </Text>
          <Text style={styles.subtitle}>
            {isSavingRecord
              ? "Nossa IA está identificando a espécie"
              : isListening
              ? "Aponte o celular na direção do pássaro"
              : "Segure o botão para capturar o canto do pássaro no seu ambiente."}
          </Text>
        </View>

        <View style={styles.waveContainer}>
          {BARS.map((item, index) => (
            <WaveBar key={index} item={item} index={index} isListening={isListening || isSavingRecord} />
          ))}
        </View>

        <View>
          <Animated.View style={[styles.micGlowRing, { opacity: glowOpacity }]} pointerEvents="none" />
          <View style={styles.micOuterBorder}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
                isSavingRecord && styles.micButtonDisabled,
              ]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.85}
              disabled={isSavingRecord}
            >
              {isSavingRecord ? (
                <ActivityIndicator size="large" color="#003B1F" />
              ) : (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialCommunityIcons
                    name={isListening ? "microphone" : "microphone-outline"}
                    size={52}
                    color="#003B1F"
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.listenHint}>
          {isSavingRecord
            ? "Analisando e salvando registro..."
            : isListening
            ? "● Gravando… solte para identificar"
            : "Segure para gravar"}
        </Text>

        <TouchableOpacity
          style={styles.locationBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Map")}
        >
          <Icon name="map-pin" size={13} color="#065F46" />
          <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
          <Icon name="chevron-right" size={13} color="#A0A89D" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F9F2" },
  header: {
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDE3D8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    backgroundColor: "#F6F9F2",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoText: {
    fontSize: 22, fontStyle: "italic", color: "#065F46",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    letterSpacing: 0.3,
  },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F4EDED",
    alignItems: "center", justifyContent: "center",
  },
  content: {
    flex: 1, alignItems: "center", justifyContent: "space-evenly",
    paddingHorizontal: 24, paddingVertical: 12,
  },
  titleBlock: { alignItems: "center", gap: 12 },
  title: {
    fontSize: 54, fontWeight: "700", color: "#00361A",
    fontFamily: Platform.select({ ios: "Georgia-Bold", android: "serif" }),
    textAlign: "center", lineHeight: 60, letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16, textAlign: "center", color: "#6B7368", lineHeight: 24,
  },
  waveContainer: {
    flexDirection: "row", alignItems: "center", gap: 5, height: 100,
  },
  waveBar: { width: 6, borderRadius: 8 },
  micGlowRing: {
    position: "absolute", top: -20, left: -20, right: -20, bottom: -20,
    borderRadius: 999, backgroundColor: "#F2C94C",
  },
  micOuterBorder: {
    borderWidth: 1.5, borderColor: "rgba(242,201,76,0.28)",
    borderRadius: 999, padding: 14,
  },
  micButton: {
    width: 164, height: 164, borderRadius: 82,
    backgroundColor: "#F2C94C",
    borderWidth: 7, borderColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#F2C94C", shadowOpacity: 0.28,
    shadowRadius: 18, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  micButtonActive: {
    backgroundColor: "#E8B93A", shadowOpacity: 0.55, shadowRadius: 28, elevation: 14,
  },
  micButtonDisabled: { opacity: 0.75 },
  listenHint: {
    fontSize: 13, color: "#8C9189", letterSpacing: 0.8,
    fontWeight: "500", marginTop: -8, textAlign: "center",
  },
  locationBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#D4D9D0",
    gap: 7,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2, maxWidth: width - 48,
  },
  locationText: {
    fontSize: 13, fontWeight: "600", color: "#3A4039",
    letterSpacing: 0.3, maxWidth: width - 110,
  },
});