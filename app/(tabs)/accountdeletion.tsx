import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AccountDeletionScreenProps = {
  navigation?: {
    goBack?: () => void;
  };
};

export default function AccountDeletionScreen({ navigation }: AccountDeletionScreenProps) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Image
            source={{
              uri: "file:///mnt/data/34b69407-7e6e-4d05-9926-97349c7c1c4a.png",
            }}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Account Deletion</Text>
        <Text style={styles.subtitle}>
          This will permanently delete your profile,{"\n"}
          settings, and all data. This action cannot be{"\n"}
          undone.
        </Text>

        {/* Input */}
        <View style={styles.inputWrapper}>
          <Image
            source={{
              uri: "https://img.icons8.com/ios-glyphs/30/ffffff/lock--v1.png",
            }}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter your old password..."
            placeholderTextColor="#6F6F6F"
            secureTextEntry={!show}
            onChangeText={setPassword}
            value={password}
          />

          <TouchableOpacity onPress={() => setShow(!show)}>
            <Image
              source={{
                uri: show
                  ? "https://img.icons8.com/ios-glyphs/30/ffffff/eye.png"
                  : "https://img.icons8.com/ios-glyphs/30/ffffff/closed-eye.png",
              }}
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.verifyText}>
          Type your password to verify it’s you
        </Text>

      </View>

      {/* Continue Button */}
      <View style={styles.bottomBtnWrap}>
        <TouchableOpacity style={styles.continueBtn}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0E0E11",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Back button
  backBtn: {
    paddingVertical: 6,
    width: 40,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: "#fff",
  },

  // Header text
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
    marginTop: 10,
  },
  subtitle: {
    color: "#A8A8A8",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },

  // Input container
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1E",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: "#B5B5B5",
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: "#B5B5B5",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "white",
    fontSize: 14,
  },

  verifyText: {
    color: "#7E7E7E",
    fontSize: 13,
    marginTop: 10,
  },

  // Bottom button
  bottomBtnWrap: {
    padding: 20,
  },
  continueBtn: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  continueText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
});
