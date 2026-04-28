import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return <RootNavigator />;
}
/*
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/Screens/SplashScreen';
import HomeScreen from './src/Screens/HomeScreens';
import ColectionScreen from './src/Screens/ColectionScreen';

type Screen = 'splash' | 'home' | 'collection';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  if (currentScreen === 'splash') {
    return <SplashScreen onFinish={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'home') {
    return (
      <>
        <StatusBar style="dark" />
        <HomeScreen
          onNavigateToCollection={() => setCurrentScreen('collection')}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ColectionScreen
        onNavigateToHome={() => setCurrentScreen('home')}
      />
    </>
  );
}
  */
