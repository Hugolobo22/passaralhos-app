import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import HomeScreen from "../modules/Home/Screens/HomeScreens";
import MapaScreen from "../modules/Map/Screens/MapaScreen";
import CollectionScreen from "../modules/Collection/Screens/CollectionScreen";
import ProfileScreen from "../modules/Profile/Screens/ProfileScreens";

export type BottomTabsParamList = {
  Home: undefined;
  Collection: undefined;
  Map: undefined;
  Profile: undefined;
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: "Coleção",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapaScreen}
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map-pin" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}