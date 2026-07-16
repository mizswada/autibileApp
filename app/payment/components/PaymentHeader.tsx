import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { paymentStyles } from "../styles";

export default function PaymentHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <View style={paymentStyles.stackHeader}>
      <TouchableOpacity onPress={() => router.back()} style={paymentStyles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={paymentStyles.stackHeaderTitle}>{title}</Text>
    </View>
  );
}
