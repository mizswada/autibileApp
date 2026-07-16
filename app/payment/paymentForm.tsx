import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import API from "../../api";
import { PAYMENT_METHODS } from "./constants";

export default function PaymentForm() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [method, setMethod] = useState<string>("Online Banking");
  const [bankName, setBankName] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const [invoiceRes, banksRes] = await Promise.all([
        API(`apps/payment/getInvoice/${invoiceId}`, {}, "GET", true, userData?.accessToken),
        API("apps/payment/banks", {}, "GET", true, userData?.accessToken),
      ]);
      if (invoiceRes.statusCode === 200) setInvoice(invoiceRes.data);
      if (banksRes.statusCode === 200) setBanks(banksRes.data || []);
    };
    load();
  }, [invoiceId]);

  const submit = async () => {
    const isCash = method === "Cash";
    if (!isCash && (!bankName || !referenceCode)) {
      Alert.alert("Missing fields", "Please fill bank and reference code.");
      return;
    }
    const raw = await AsyncStorage.getItem("userData");
    const userData = raw ? JSON.parse(raw) : null;
    const response = await API(
      "apps/payment/submitPayment",
      {
        invoiceID: Number(invoiceId),
        amount: invoice.amount,
        method,
        bank_name: isCash ? null : bankName,
        reference_code: isCash ? null : referenceCode,
      },
      "POST",
      true,
      userData?.accessToken,
    );
    if (response.statusCode === 201) {
      Alert.alert("Submitted", "Payment submitted and pending admin approval.");
      router.replace("/payment" as any);
    } else {
      Alert.alert("Error", response.message || "Failed to submit payment.");
    }
  };

  if (!invoice) return <SafeAreaView style={styles.container}><Text>Loading...</Text></SafeAreaView>;
  const isCash = method === "Cash";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Submit Payment</Text>
      <Text>Invoice: INV-{String(invoice.invoice_id).padStart(3, "0")}</Text>
      <Text>Amount: RM {Number(invoice.amount || 0).toFixed(2)}</Text>
      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.methodRow}>
        {PAYMENT_METHODS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.methodBtn, method === item && styles.methodBtnActive]}
            onPress={() => setMethod(item)}
          >
            <Text style={method === item ? styles.methodTextActive : styles.methodText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!isCash && (
        <>
          <Text style={styles.label}>Bank / Provider</Text>
          <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Enter bank/provider name" />
          <Text style={styles.label}>Reference Code / Transaction ID</Text>
          <TextInput style={styles.input} value={referenceCode} onChangeText={setReferenceCode} />
          {banks.length > 0 && <Text style={styles.hint}>Available banks: {banks.slice(0, 5).map((b) => b.title).join(", ")}</Text>}
        </>
      )}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit Payment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8F8F8" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: "600" },
  inputWrap: { backgroundColor: "#fff", borderRadius: 8 },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  methodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  methodBtnActive: { backgroundColor: "#1C8ADB" },
  methodText: { color: "#333" },
  methodTextActive: { color: "#fff", fontWeight: "700" },
  hint: { marginTop: 6, color: "#888", fontSize: 12 },
  button: { marginTop: 20, backgroundColor: "#1C8ADB", borderRadius: 8, padding: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
