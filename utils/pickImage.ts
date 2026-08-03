import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Platform } from "react-native";

type PickImageOptions = {
  quality?: number;
  base64?: boolean;
  allowsEditing?: boolean;
  aspect?: [number, number];
};

type PickImageResult =
  | { canceled: true }
  | { canceled: false; uri: string; base64?: string };

export async function pickImageFromLibrary(
  options: PickImageOptions = {},
): Promise<PickImageResult> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Photo access required",
      "Please allow photo library access in Settings to choose an image.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    );
    return { canceled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    base64: options.base64 ?? false,
    quality: options.quality ?? 0.7,
    allowsEditing: options.allowsEditing,
    aspect: options.aspect,
  });

  if (result.canceled || !result.assets?.length) {
    return { canceled: true };
  }

  const asset = result.assets[0];
  return {
    canceled: false,
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
  };
}
