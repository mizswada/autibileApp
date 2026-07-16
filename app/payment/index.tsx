import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../../api";
import { INVOICE_STATUS_COLORS } from "./constants";

export default function PaymentIndex() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API("apps/payment/listInvoices", {}, "GET", true, userData?.accessToken);
      if (response.statusCode === 200) {
        setInvoices(response.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <TouchableOpacity onPress={() => router.push("/payment/receipts" as any)}>
          <Text style={styles.link}>Receipts</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={invoices}
        keyExtractor={(item) => String(item.invoice_id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInvoices} />}
        renderItem={({ item }) => {
          const displayStatus = item.derived_status || item.status;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: "/payment/invoiceDetail", params: { invoiceId: item.invoice_id } } as any)}
            >
              <Text style={styles.invoice}>INV-{String(item.invoice_id).padStart(3, "0")}</Text>
              <Text>{item.description}</Text>
              <Text style={styles.amount}>RM {Number(item.amount || 0).toFixed(2)}</Text>
              <Text style={{ color: INVOICE_STATUS_COLORS[displayStatus] || "#666" }}>{displayStatus}</Text>
            </TouchableOpacity>
          );
        }}
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
