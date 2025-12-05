import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const ONBOARDING_STORAGE_KEY = '@trovio_onboarding_seen';

export default function OnboardingScreen() {
  const [selectedButton, setSelectedButton] = useState<'login' | 'signup' | null>(null);

  const goToAuth = async (path: '/(auth)/login' | '/(auth)/signup') => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Failed to persist onboarding flag', error);
    }
    router.replace(path);
  };

  const handleButtonPress = (type: 'login' | 'signup') => {
    setSelectedButton(type);
    const path = type === 'login' ? '/(auth)/login' : '/(auth)/signup';
    goToAuth(path);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Discover What's Around You.</Text>
        <Text style={styles.subtitle}>Browse local stores, find discounts, and get all the info you need in one app.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[
            styles.button, 
            selectedButton === 'login' && styles.buttonSelected
          ]} 
          onPress={() => handleButtonPress('login')}
        >
          <Text style={[
            styles.buttonText,
            selectedButton === 'login' && styles.buttonTextSelected
          ]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.button, 
            selectedButton === 'signup' && styles.buttonSelected
          ]} 
          onPress={() => handleButtonPress('signup')}
        >
          <Text style={[
            styles.buttonText,
            selectedButton === 'signup' && styles.buttonTextSelected
          ]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  buttonSelected: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSelected: {
    color: '#000000',
  },
});


