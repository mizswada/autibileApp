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
} from "react-native";
import { formatApiDate, parseAnyLocalDate } from "@/utils/formatLocalDate";

type DatePickerFieldProps = {
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
};

export function DatePickerField({
  value,
  visible,
  onChange,
  onClose,
  maximumDate,
  minimumDate,
}: DatePickerFieldProps) {
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
    return (
      <Modal
        transparent
        statusBarTranslucent
        animationType="slide"
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.toolbar}>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDone} hitSlop={8}>
                <Text style={styles.done}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
            />
          </View>
        </View>
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
    backgroundColor: "#fff",
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
    borderBottomColor: "#E5E7EB",
  },
  cancel: {
    fontSize: 16,
    color: "#666",
  },
  done: {
    fontSize: 16,
    fontWeight: "600",
    color: "#24A8FF",
  },
});
