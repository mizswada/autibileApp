import { Image, StyleSheet, View } from "react-native";

type AuthLogoProps = {
  width?: number;
  height?: number;
};

export function AuthLogo({ width = 220, height = 56 }: AuthLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo-word-black.png")}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel="Autibile logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
});
