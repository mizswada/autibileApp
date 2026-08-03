import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";

/** Extra bottom padding so content clears the floating iOS tab bar. */
export function useTabBarPadding(extra = 16): number {
  const tabBarHeight = useBottomTabBarHeight();
  return Platform.OS === "ios" ? tabBarHeight + extra : extra;
}
