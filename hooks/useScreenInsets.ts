import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_EXTRA = 16;
const AUTH_EXTRA = 24;

export function useScreenInsets() {
  const insets = useSafeAreaInsets();

  return {
    headerPaddingTop: insets.top + HEADER_EXTRA,
    authPaddingTop: insets.top + AUTH_EXTRA,
    bottomInset: insets.bottom,
  };
}
