import React from "react";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function PaymentHeader({ title }: { title: string }) {
  return <ScreenHeader title={title} />;
}
