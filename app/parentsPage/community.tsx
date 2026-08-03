import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../../api';

interface CommunityPost {
  id: number;
  author: string;
  title: string;
  content: string;
  url?: string;
}

export default function CommunityFeed() {
  const params = useLocalSearchParams();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  useEffect(() => {
    if (params.refresh === 'true') {
      fetchCommunityPosts(true);
    }
  }, [params.refresh]);

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

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={{backgroundColor: '#4db5ff', justifyContent: 'flex-end'}}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text style={styles.headerTitle}>News Update</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={styles.loadingText}>Loading community posts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{backgroundColor: '#4db5ff', justifyContent: 'flex-end'}}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Text style={styles.headerTitle}>News Update</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={styles.loadingText}>Loading community posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <View key={item.id} style={styles.postCard}>
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
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4db5ff']}
              tintColor="#4db5ff"
            />
          }
          ListHeaderComponent={
            <Text style={styles.introText}>
              Read the latest updates and share your experiences with the community.
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No community posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your experience!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedContainer: {
    paddingHorizontal: 18,
    marginTop: 18,
    paddingBottom: 90,
  },
  introText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
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
    color: '#1E293B',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4db5ff',
  },
  content: {
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 6,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  url: {
    fontSize: 12,
    color: '#4db5ff',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});
