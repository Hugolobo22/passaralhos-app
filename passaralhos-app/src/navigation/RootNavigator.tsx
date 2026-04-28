import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";

import { useAuthStore } from "../store/authStore";
import AuthNavigator from "./AuthNavigator";
import BottomTabsNavigator from "./BottomTabsNavigator";
import SplashScreen from "../modules/splash/screens/SplashScreen";

const Root = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

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
        {showSplash ? (
          <Root.Screen name="Splash">
            {() => <SplashScreen onFinish={() => setShowSplash(false)} />}
          </Root.Screen>
        ) : isAuthenticated ? (
          <Root.Screen name="App" component={BottomTabsNavigator} />
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
  splashEmoji: {
    fontSize: 64,
  },
});
