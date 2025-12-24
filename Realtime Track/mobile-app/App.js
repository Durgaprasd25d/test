/**
 * Main App - Navigation Setup
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import DriverScreen from './src/screens/DriverScreen';
import CustomerScreen from './src/screens/CustomerScreen';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#1976D2',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="Driver"
                    component={DriverScreen}
                    options={{
                        title: 'Driver Tracking',
                        headerBackTitle: 'Back',
                    }}
                />
                <Stack.Screen
                    name="Customer"
                    component={CustomerScreen}
                    options={{
                        title: 'Track Driver',
                        headerBackTitle: 'Back',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
