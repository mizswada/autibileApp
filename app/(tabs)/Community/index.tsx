import { Text, View, StyleSheet } from 'react-native';

export default function CommunityIndex() {
  return (
  //<Redirect href="/Community/CommunityFeed" />;
  <View style={styles.container}>
    <Text>Community</Text>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
}); 