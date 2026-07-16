import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../../api";

export default function InvoiceDetail() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API(`apps/payment/getInvoice/${invoiceId}`, {}, "GET", true, userData?.accessToken);
      if (response.statusCode === 200) {
        setInvoice(response.data);
      }
    };
    load();
  }, [invoiceId]);

  if (!invoice) return <SafeAreaView style={styles.container}><Text>Loading...</Text></SafeAreaView>;
  const pending = invoice.latest_payment?.status === "Pending";
  const canPay = invoice.status !== "Paid" && !pending;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Invoice Detail</Text>
      <Text>INV-{String(invoice.invoice_id).padStart(3, "0")}</Text>
      <Text>{invoice.description}</Text>
      <Text style={styles.amount}>RM {Number(invoice.amount || 0).toFixed(2)}</Text>
      <Text>Status: {invoice.status}</Text>
      {pending && <Text style={styles.pending}>Payment pending admin approval.</Text>}
      {canPay && (
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/payment/paymentForm", params: { invoiceId: invoice.invoice_id } } as any)}>
          <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8F8F8" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  amount: { fontWeight: "700", fontSize: 18, marginVertical: 8 },
  pending: { color: "#1C8ADB", marginTop: 8 },
  button: { marginTop: 16, backgroundColor: "#1C8ADB", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
