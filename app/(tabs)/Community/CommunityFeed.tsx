import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const posts = [
  {
    id: 1,
    author: 'Dr Muhaimin',
    content: 'Today Adam said I want red car without prompting!',
    details: 'After 3 months of speech therapy and daily PECs work, he finally strung 4 words on his own. Cried happy tears. Just wanted to share hope 💙',
    hashtags: ['#milestone', '#speech', '#nonverbalToVerbal'],
    image: 'https://images.pexels.com/photos/4100422/pexels-photo-4100422.jpeg',
    emoji: '🥲❤️',
  },
  {
    id: 2,
    author: 'Dr Razman Kamil',
    content: 'How do you explain autism to a 4-year-old sibling?',
    details: 'My youngest is asking why big brother doesn\'t speak or play the same. Any books or ways that worked for you?',
    hashtags: ['#familySupport', '#siblings', '#questions'],
    image: 'https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg',
  },
  {
    id: 3,
    author: 'Dr Razman Kamil',
    content: 'How do you explain autism to a 4-year-old sibling?',
    details: 'My youngest is asking why big brother doesn\'t speak or play the same. Any books or ways that worked for you?',
    hashtags: ['#familySuboort', '#siblings', '#auestions'],
    image: 'https://images.pexels.com/photos/3662667/pexels-photo-3662667.jpeg',
  },
];

export default function CommunityFeed() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSupport = () => {
    router.push('/Community/CommunitySupport');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={{flex:1}}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack}><Text style={styles.backArrow}>{'<'}</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Community Feed</Text>
          <TouchableOpacity onPress={handleSupport}><Text style={styles.supportBtn}>Support</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.feedContainer}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postBox}>
              <View style={styles.postHeader}>
                <Text style={styles.author}>{post.author}</Text>
                <TouchableOpacity><Text style={styles.menuBtn}>⋯</Text></TouchableOpacity>
              </View>
              <Text style={styles.content}>{post.content} {post.emoji && <Text>{post.emoji}</Text>}</Text>
              <Text style={styles.details}>{post.details}</Text>
              <Text style={styles.hashtags}>{post.hashtags.join(' ')}</Text>
              <Image source={{ uri: post.image }} style={styles.postImage} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f3fc',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#e3f3fc',
    borderBottomWidth: 0,
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 26,
    color: '#222',
    fontWeight: 'bold',
    width: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32,
  },
  feedContainer: {
    padding: 18,
    paddingBottom: 32,
  },
  postBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
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
  menuBtn: {
    fontSize: 22,
    color: '#888',
    fontWeight: 'bold',
  },
  content: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  hashtags: {
    fontSize: 13,
    color: '#4db5ff',
    marginBottom: 8,
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