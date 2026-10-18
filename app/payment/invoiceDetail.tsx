import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import * as Print from "expo-print";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import API from "../../api";
import { getLogoBase64 } from "../../utils/getLogoBase64";
import { sharePdfDocument } from "../../utils/sharePdfDocument";
import PaymentHeader from "./components/PaymentHeader";
import { buildInvoiceHtml } from "./_receiptTemplate";
import {
  formatDate,
  formatInvoiceId,
  formatPrice,
  INVOICE_STATUS_COLORS,
} from "./_constants";
import { paymentStyles } from "./_styles";

export default function InvoiceDetail() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

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

  // Same document as the website invoice (items table, Sales Date, no due date / terms).
  const printInvoice = async () => {
    if (!invoice) return;
    setPrinting(true);
    try {
      let logoUri: string | null = null;
      try {
        logoUri = await getLogoBase64();
      } catch (logoError) {
        console.warn("Logo loading error:", logoError);
      }

      const html = buildInvoiceHtml(invoice, logoUri);
      const { uri } = await Print.printToFileAsync({ html });
      await sharePdfDocument(uri, {
        dialogTitle: "Share invoice",
        fileName: `Invoice_${formatInvoiceId(invoice.invoice_id)}`,
        unavailableMessage: "Your invoice PDF was created, but sharing is not available on this device.",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate invoice");
    } finally {
      setPrinting(false);
    }
  };

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

          {Array.isArray(invoice.items) && invoice.items.length > 0 && (
            <>
              <Text style={paymentStyles.detailLabel}>Items</Text>
              {invoice.items.map((item: any) => (
                <Text key={item.item_id} style={paymentStyles.detailValue}>
                  {item.name}
                  {item.description ? ` - ${item.description}` : ""}
                  {"\n"}
                  {item.qty} x RM {formatPrice(item.unit_price)} = RM {formatPrice(item.subtotal)}
                </Text>
              ))}
            </>
          )}

          <Text style={paymentStyles.detailLabel}>Patient</Text>
          <Text style={paymentStyles.detailValue}>{invoice.patient_name || "N/A"}</Text>

          <Text style={paymentStyles.detailLabel}>Sales Date</Text>
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

        <TouchableOpacity
          style={[paymentStyles.primaryButton, printing && { opacity: 0.7 }, canPay && { marginBottom: 12 }]}
          onPress={printInvoice}
          disabled={printing}
        >
          <Text style={paymentStyles.primaryButtonText}>
            {printing ? "Generating..." : "Print / Share Invoice"}
          </Text>
        </TouchableOpacity>

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
