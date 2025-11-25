// src/screens/MainScreen.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import AuthScreen from "./AuthScreen";
import TodoScreen from "./TodoScreen";

export default function MainScreen() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user) {
    // Not logged in → show login/signup UI
    return <AuthScreen />;
  }

  // Logged in → show TodoScreen, pass user as prop
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TodoScreen user={user} />
    </SafeAreaView>
  );
}
