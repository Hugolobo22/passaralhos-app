// src/navigation/RootNavigator.tsx

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuthStore } from "../store/authStore";
import AuthNavigator from "./AuthNavigator";
import BottomTabsNavigator from "./BottomTabsNavigator";
import SplashScreen from "../modules/Splash/Screens/SplashScreen";

const Root = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

  // Enquanto a splash não terminar, exibe ela
  if (!splashDone) {
    return (
      <SplashScreen
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {isAuthenticated ? (
          <Root.Screen name="App" component={BottomTabsNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}