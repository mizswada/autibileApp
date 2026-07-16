import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../../api";
import {
  formatDate,
  formatInvoiceId,
  formatPrice,
  INVOICE_FILTERS,
  INVOICE_STATUS_COLORS,
} from "../payment/constants";
import { paymentStyles } from "../payment/styles";

export default function PaymentsTab() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const loadInvoices = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API(
        "apps/payment/listInvoices",
        {},
        "GET",
        true,
        userData?.accessToken,
      );
      if (response.statusCode === 200) {
        setInvoices(response.data || []);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const filteredInvoices = invoices.filter((item) => {
    const status = item.derived_status || item.status;
    return selectedFilter === "All" ? true : status === selectedFilter;
  });

  return (
    <View style={paymentStyles.container}>
      <View style={{ backgroundColor: "#4db5ff", justifyContent: "flex-end" }}>
        <SafeAreaView edges={["top"]}>
          <View style={paymentStyles.tabHeaderRow}>
            <Text style={paymentStyles.tabHeaderTitle}>Payments</Text>
            <TouchableOpacity onPress={() => router.push("/payment/receipts" as any)}>
              <Text style={paymentStyles.headerAction}>Receipts</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={paymentStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={paymentStyles.loadingText}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => String(item.invoice_id)}
          contentContainerStyle={paymentStyles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadInvoices(true);
              }}
              colors={["#4db5ff"]}
              tintColor="#4db5ff"
            />
          }
          ListHeaderComponent={
            <>
              <Text style={paymentStyles.introText}>
                View your child&apos;s invoices, submit payment proof, and track approval status.
              </Text>
              <View style={paymentStyles.filterRow}>
                {INVOICE_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      paymentStyles.filterChip,
                      selectedFilter === filter && paymentStyles.filterChipActive,
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={[
                        paymentStyles.filterChipText,
                        selectedFilter === filter && paymentStyles.filterChipTextActive,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={paymentStyles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={paymentStyles.emptyText}>No invoices found</Text>
              <Text style={paymentStyles.emptySubtext}>
                Invoices created by admin will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const displayStatus = item.derived_status || item.status;
            return (
              <TouchableOpacity
                style={paymentStyles.card}
                onPress={() =>
                  router.push({
                    pathname: "/payment/invoiceDetail",
                    params: { invoiceId: item.invoice_id },
                  } as any)
                }
              >
                <View style={paymentStyles.cardHeader}>
                  <Text style={paymentStyles.cardTitle}>{formatInvoiceId(item.invoice_id)}</Text>
                  <Text style={paymentStyles.cardAmount}>RM {formatPrice(item.amount)}</Text>
                </View>
                <Text style={paymentStyles.cardDescription}>{item.description}</Text>
                <Text style={paymentStyles.cardMeta}>Patient: {item.patient_name || "N/A"}</Text>
                <Text style={paymentStyles.cardMeta}>Date: {formatDate(item.date)}</Text>
                <View
                  style={[
                    paymentStyles.statusBadge,
                    { backgroundColor: INVOICE_STATUS_COLORS[displayStatus] || "#9CA3AF" },
                  ]}
                >
                  <Text style={paymentStyles.statusText}>{displayStatus}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
