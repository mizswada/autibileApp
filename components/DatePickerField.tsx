import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { formatApiDate, parseAnyLocalDate } from "@/utils/formatLocalDate";

type DatePickerFieldProps = {
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  presentation?: "modal" | "inline";
};

export function DatePickerField({
  value,
  visible,
  onChange,
  onClose,
  maximumDate,
  minimumDate,
  presentation = "modal",
}: DatePickerFieldProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#AEAEB2' : '#666666',
    border: isDark ? '#3A3A3C' : '#E0E0E0',
    accent: '#24A8FF',
  };

  const [pendingDate, setPendingDate] = useState(
    () => parseAnyLocalDate(value) ?? new Date(),
  );

  useEffect(() => {
    if (visible) {
      setPendingDate(parseAnyLocalDate(value) ?? new Date());
    }
  }, [visible, value]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "dismissed" || !selectedDate) return;
      onChange(formatApiDate(selectedDate));
      return;
    }
    if (selectedDate) {
      setPendingDate(selectedDate);
    }
  };

  const handleDone = () => {
    onChange(formatApiDate(pendingDate));
    onClose();
  };

  if (!visible) return null;

  if (Platform.OS === "ios") {
    const sheet = (
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[styles.cancel, { color: colors.subtext }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} hitSlop={8}>
            <Text style={[styles.done, { color: colors.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display="spinner"
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          textColor={colors.text}
        />
      </View>
    );

    if (presentation === "inline") {
      return sheet;
    }

    return (
      <Modal
        transparent
        statusBarTranslucent
        animationType="slide"
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>{sheet}</View>
      </Modal>
    );
  }

  return (
    <DateTimePicker
      value={parseAnyLocalDate(value) ?? new Date()}
      mode="date"
      display="default"
      onChange={handleChange}
      maximumDate={maximumDate}
      minimumDate={minimumDate}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    fontSize: 16,
  },
  done: {
    fontSize: 16,
    fontWeight: "600",
  },
});
