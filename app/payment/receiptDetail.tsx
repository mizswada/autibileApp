import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";
import { getLogoBase64 } from "../../utils/getLogoBase64";
import PaymentHeader from "./components/PaymentHeader";
import { buildReceiptHtml } from "./receiptTemplate";
import { formatDate, formatInvoiceId, formatPaymentId, formatPrice } from "./constants";
import { paymentStyles } from "./styles";

export default function ReceiptDetail() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = await AsyncStorage.getItem("userData");
        const userData = raw ? JSON.parse(raw) : null;
        const response = await API(
          `apps/payment/getReceipt/${paymentId}`,
          {},
          "GET",
          true,
          userData?.accessToken,
        );
        if (response.statusCode === 200) {
          setPayment(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paymentId]);

  const printReceipt = async () => {
    if (!payment) return;
    setPrinting(true);
    try {
      let logoUri: string | null = null;
      try {
        logoUri = await getLogoBase64();
      } catch (logoError) {
        console.warn("Logo loading error:", logoError);
      }

      const html = buildReceiptHtml(payment, logoUri);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share receipt",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate receipt");
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Receipt" />
        <View style={paymentStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={paymentStyles.loadingText}>Loading receipt...</Text>
        </View>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Receipt" />
        <View style={paymentStyles.emptyContainer}>
          <Text style={paymentStyles.emptyText}>Receipt not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={paymentStyles.container}>
      <PaymentHeader title="Receipt" />
      <ScrollView contentContainerStyle={paymentStyles.content}>
        <View style={paymentStyles.detailSection}>
          <Text style={paymentStyles.detailLabel}>Receipt Number</Text>
          <Text style={paymentStyles.detailValue}>{formatPaymentId(payment.payment_id)}</Text>

          <Text style={paymentStyles.detailLabel}>Patient</Text>
          <Text style={paymentStyles.detailValue}>{payment.user_patients?.fullname || "N/A"}</Text>

          <Text style={paymentStyles.detailLabel}>Invoice</Text>
          <Text style={paymentStyles.detailValue}>{formatInvoiceId(payment.invoice_id)}</Text>

          <Text style={paymentStyles.detailLabel}>Description</Text>
          <Text style={paymentStyles.detailValue}>{payment.invoice?.description || "N/A"}</Text>

          <Text style={paymentStyles.detailLabel}>Amount</Text>
          <Text style={[paymentStyles.detailValue, { color: "#4db5ff", fontSize: 20 }]}>
            RM {formatPrice(payment.amount)}
          </Text>

          <Text style={paymentStyles.detailLabel}>Payment Method</Text>
          <Text style={paymentStyles.detailValue}>{payment.method || "N/A"}</Text>

          <Text style={paymentStyles.detailLabel}>Bank / Provider</Text>
          <Text style={paymentStyles.detailValue}>{payment.bank_name || "-"}</Text>

          <Text style={paymentStyles.detailLabel}>Reference Code</Text>
          <Text style={paymentStyles.detailValue}>{payment.reference_code || "-"}</Text>

          <Text style={paymentStyles.detailLabel}>Payment Date</Text>
          <Text style={paymentStyles.detailValue}>{formatDate(payment.created_at)}</Text>
        </View>

        <TouchableOpacity
          style={[paymentStyles.primaryButton, printing && { opacity: 0.7 }]}
          onPress={printReceipt}
          disabled={printing}
        >
          <Text style={paymentStyles.primaryButtonText}>
            {printing ? "Generating..." : "Print / Share Receipt"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
