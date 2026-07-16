import { Stack } from "expo-router";
import React from "react";

export default function PaymentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="invoiceDetail" />
      <Stack.Screen name="paymentForm" />
      <Stack.Screen name="receipts" />
      <Stack.Screen name="receiptDetail" />
    </Stack>
  );
}