import QrCodeGenerator from "@/components/frequency/qrCodeGenerator";
import api from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearUser, setUser } from "@/store/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [users, setUsers] = useState([]);
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s: any) => s.auth.user);

  useEffect(() => {
    dispatch(clearUser());
    // load app users list
    loadUsers();

      (async () => {
        try {
          const raw = await AsyncStorage.getItem("auth_user");
          if (raw) {
            const user = JSON.parse(raw);
            dispatch(setUser(user));
          }
        } catch (e) {}
      })();
  }, []);

  const loadUsers = async () => {
    const response = await api.get("/user");
    setUsers(response.data);
  };

  if (currentUser && currentUser.type === "professor") {
    return (
      <View style={styles.container}>
        <Text>Dados para professor</Text>
        <QrCodeGenerator />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text>Dados para aluno</Text>
        <Scanner onScan={(result) => console.log(result)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#cdcdcd",
    flex: 1,
  },
});
