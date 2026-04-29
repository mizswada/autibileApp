import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const router = useRouter();
  const params = useLocalSearchParams();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMenuVisible, setMenuVisible] = React.useState(false);
  const [selectedPostId, setSelectedPostId] = React.useState<number | null>(null);

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  // Listen for refresh parameter
  useEffect(() => {
    if (params.refresh === 'true') {
      fetchCommunityPosts();
    }
  }, [params.refresh]);

  const fetchCommunityPosts = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSupport = () => {
    //router.push('/Community/CommunitySupport');
  };

  const openMenu = (postId: number) => {
    setSelectedPostId(postId);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedPostId(null);
  };

  const handleEdit = () => {
    if (selectedPostId !== null) {
      const post = posts.find((p) => p.id === selectedPostId);
      if (post) {
        router.push({
          pathname: '/community-feed/editFeed',
          params: {
            id: post.id.toString(),
            author: post.author,
            title: post.title,
            content: post.content,
            url: post.url || '',
          },
        });
      }
    }
    closeMenu();
  };

  const handleDelete = async () => {
    if (selectedPostId !== null) {
      // Show confirmation dialog first
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => closeMenu()
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await API(`apps/community/delete?id=${selectedPostId}`, {}, 'DELETE');
                
                if (response.statusCode === 200) {
                  Alert.alert('Success', 'Post deleted successfully');
                  // Refresh the feed after deletion
                  fetchCommunityPosts();
                } else {
                  Alert.alert('Error', response.message || 'Failed to delete post');
                }
              } catch (error) {
                console.error('Error deleting post:', error);
                Alert.alert('Error', 'Failed to delete post. Please try again.');
              }
              closeMenu();
            }
          }
        ]
      );
    }
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
      {/* Header */}
      <View style={{backgroundColor: '#4db5ff', justifyContent: 'flex-end'}}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Text style={styles.headerTitle}>Community Feed</Text>
            </View>

            <TouchableOpacity onPress={() => router.push({
               pathname: '/community-feed/addFeed',
               params: { returnPath: '/doctorPage/community' }
             })}>
               <Ionicons name="add" size={26} color="#333" />
             </TouchableOpacity>
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
            <View key={item.id} style={styles.postBox}>
              <View style={styles.postHeader}>
                <Text style={styles.author}>{item.author}</Text>
                <TouchableOpacity onPress={() => openMenu(item.id)}><Text style={styles.menuBtn}>⋯</Text></TouchableOpacity>
              </View>
              <Text style={styles.content}>{item.title}</Text>
              <Text style={styles.details}>{item.content}</Text>
              {item.url && (
                <TouchableOpacity onPress={() => handleLinkPress(item.url!)}>
                  <Text style={styles.url}>Link: {item.url}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No community posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your experience!</Text>
            </View>
          }
        />
      )}

      {/* Action Sheet Modal */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable onPress={closeMenu} style={{ flex: 1, paddingBottom:20, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)', alignItems:'center', }}>
            <View style={{ padding: 16, alignItems:'center', width:'100%', gap:8 }}>
            
            <View style={[styles.sectionBottomSheet, {marginBottom:2}]}>
                <TouchableOpacity onPress={handleDelete} style={{paddingVertical: 13, alignItems:'center', borderBottomColor: '#ccc', borderBottomWidth:0.5, width:'100%'}}>
                    <Text style={{ fontSize:16,  color: '#e74c3c',  }}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEdit} style={{paddingVertical: 13, alignItems:'center', width:'100%'}}>
                    <Text style={{ fontSize:16,  color: '#4db5ff',  }}>Edit</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sectionBottomSheet} onPress={() => closeMenu()}>
                <Text style={{ fontSize:16, paddingVertical: 13, color: '#4db5ff', fontWeight:'bold' }}>Cancel</Text>
            </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
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
    color: '#1E293B',
  },
  feedContainer: {
    paddingHorizontal: 18,
    marginTop: 18,
    paddingBottom: 90,
  },
  postBox: {
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
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  author: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4db5ff',
  },
  menuBtn: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  content: {
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 2,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
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
  sectionBottomSheet: {
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
}); 