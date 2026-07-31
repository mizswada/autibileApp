import React, { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";

const IC_LENGTH = 12;

interface IcNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
}

function getDigits(value: string): string[] {
  const cleaned = value.replace(/\D/g, "").slice(0, IC_LENGTH);
  return Array.from({ length: IC_LENGTH }, (_, i) => cleaned[i] || "");
}

export default function IcNumberInput({
  value,
  onChange,
  autoFocus = false,
  editable = true,
}: IcNumberInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const digits = getDigits(value);

  const focusInput = (index: number) => {
    if (index >= 0 && index < IC_LENGTH) {
      inputRefs.current[index]?.focus();
    }
  };

  useEffect(() => {
    if (autoFocus && editable) {
      const firstEmpty = digits.findIndex((d) => !d);
      focusInput(firstEmpty === -1 ? IC_LENGTH - 1 : firstEmpty);
    }
  }, [autoFocus, editable]);

  const emitDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join(""));
  };

  const handleChange = (index: number, text: string) => {
    if (!editable) return;

    const cleaned = text.replace(/\D/g, "");

    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      emitDigits(nextDigits);
      return;
    }

    if (cleaned.length > 1) {
      const nextDigits = [...digits];
      let cursor = index;
      for (const char of cleaned) {
        if (cursor >= IC_LENGTH) break;
        nextDigits[cursor] = char;
        cursor += 1;
      }
      emitDigits(nextDigits);
      focusInput(Math.min(cursor, IC_LENGTH - 1));
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    emitDigits(nextDigits);

    if (index < IC_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (!editable || event.nativeEvent.key !== "Backspace") return;

    if (digits[index]) return;

    if (index > 0) {
      const nextDigits = [...digits];
      nextDigits[index - 1] = "";
      emitDigits(nextDigits);
      focusInput(index - 1);
    }
  };

  const renderBox = (index: number) => {
    const isFocused = focusedIndex === index;
    const isFilled = !!digits[index];

    return (
      <TextInput
        key={index}
        ref={(ref) => {
          inputRefs.current[index] = ref;
        }}
        style={[
          styles.box,
          isFocused && styles.boxFocused,
          isFilled && styles.boxFilled,
          !editable && styles.boxDisabled,
        ]}
        value={digits[index]}
        onChangeText={(text) => handleChange(index, text)}
        onKeyPress={(event) => handleKeyPress(index, event)}
        onFocus={() => setFocusedIndex(index)}
        onBlur={() => setFocusedIndex(null)}
        keyboardType="number-pad"
        maxLength={IC_LENGTH}
        selectTextOnFocus
        editable={editable}
        textAlign="center"
      />
    );
  };

  const renderGroup = (start: number, count: number, flex: number) => (
    <View style={[styles.group, { flex }]}>
      {Array.from({ length: count }, (_, i) => renderBox(start + i))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderGroup(0, 6, 6)}
      <Text style={styles.dash}>-</Text>
      {renderGroup(6, 2, 2)}
      <Text style={styles.dash}>-</Text>
      {renderGroup(8, 4, 4)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },
  box: {
    flex: 1,
    minWidth: 0,
    height: 36,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    backgroundColor: "#fff",
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  boxFocused: {
    borderColor: "#4db5ff",
    backgroundColor: "#F0F9FF",
  },
  boxFilled: {
    backgroundColor: "#F8FAFC",
  },
  boxDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  dash: {
    flexShrink: 0,
    width: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
    lineHeight: 36,
  },
});
