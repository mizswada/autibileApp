import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../api";
import PaymentHeader from "./components/PaymentHeader";
import { formatDate, formatPaymentId, formatPrice } from "./constants";
import { paymentStyles } from "./styles";

export default function Receipts() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReceipts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const raw = await AsyncStorage.getItem("userData");
      const userData = raw ? JSON.parse(raw) : null;
      const response = await API(
        "apps/payment/listReceipts",
        {},
        "GET",
        true,
        userData?.accessToken,
      );
      if (response.statusCode === 200) {
        setReceipts(response.data || []);
      } else {
        setReceipts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return (
    <View style={paymentStyles.container}>
      <PaymentHeader title="Receipts" />
      {loading ? (
        <View style={paymentStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={paymentStyles.loadingText}>Loading receipts...</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => String(item.payment_id)}
          contentContainerStyle={paymentStyles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadReceipts(true);
              }}
              colors={["#4db5ff"]}
              tintColor="#4db5ff"
            />
          }
          ListHeaderComponent={
            <Text style={paymentStyles.introText}>
              Paid invoices with approved payments are available here for printing and sharing.
            </Text>
          }
          ListEmptyComponent={
            <View style={paymentStyles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={paymentStyles.emptyText}>No receipts yet</Text>
              <Text style={paymentStyles.emptySubtext}>
                Receipts appear after admin approves your payment.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={paymentStyles.card}
              onPress={() =>
                router.push({
                  pathname: "/payment/receiptDetail",
                  params: { paymentId: item.payment_id },
                } as any)
              }
            >
              <View style={paymentStyles.cardHeader}>
                <Text style={paymentStyles.cardTitle}>{formatPaymentId(item.payment_id)}</Text>
                <Text style={paymentStyles.cardAmount}>RM {formatPrice(item.amount)}</Text>
              </View>
              <Text style={paymentStyles.cardDescription}>{item.invoice?.description}</Text>
              <Text style={paymentStyles.cardMeta}>
                Patient: {item.user_patients?.fullname || "N/A"}
              </Text>
              <Text style={paymentStyles.cardMeta}>Date: {formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
