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
} from "react-native";
import { Feather as Icon } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import type { BottomTabsParamList } from "../../../navigation/BottomTabsNavigator";

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
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
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
  const [isListening, setIsListening] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      pulseLoop.start();

      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      return () => pulseLoop.stop();
    }

    pulseAnim.stopAnimation();
    Animated.spring(pulseAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isListening, pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.55],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F9F2" />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Icon name="book-open" size={22} color="#065F46" />
          <Text style={styles.logoText}>Passaralhos</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          //onPress={() => navigation.navigate("Profile" as never)}
        >
          <Icon name="settings" size={20} color="#8A8A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Ouça{"\n"}com Atenção</Text>

          <Text style={styles.subtitle}>
            Segure o botão para capturar o canto do pássaro no seu ambiente.
          </Text>
        </View>

        <View style={styles.waveContainer}>
          {BARS.map((item, index) => (
            <WaveBar
              key={index}
              item={item}
              index={index}
              isListening={isListening}
            />
          ))}
        </View>

        <View>
          <Animated.View
            style={[
              styles.micGlowRing,
              {
                opacity: glowOpacity,
              },
            ]}
            pointerEvents="none"
          />

          <View style={styles.micOuterBorder}>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPressIn={() => setIsListening(true)}
              onPressOut={() => setIsListening(false)}
              activeOpacity={0.85}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialCommunityIcons
                  name={isListening ? "microphone" : "microphone-outline"}
                  size={52}
                  color="#003B1F"
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.listenHint}>
          {isListening ? "● Gravando…" : "Segure para gravar"}
        </Text>

        <TouchableOpacity
          style={styles.locationBox}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Map")}
        >
          <Icon name="map-pin" size={13} color="#065F46" />
          <Text style={styles.locationText}>Sintra National Forest, PT</Text>
          <Icon name="chevron-right" size={13} color="#A0A89D" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F9F2",
  },
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoText: {
    fontSize: 22,
    fontStyle: "italic",
    color: "#065F46",
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
    }),
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  titleBlock: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 54,
    fontWeight: "700",
    color: "#00361A",
    fontFamily: Platform.select({
      ios: "Georgia-Bold",
      android: "serif",
    }),
    textAlign: "center",
    lineHeight: 60,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7368",
    lineHeight: 24,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 100,
  },
  waveBar: {
    width: 6,
    borderRadius: 8,
  },
  micGlowRing: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 999,
    backgroundColor: "#F2C94C",
  },
  micOuterBorder: {
    borderWidth: 1.5,
    borderColor: "rgba(242,201,76,0.28)",
    borderRadius: 999,
    padding: 14,
  },
  micButton: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: "#F2C94C",
    borderWidth: 7,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F2C94C",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: "#E8B93A",
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
  listenHint: {
    fontSize: 13,
    color: "#8C9189",
    letterSpacing: 0.8,
    fontWeight: "500",
    marginTop: -8,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D4D9D0",
    gap: 7,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A4039",
    letterSpacing: 0.3,
  },
});
