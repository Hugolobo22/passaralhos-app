import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { useAuthStore } from "../store/authStore";
import AuthNavigator from "./AuthNavigator";

// Placeholder para as tabs — será substituído pelo BottomTabsNavigator
import { Text } from "react-native";
const AppPlaceholder = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F5F0E8",
    }}
  >
    <Text style={{ fontSize: 40 }}>🐦</Text>
    <Text
      style={{
        fontWeight: "700",
        color: "#1A4D2E",
        marginTop: 12,
        fontSize: 18,
      }}
    >
      App carregado com sucesso!
    </Text>
    <Text style={{ color: "#5A6E58", marginTop: 4 }}>
      Bottom Tabs serão implementados na próxima etapa.
    </Text>
  </View>
);

const Root = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  // Ao abrir o app, tenta restaurar a sessão a partir dos tokens salvos
  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🐦</Text>
        <ActivityIndicator
          color="#1A4D2E"
          size="large"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {isAuthenticated ? (
          <Root.Screen name="App" component={AppPlaceholder} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#F5F0E8",
    justifyContent: "center",
    alignItems: "center",
  },
  splashEmoji: { fontSize: 64 },
});
