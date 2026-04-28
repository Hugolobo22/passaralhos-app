import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../modules/home/screens/HomeScreens";
import CollectionScreen from "../modules/collection/screens/ColectionScreen";
import MapaScreen from "../modules/map/screens/MapaScreen";

export type BottomTabsParamList = {
  Home: undefined;
  Collection: undefined;
  Map: undefined;
};

const Tab = createBottomTabNavigator<BottomTabsParamList>();

export default function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1A402E",
        tabBarInactiveTintColor: "#757874",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E8E8E8",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Início",
        }}
      />

      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: "Coleção",
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapaScreen}
        options={{
          title: "Mapa",
        }}
      />
    </Tab.Navigator>
  );
}
