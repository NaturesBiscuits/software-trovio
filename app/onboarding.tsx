import React, { useState } from 'react';
import { 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image,
  Platform,
  useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

const ONBOARDING_STORAGE_KEY = '@trovio_onboarding_seen';

export default function OnboardingScreen() {
  const [selectedButton, setSelectedButton] = useState<'login' | 'signup' | null>(null);
  const { width } = useWindowDimensions();

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
      <View style={[
        styles.backButtonWrapper,
        {
          marginTop: (Platform.OS === 'ios' ? 32 : 38), // moved lower (increased value)
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            {
              width: width < 350 ? 36 : 42,
              height: width < 350 ? 36 : 42,
              borderRadius: 21,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
          onPress={handleBack}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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

  backButtonWrapper: {
    width: '100%',
    zIndex: 10,
    position: 'relative',
    alignItems: 'flex-start',
  },
  backButton: {
    backgroundColor: 'rgba(42,42,50,0.7)', // pill background for tap affordance, slightly dark transparent
    marginLeft: 0, // Let SafeAreaView or wrapper handle horizontal spacing
    // width/height/borderRadius set dynamically in component
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: -150,
  },

  logo: {
    width: 180,
    height: 180,
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

  buttonRowWrapper: {
    marginBottom: 55,
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
