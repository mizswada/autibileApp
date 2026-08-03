import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../../../api';

interface CommunityPost {
  id: number;
  author: string;
  title: string;
  content: string;
  url?: string;
}

export default function CommunityFeed() {
  const tabBarPadding = useTabBarPadding();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const fetchCommunityPosts = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const response = await API('apps/community/list', {}, 'GET', false);

      if (Array.isArray(response)) {
        setPosts(response);
      } else {
        console.error('Invalid response format:', response);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching community posts:', error);
      setPosts([]);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityPosts(true);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSupport = () => {
    router.push('/Community/CommunitySupport');
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        <ScreenHeader
          title="News Update"
          onBack={handleBack}
          right={
            <TouchableOpacity onPress={handleSupport}>
              <Text style={styles.supportBtn}>Support</Text>
            </TouchableOpacity>
          }
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4db5ff" />
            <Text style={styles.loadingText}>Loading community posts...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <View style={styles.postBox}>
                <View style={styles.postHeader}>
                  <Text style={styles.author}>{item.author}</Text>
                </View>
                <Text style={styles.content}>{item.title}</Text>
                <Text style={styles.details}>{item.content}</Text>
                {item.url && item.url.trim() !== '' && (
                  <TouchableOpacity onPress={() => handleLinkPress(item.url!)}>
                    <Text style={styles.url}>Link: {item.url}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[styles.feedContainer, { paddingBottom: tabBarPadding }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4db5ff']}
                tintColor="#4db5ff"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No community posts yet</Text>
                <Text style={styles.emptySubtext}>
                  Pull down to refresh for new updates.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f3fc',
  },
  feedContainer: {
    padding: 18,
    paddingBottom: 32,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#222',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  postBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 1 },
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  content: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  url: {
    fontSize: 12,
    color: '#4db5ff',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  postImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: '#eee',
  },
  supportBtn: {
    fontSize: 16,
    color: '#4db5ff',
    fontWeight: 'bold',
  },
});
