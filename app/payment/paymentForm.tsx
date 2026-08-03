import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";
import PaymentHeader from "./components/PaymentHeader";
import { formatInvoiceId, formatPrice, PAYMENT_METHODS } from "./constants";
import { paymentStyles } from "./styles";

export default function PaymentForm() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<string>("Online Banking");
  const [bankName, setBankName] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = await AsyncStorage.getItem("userData");
        const userData = raw ? JSON.parse(raw) : null;
        const [invoiceRes, banksRes] = await Promise.all([
          API(`apps/payment/getInvoice/${invoiceId}`, {}, "GET", true, userData?.accessToken),
          API("apps/payment/banks", {}, "GET", true, userData?.accessToken),
        ]);
        if (invoiceRes.statusCode === 200) setInvoice(invoiceRes.data);
        if (banksRes.statusCode === 200) setBanks(banksRes.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  const submit = async () => {
    const isCash = method === "Cash";
    if (!isCash && (!bankName.trim() || !referenceCode.trim())) {
      Alert.alert("Missing fields", "Please fill in bank/provider and reference code.");
      return;
    }

    setSubmitting(true);
    try {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API(
        "apps/payment/submitPayment",
        {
          invoiceID: Number(invoiceId),
          amount: invoice.amount,
          method,
          bank_name: isCash ? null : bankName.trim(),
          reference_code: isCash ? null : referenceCode.trim(),
        },
        "POST",
        true,
        userData?.accessToken,
      );

      if (response.statusCode === 201) {
        Alert.alert("Submitted", "Payment submitted and pending admin approval.", [
          { text: "OK", onPress: () => router.replace("/parentsPage/payments" as any) },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to submit payment.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Submit Payment" />
        <View style={paymentStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={paymentStyles.loadingText}>Loading payment form...</Text>
        </View>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Submit Payment" />
        <View style={paymentStyles.emptyContainer}>
          <Text style={paymentStyles.emptyText}>Invoice not found</Text>
        </View>
      </View>
    );
  }

  const isCash = method === "Cash";

  return (
    <View style={paymentStyles.container}>
      <PaymentHeader title="Submit Payment" />
      <ScrollView
        contentContainerStyle={paymentStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={paymentStyles.detailSection}>
          <Text style={paymentStyles.detailLabel}>Invoice</Text>
          <Text style={paymentStyles.detailValue}>{formatInvoiceId(invoice.invoice_id)}</Text>
          <Text style={paymentStyles.detailLabel}>Amount</Text>
          <Text style={[paymentStyles.detailValue, { color: "#4db5ff", fontSize: 20 }]}>
            RM {formatPrice(invoice.amount)}
          </Text>
        </View>

        <Text style={paymentStyles.label}>Payment Method</Text>
        <View style={paymentStyles.methodRow}>
          {PAYMENT_METHODS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[paymentStyles.methodBtn, method === item && paymentStyles.methodBtnActive]}
              onPress={() => setMethod(item)}
            >
              <Text style={method === item ? paymentStyles.methodTextActive : paymentStyles.methodText}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isCash && (
          <>
            <Text style={paymentStyles.label}>Bank / Provider</Text>
            <TextInput
              style={paymentStyles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Enter bank or e-wallet provider"
              placeholderTextColor="#9CA3AF"
            />
            {banks.length > 0 && (
              <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 6 }}>
                Suggested: {banks.slice(0, 5).map((bank) => bank.title).join(", ")}
              </Text>
            )}

            <Text style={paymentStyles.label}>Reference Code / Transaction ID</Text>
            <TextInput
              style={paymentStyles.input}
              value={referenceCode}
              onChangeText={setReferenceCode}
              placeholder="e.g. TXN123456789"
              placeholderTextColor="#9CA3AF"
            />
          </>
        )}

        <TouchableOpacity
          style={[paymentStyles.primaryButton, submitting && { opacity: 0.7 }]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={paymentStyles.primaryButtonText}>
            {submitting ? "Submitting..." : "Submit Payment"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
