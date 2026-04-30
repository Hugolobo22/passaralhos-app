<<<<<<< Updated upstream
import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return <RootNavigator />;
=======

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './src/modules/Splash/Screens/SplashScreen';
import HomeScreen from './src/modules/Home/Screens/HomeScreens';
import CollectionScreen from './src/modules/Collection/Screens/CollectionScreen';
import Profile from './src/modules/Profile/Screens/ProfileScreens';


type Screen = 'splash' | 'home' | 'collection' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  switch (currentScreen) {
    case 'splash':
      return <SplashScreen onFinish={() => setCurrentScreen('home')} />;

    case 'home':
      return (
        <>
          <StatusBar style="dark" />
          <HomeScreen
            onNavigateToCollection={() => setCurrentScreen('collection')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
          />
        </>
      );

    case 'collection':
      return (
        <>
          <StatusBar style="dark" />
          <CollectionScreen
            onNavigateToHome={() => setCurrentScreen('home')}
          />
        </>
      );

    case 'profile':
      return (
        <>
          <StatusBar style="dark" />
          <Profile
            onNavigateToHome={() => setCurrentScreen('home')}
          />
        </>
      );

    default:
      return (
        <>
          <StatusBar style="dark" />
          <HomeScreen
            onNavigateToCollection={() => setCurrentScreen('collection')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
          />
        </>
      );
  }
>>>>>>> Stashed changes
}
