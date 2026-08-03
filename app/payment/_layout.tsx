import { Stack } from "expo-router";
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from "@/components/AuthenticatedLayout";

export default function PaymentLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="invoiceDetail" />
        <Stack.Screen name="paymentForm" />
        <Stack.Screen name="receipts" />
        <Stack.Screen name="receiptDetail" />
      </Stack>
    </AuthenticatedLayout>
  );
}
