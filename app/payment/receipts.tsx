import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../../api";

export default function Receipts() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API("apps/payment/listReceipts", {}, "GET", true, userData?.accessToken);
      if (response.statusCode === 200) setReceipts(response.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={receipts}
        keyExtractor={(item) => String(item.payment_id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReceipts} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: "/payment/receiptDetail", params: { paymentId: item.payment_id } } as any)}>
            <Text style={styles.invoice}>Receipt PAY-{String(item.payment_id).padStart(3, "0")}</Text>
            <Text>{item.invoice?.description}</Text>
            <Text style={styles.amount}>RM {Number(item.amount || 0).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  link: { color: "#1C8ADB", fontWeight: "600", marginTop: 8 },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 10 },
  invoice: { fontWeight: "700" },
  amount: { fontWeight: "700", marginTop: 6 },
});
