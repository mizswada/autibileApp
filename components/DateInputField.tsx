import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { DatePickerField } from "@/components/DatePickerField";
import {
  displayDateToApi,
  formatApiDate,
  formatDateString,
  normalizeDisplayDateString,
  parseAnyLocalDate,
} from "@/utils/formatLocalDate";

type DateInputFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  editable?: boolean;
};

export function DateInputField({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  maximumDate,
  minimumDate,
  containerStyle,
  inputStyle,
  editable = true,
}: DateInputFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [text, setText] = useState(() => formatDateString(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(formatDateString(value));
  }, [value]);

  const bounds = { minimumDate, maximumDate };

  const commitText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError(null);
      setText("");
      onChange("");
      return;
    }

    const normalized = normalizeDisplayDateString(trimmed, bounds);
    if (!normalized) {
      setError("Enter a valid date (DD-MM-YYYY)");
      return;
    }

    const apiValue = displayDateToApi(normalized);
    if (!apiValue) {
      setError("Enter a valid date (DD-MM-YYYY)");
      return;
    }

    setError(null);
    setText(normalized);
    onChange(apiValue);
  };

  const handleChangeText = (next: string) => {
    setText(next);
    setError(null);
    if (/^\d{2}-\d{2}-\d{4}$/.test(next)) {
      commitText(next);
    }
  };

  const handlePickerChange = (date: string) => {
    setError(null);
    setText(formatDateString(date));
    onChange(date);
  };

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <TextInput
          style={[styles.input, inputStyle, !editable && styles.inputDisabled]}
          value={text}
          onChangeText={handleChangeText}
          onBlur={() => commitText(text)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          editable={editable}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {editable ? (
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.calendarButton}
            hitSlop={8}
            accessibilityLabel="Open calendar"
          >
            <Ionicons name="calendar-outline" size={22} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <DatePickerField
        visible={showPicker}
        value={value}
        onChange={handlePickerChange}
        onClose={() => setShowPicker(false)}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingRight: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    color: "#666",
  },
  calendarButton: {
    padding: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },
});
