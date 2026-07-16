import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";
import API from "../../api";

export default function ReceiptDetail() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API(`apps/payment/getReceipt/${paymentId}`, {}, "GET", true, userData?.accessToken);
      if (response.statusCode === 200) {
        setPayment(response.data);
      }
    };
    load();
  }, [paymentId]);

  const printReceipt = async () => {
    if (!payment) return;
    const html = `
      <html><body style="font-family: Arial; padding: 24px;">
      <h2>Autibile Receipt</h2>
      <p>Receipt No: PAY-${String(payment.payment_id).padStart(3, "0")}</p>
      <p>Patient: ${payment.user_patients?.fullname || "N/A"}</p>
      <p>Invoice: INV-${String(payment.invoice_id).padStart(3, "0")}</p>
      <p>Description: ${payment.invoice?.description || "N/A"}</p>
      <p>Amount: RM ${Number(payment.amount || 0).toFixed(2)}</p>
      <p>Method: ${payment.method || "N/A"}</p>
      <p>Bank: ${payment.bank_name || "-"}</p>
      <p>Reference: ${payment.reference_code || "-"}</p>
      <p>Date: ${new Date(payment.created_at).toLocaleString()}</p>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share receipt" });
    } catch (error) {
      Alert.alert("Error", "Failed to generate receipt");
    }
  };

  if (!payment) return <SafeAreaView style={styles.container}><Text>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receipt</Text>
      <Text>PAY-{String(payment.payment_id).padStart(3, "0")}</Text>
      <Text>{payment.invoice?.description}</Text>
      <Text style={styles.amount}>RM {Number(payment.amount || 0).toFixed(2)}</Text>
      <TouchableOpacity style={styles.button} onPress={printReceipt}>
        <Text style={styles.buttonText}>Print / Share Receipt</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8F8F8" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  amount: { fontWeight: "700", fontSize: 18, marginVertical: 8 },
  button: { marginTop: 16, backgroundColor: "#1C8ADB", borderRadius: 8, padding: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
