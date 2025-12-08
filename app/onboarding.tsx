import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

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

  const handleBack = () => {
    router.replace('/landingpage');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-back" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/trovio-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Discover What’s{'\n'}Around You.</Text>
        <Text style={styles.subtitle}>
          Browse local stores, find{'\n'}discounts, and get all the info{'\n'}you need in one app.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRowWrapper}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.loginButton, selectedButton === 'login' && styles.loginSelected]}
            onPress={() => handleButtonPress('login')}
          >
            <Text 
              style={[
                styles.loginText,
                selectedButton === 'login' && styles.loginTextSelected
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.signupButton, selectedButton === 'signup' && styles.signupSelected]}
            onPress={() => handleButtonPress('signup')}
          >
            <Text 
              style={[
                styles.signupText,
                selectedButton === 'signup' && styles.signupTextSelected
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191820',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  backButton: {
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 20, // Added to move the back button a little to the right
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: -150, // Moved logo a bit to the top (was 40)
  },

  logo: {
    width: 280,
    height: 280,
    tintColor: '#FFFFFF',
  },

  textBlock: {
    alignItems: 'center',
    marginTop: -120,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    color: '#AFAFB4',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Adjust this to move the button a tiny bit lower
  buttonRowWrapper: {
    marginBottom: 55, // Was 70 before. Original paddingBottom in container is 40.
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 0,
  },

  // LOGIN BUTTON (white)
  loginButton: {
    flex: 0.5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginSelected: {
    opacity: 0.8,
  },
  loginText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
  loginTextSelected: {
    opacity: 0.8,
  },

  // SIGN UP BUTTON (dark pill)
  signupButton: {
    flex: 0.5,
    backgroundColor: '#2A2A32',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  signupSelected: {
    opacity: 0.8,
  },
  signupText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  signupTextSelected: {
    opacity: 0.8,
  },
});
