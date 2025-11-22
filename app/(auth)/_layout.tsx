import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { languageResources } from '../../services/i18next';
import languagesList from '../../services/languagesList.json';
import { styles as s } from '../../styles/authStyles';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { changeLanguage, currentLanguage } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleLanguageChange = async (lng: string) => {
    try {
      await changeLanguage(lng);
      setLanguageModalVisible(false);
      console.log('Language changed to:', lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleLanguageButtonPress = () => {
    console.log('Language button pressed, opening modal');
    setLanguageModalVisible(true);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontWeight: 'bold',
            fontSize: 16,
            textAlignVertical: 'top', // center text
            flex: 1
          },
        }}>
        <Tabs.Screen
          name="login"
          options={{
            title: t('Login'),
            tabBarIcon: () => null,
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            title: t('Sign up'),
            tabBarIcon: () => null,
          }}
        />
      </Tabs>

      {/* Language Change Button */}
      <TouchableOpacity 
        style={[s.languageButton, { position: 'absolute', top: 50, right: 20, zIndex: 1000 }]}
        onPress={handleLanguageButtonPress}
      >
        <Text style={s.languageButtonText}>
          {t('Languages')} ({currentLanguage.toUpperCase()})
        </Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal 
        visible={languageModalVisible} 
        onRequestClose={() => {
          console.log('Modal close requested');
          setLanguageModalVisible(false);
        }}
        transparent={true}
        animationType="slide"
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Select Language</Text>
            <FlatList
              data={Object.keys(languageResources)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={s.languageOption}
                  onPress={() => {
                    console.log('Language option pressed:', item);
                    handleLanguageChange(item);
                  }}
                >
                  <Text style={s.languageOptionText}>
                    {languagesList[item as keyof typeof languagesList]?.nativeName || item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={s.modalCloseButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={s.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
