import React, { useState } from 'react';
import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons as Icon } from '@expo/vector-icons';

const LANDING_PAGE_STORAGE_KEY = '@trovio_landing_page_seen';

export default function LandingPageScreen() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const selectedLanguageLabel = selectedLanguage === 'az' ? t('Azərbaycan dili') : t('English');

  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    try {
      await changeLanguage(language);
      // Force a small delay to ensure language change propagates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(LANDING_PAGE_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Failed to persist landing page flag', error);
    }
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{t('Welcome to Trovio')}</Text>
        <Text style={styles.subtitle}>{t('Choose Your Language')}</Text>
      </View>

      {/* Language Selection Buttons */}
      <View style={styles.languageContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            selectedLanguage === 'en' && styles.languageButtonSelected
          ]}
          onPress={() => handleLanguageSelect('en')}
        >
          <Text style={styles.flag}>🇬🇧</Text>
          <View style={styles.languageTextWrapper}>
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'en' && styles.languageTextSelected
              ]}
            >
              {t('English')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageButton,
            selectedLanguage === 'az' && styles.languageButtonSelected
          ]}
          onPress={() => handleLanguageSelect('az')}
        >
          <Text style={styles.flag}>🇦🇿</Text>
          <View style={styles.languageTextWrapper}>
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'az' && styles.languageTextSelected
              ]}
            >
              {t('Azərbaycan dili')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.selectionSummaryContainer}>
        <Text style={styles.selectionSummaryLabel}>{t('Selected language')}:</Text>
        <Text style={styles.selectionSummaryValue}>{selectedLanguageLabel}</Text>
      </View>

      {/* Settings Note */}
      {/* Adjusted: reduced the marginTop from 250 to 80 to bring the note higher */}
      <View style={[styles.noteContainer, { marginTop: 80 }]}>
        <Text style={styles.noteText}>
          {t('Your language preference can be changed at any time in Settings.')}
        </Text>
      </View>

      {/* Arrow "Next" Button with Continue Text */}
      {/* Absolutely position the button and text slightly above the lower right corner */}
      <TouchableOpacity 
        style={styles.fabContainer}
        onPress={handleContinue}
        accessibilityLabel={t('Next')}
      >
        <Text style={styles.continueText}>{t('Continue')}</Text>
        {/* Arrow with white circle background */}
        <View style={styles.arrowCircle}>
          <Icon name="arrow-forward" size={28} color="#191820" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191820',
    paddingHorizontal: 28,
  },

  titleSection: {
    alignItems: 'center',
    marginTop: 100, // moved header even lower than before
    marginBottom: 40,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },

  languageContainer: {
    gap: 12,
    marginTop: 20,
  },

  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A32',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 0,
    width: 220, // Make both containers the same, smaller width
    alignSelf: 'center',
    justifyContent: 'flex-start'
  },

  languageButtonSelected: {
    backgroundColor: '#3A3A42',
  },

  flag: {
    fontSize: 24,
    marginRight: 8,
  },

  languageTextWrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  languageTextSelected: {
    fontWeight: '600',
  },

  noteContainer: {
    marginTop: 30,
    paddingHorizontal: 10,
  },

  selectionSummaryContainer: {
    alignItems: 'center',
    marginTop: 20,
  },

  selectionSummaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.75,
  },

  selectionSummaryValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },

  noteText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },

  // Absolutely position the continue+arrow slightly above the lower right
  fabContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    // Use a more pronounced "bit upper": place it 100px from bottom, right as before
    bottom: 100,
    right: 28,
    zIndex: 10,
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
    backgroundColor: 'transparent',
  },

  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF', // White background for the circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
});
