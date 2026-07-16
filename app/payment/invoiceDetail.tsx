import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import API from "../../api";
import PaymentHeader from "./components/PaymentHeader";
import {
  formatDate,
  formatInvoiceId,
  formatPrice,
  INVOICE_STATUS_COLORS,
} from "./constants";
import { paymentStyles } from "./styles";

export default function InvoiceDetail() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = await AsyncStorage.getItem("userData");
        const userData = raw ? JSON.parse(raw) : null;
        const response = await API(
          `apps/payment/getInvoice/${invoiceId}`,
          {},
          "GET",
          true,
          userData?.accessToken,
        );
        if (response.statusCode === 200) {
          setInvoice(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  if (loading) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Invoice Detail" />
        <View style={paymentStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={paymentStyles.loadingText}>Loading invoice...</Text>
        </View>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={paymentStyles.container}>
        <PaymentHeader title="Invoice Detail" />
        <View style={paymentStyles.emptyContainer}>
          <Text style={paymentStyles.emptyText}>Invoice not found</Text>
        </View>
      </View>
    );
  }

  const pending = invoice.latest_payment?.status === "Pending";
  const canPay = invoice.status !== "Paid" && !pending;
  const displayStatus = pending ? "Pending Approval" : invoice.status;

  return (
    <View style={paymentStyles.container}>
      <PaymentHeader title="Invoice Detail" />
      <ScrollView contentContainerStyle={paymentStyles.content}>
        <View style={paymentStyles.detailSection}>
          <Text style={paymentStyles.detailLabel}>Invoice Number</Text>
          <Text style={paymentStyles.detailValue}>{formatInvoiceId(invoice.invoice_id)}</Text>

          <Text style={paymentStyles.detailLabel}>Description</Text>
          <Text style={paymentStyles.detailValue}>{invoice.description}</Text>

          <Text style={paymentStyles.detailLabel}>Patient</Text>
          <Text style={paymentStyles.detailValue}>{invoice.patient_name || "N/A"}</Text>

          <Text style={paymentStyles.detailLabel}>Invoice Date</Text>
          <Text style={paymentStyles.detailValue}>{formatDate(invoice.date)}</Text>

          <Text style={paymentStyles.detailLabel}>Amount</Text>
          <Text style={[paymentStyles.detailValue, { fontSize: 22, color: "#4db5ff" }]}>
            RM {formatPrice(invoice.amount)}
          </Text>

          <View
            style={[
              paymentStyles.statusBadge,
              { backgroundColor: INVOICE_STATUS_COLORS[displayStatus] || "#9CA3AF" },
            ]}
          >
            <Text style={paymentStyles.statusText}>{displayStatus}</Text>
          </View>

          {pending && (
            <Text style={paymentStyles.pendingNote}>
              Your payment is pending admin approval.
            </Text>
          )}
        </View>

        {canPay && (
          <TouchableOpacity
            style={paymentStyles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/payment/paymentForm",
                params: { invoiceId: invoice.invoice_id },
              } as any)
            }
          >
            <Text style={paymentStyles.primaryButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
