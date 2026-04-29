import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../../api';

export default function editFeed() {
  const params = useLocalSearchParams();
  const [title, setTitle] = useState(typeof params.title === 'string' ? params.title : '');
  const [content, setContent] = useState(typeof params.content === 'string' ? params.content : '');
  const [url, setUrl] = useState(typeof params.url === 'string' ? params.url : '');
  const [uploading, setUploading] = useState(false);



  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Please enter both title and content.');
      return;
    }

    try {
      setUploading(true);
      
      // Get user data to capture the practitioner's full name
      const storedData = await AsyncStorage.getItem('userData');
      if (!storedData) {
        Alert.alert('Error', 'User data not found. Please login again.');
        return;
      }

      const userData = JSON.parse(storedData);
      const communityAuthor = userData.fullName || userData.fullname || userData.username || 'Unknown Author';

      const response = await API(`apps/community/update?id=${params.id}`, {
        community_author: communityAuthor,
        community_title: title.trim(),
        community_content: content.trim(),
        community_url: url.trim() || null,
      }, 'PUT');

      if (response.statusCode === 200) {
        Alert.alert('Success!', 'Your post has been updated successfully.');
        router.back();
        // Trigger refresh by navigating to the community page with refresh parameter
        setTimeout(() => {
          router.push({
            pathname: '/therapistPage/community',
            params: { refresh: 'true' }
          });
        }, 100);
      } else {
        Alert.alert('Error', response.message || 'Failed to update post. Please try again.');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{backgroundColor: '#E1F5FF', justifyContent: 'flex-end'}}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Feed</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Card Form */}
      <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <TextInput
          style={styles.titleInput}
          placeholder="Post title..."
          placeholderTextColor="#A0A0A0"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TextInput
          style={styles.input}
          placeholder="What's on your mind? Share your thoughts..."
          placeholderTextColor="#A0A0A0"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
        />
        <TextInput
          style={styles.urlInput}
          placeholder="Optional: Add a link (URL)"
          placeholderTextColor="#A0A0A0"
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!title.trim() || !content.trim() || uploading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!title.trim() || !content.trim() || uploading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>{uploading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f3fc',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    gap: 18,
  },
  titleInput: {
    backgroundColor: '#f7fbfd',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    borderWidth: 1.5,
    borderColor: '#b6e0fa',
    marginBottom: 12,
  },
  input: {
    minHeight: 90,
    backgroundColor: '#f7fbfd',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    color: '#222',
    borderWidth: 1.5,
    borderColor: '#b6e0fa',
    marginBottom: 12,
  },
  urlInput: {
    backgroundColor: '#f7fbfd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#222',
    borderWidth: 1.5,
    borderColor: '#b6e0fa',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#0077B6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0077B6',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  submitBtnDisabled: {
    backgroundColor: '#b6e0fa',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});