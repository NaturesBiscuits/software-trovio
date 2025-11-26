import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLanguage } from "../../context/LanguageContext";
import { supabase } from "../../lib/supabase";
import { languageResources } from "../../services/i18next";
import languagesList from "../../services/languagesList.json";
import { styles as s } from '../../styles/authStyles';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "162487546610-hpbjrr32fp5o84q17fj9lpo1jjdmrphb.apps.googleusercontent.com",
    webClientId: "162487546610-6q08sq3gmask3sgujek29f3t35kfqgj4.apps.googleusercontent.com",
  });

  async function signInWithEmail() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    // If login succeeds, data.session will be non-null and layout will react via auth listener
    if (error) Alert.alert(error.message)
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

  React.useEffect(() => {
    async function handleGoogle() {
      if (response?.type === "success") {
        const { authentication } = response;

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: authentication?.idToken ?? "",
        });

        if (error) Alert.alert(error.message);
      }
    }

    handleGoogle();
  }, [response]);

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

      <TouchableOpacity style={s.button} onPress={() => { if (!loading) { signInWithEmail() } }}>
        <Text style={s.buttonText}>{t('Login')}</Text>
      </TouchableOpacity>

      <Text style={s.secondaryText}>{t('or continue with')}</Text>

      <TouchableOpacity
        style={[s.inputContainer, { justifyContent: "center" }]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Icon name="logo-google" size={20} color="#FFFFFF" />
        <Text style={[s.input, { textAlign: "center" }]}>Google</Text>
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
