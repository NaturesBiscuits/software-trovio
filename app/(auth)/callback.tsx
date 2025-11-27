import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const toSingleValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const accessToken = toSingleValue(params.access_token);
    const refreshToken = toSingleValue(params.refresh_token);

    if (!accessToken || !refreshToken) {
      setErrorMessage(
        "Missing authentication tokens. Please reopen the confirmation link from your email."
      );
      return;
    }

    const finishSignIn = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.replace("/(tabs)/discover");
    };

    finishSignIn();
  }, [params, router]);

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <Text style={styles.message}>{errorMessage}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.message}>Confirming your account...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#000000",
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    color: "#ffffff",
  },
});

