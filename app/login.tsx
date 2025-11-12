import PNExample from "@/components/pushNotifications/pnExample";
import api from "@/config/api";
import { useAppDispatch } from "@/store";
import { setUser } from "@/store/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, TextInput, View } from "react-native";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const reponseLogin = await api.post("user/login", {
        email: email,
        password: password,
      });

      const user = reponseLogin.data;
      await AsyncStorage.setItem("auth_user", JSON.stringify(user));
      dispatch(setUser(user));
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      console.log(err);
      Alert.alert("Erro ao logar", err?.message || "Tente novamente");
    }
  };
  return (
    <View style={styles.content}>
      <PNExample/>
      <TextInput
        style={styles.input}
        onChangeText={(v) => setEmail(v)}
        value={email}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        onChangeText={(v) => setPassword(v)}
        value={password}
        textContentType="password"
        placeholder="Senha"
        secureTextEntry
      />
      <Button
        onPress={handleLogin}
        title="Entrar"
        color="#155a84"
        accessibilityLabel="Logar na aplicação"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 10,
    backgroundColor: "#cdcdcd",
    flex: 1,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default Login;
