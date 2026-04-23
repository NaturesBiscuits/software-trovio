import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";
import { languageResources } from "../../services/i18next";
import languagesList from "../../services/languagesList.json";
import { styles as s } from '../../styles/authStyles';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  async function signInWithEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }

      if (data?.session) {
        router.replace('/(tabs)/discover');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      Alert.alert('Login error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

const {t} = useTranslation();
const { changeLanguage, currentLanguage } = useLanguage();

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
    

    <View style={s.container}>
      {/* Language Change Button */}
      <TouchableOpacity 
        style={s.languageButton}
        onPress={handleLanguageButtonPress}
      >
        <Text style={s.languageButtonText}>
          {t('Languages')} ({currentLanguage.toUpperCase()})
        </Text>
      </TouchableOpacity>

      <Text style={s.title}>{t('Hey, Welcome')}</Text>

      <View style={s.inputContainer}>
        <Icon name="mail-outline" size={20} style={s.icon} />
        <TextInput
          style={s.input}
          placeholder={t('Email')}
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={s.inputContainer}>
        <Icon name="lock-closed-outline" size={20} style={s.icon} />
        <TextInput
          style={s.input}
          placeholder={t('Password')}
          placeholderTextColor="#8E8E93"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            style={s.icon}
          />
        </TouchableOpacity>
      </View>

      <Text style={[s.secondaryText, { alignSelf: "flex-end" }]}>
        {t('Forgot Password')}
      </Text>

      <TouchableOpacity style={[s.button, loading && { opacity: 0.6 }]} disabled={loading} onPress={signInWithEmail}>
        <Text style={s.buttonText}>{t('Login')}</Text>
      </TouchableOpacity>

      <Text style={s.secondaryText}>
        {t("Don't have an account?")}{" "}
        <Text
          style={s.linkText}
          onPress={() => router.push('/(auth)/signup')}
        >
          {t('Sign up')}
        </Text>
      </Text>

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
    </View>
  );
}
