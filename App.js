import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import NewRoundScreen from './src/screens/NewRoundScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Hjem') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Ny Runde') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Historik') {
              iconName = focused ? 'time' : 'time-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Hjem"
          component={HomeScreen}
          options={{ title: 'Bagtags' }}
        />
        <Tab.Screen
          name="Ny Runde"
          component={NewRoundScreen}
          options={{ title: 'Registrer Runde' }}
        />
        <Tab.Screen
          name="Historik"
          component={HistoryScreen}
          options={{ title: 'Historik' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}