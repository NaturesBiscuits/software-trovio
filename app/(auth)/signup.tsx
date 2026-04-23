import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, FlatList } from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { styles as s} from '../../styles/authStyles';
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { languageResources } from "../../services/i18next";
import languagesList from "../../services/languagesList.json";

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  async function signUpWithEmail() {
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
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

      <Text style={s.title}>{t("Let's get started")}</Text>

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
          secureTextEntry={hidePassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
          <Icon
            name={hidePassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            style={s.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={s.inputContainer}>
        <Icon name="lock-closed-outline" size={20} style={s.icon} />
        <TextInput
          style={s.input}
          placeholder={t('Confirm Password')}
          placeholderTextColor="#8E8E93"
          secureTextEntry={hideConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
        >
          <Icon
            name={hideConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            style={s.icon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.button} onPress={() => { if (!loading) { signUpWithEmail() } }}>
        <Text style={s.buttonText}>{t('Register')}</Text>
      </TouchableOpacity>

      <Text style={s.secondaryText}>{t('or continue with')}</Text>

      <TouchableOpacity
        style={[s.inputContainer, { justifyContent: "center" }]}
      >
        <Icon name="logo-google" size={20} color="#FFFFFF" />
        <Text style={[s.input, { textAlign: "center" }]}>Google</Text>
      </TouchableOpacity>

      <Text style={s.secondaryText}>
        {t("Already have an account?")}{" "}
        <Text
          style={s.linkText}
          onPress={() => router.push('/(auth)/login')}
        >
          {t('Login')}
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
