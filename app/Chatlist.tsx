import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE = "http://192.168.100.6:10000"; // Your computer's IP address

// Types
interface Conversation {
  _id: string;
  adminId: string | null;
  adminName: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountUser: number;
  status: string;
}

interface ChatListItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

// ============================================
// CHAT LIST ITEM COMPONENT
// ============================================

const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ conversation, onPress }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={[
        styles.chatCard,
        conversation.unreadCountUser > 0 && styles.unreadCard
      ]}
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatNameContainer}>
          <Text style={styles.chatName}>
            {conversation.adminName || 'ResqYOU Support'}
          </Text>
          {conversation.unreadCountUser > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{conversation.unreadCountUser}</Text>
            </View>
          )}
        </View>
        <Text style={styles.timestamp}>{formatTime(conversation.lastMessageTime)}</Text>
      </View>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {conversation.lastMessage || 'No messages yet'}
      </Text>
      {conversation.status === 'archived' && (
        <Text style={styles.archivedText}>Archived</Text>
      )}
    </TouchableOpacity>
  );
});

ChatListItem.displayName = 'ChatListItem';

// ============================================
// MAIN CHAT LIST COMPONENT
// ============================================

const ChatList: React.FC = () => {
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // INITIALIZATION & DATA LOADING
  // ============================================

  useEffect(() => {
    console.log('ChatList mounted, fetching conversations...');
    fetchConversations();

    // Poll for new messages every 15 seconds (reduced frequency)
    const interval = setInterval(() => {
      console.log('Polling for new conversations...');
      fetchConversations();
    }, 15000);

    return () => {
      console.log('ChatList unmounted, clearing interval');
      clearInterval(interval);
    };
  }, []);

  // ============================================
  // API CALLS
  // ============================================

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations from:', `${API_BASE}/api/messages/conversations/user`);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('No token found, redirecting to login');
        router.replace('/');
        return;
      }

      console.log('Token found, making API request...');
      const startTime = Date.now();

      const response = await axios.get(
        `${API_BASE}/api/messages/conversations/user`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000, // 10 second timeout
        }
      );

      const endTime = Date.now();
      console.log(`API request completed in ${endTime - startTime}ms`);
      console.log(`Found ${response.data.length} conversations`);

      setConversations(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      setLoading(false);
      setRefreshing(false);

      if (error.code === 'ECONNABORTED') {
        console.log('❌ Request timed out - server might be slow or not responding');
      } else if (error.response?.status === 401) {
        console.log('❌ Authentication failed - token expired');
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
      } else if (error.message === 'Network Error') {
        console.log('❌ Network error - Cannot reach server at:', API_BASE);
        console.log('Make sure:');
        console.log('1. Backend server is running on port 10000');
        console.log('2. API_BASE IP matches your computer IP');
        console.log('3. Mobile device is on same network as server');
      }
    }
  };

  const getOrCreateConversation = async () => {
    try {
      console.log('📝 Creating new conversation...');
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found when creating conversation');
        router.replace('/');
        return null;
      }

      console.log('✅ Token found, making POST request to:', `${API_BASE}/api/messages/conversation`);
      const startTime = Date.now();

      // The backend will get userId from the token, so we don't need to pass it explicitly
      const response = await axios.post(
        `${API_BASE}/api/messages/conversation`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000, // 10 second timeout
        }
      );

      const endTime = Date.now();
      console.log(`✅ Conversation created successfully in ${endTime - startTime}ms`);
      console.log('Conversation data:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating conversation:');
      console.error('Error message:', error.message);

      if (error.response) {
        // Server responded with error
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);

        // Show user-friendly error message
        if (error.response.status === 401) {
          console.log('Authentication failed - redirecting to login');
          await AsyncStorage.multiRemove(['token', 'username']);
          router.replace('/');
        } else if (error.response.status === 400) {
          console.log('Bad request:', error.response.data.message);
        } else if (error.response.status === 500) {
          console.log('Server error:', error.response.data.message);
        }
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received from server');
        console.error('Request:', error.request);
        console.log('❌ Network error - server might be down or unreachable');
      } else {
        // Error in request setup
        console.error('Error setting up request:', error.message);
      }

      return null;
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenChat = useCallback(async (conversation: Conversation) => {
    router.push({
      pathname: "./Chat",
      params: {
        conversationId: conversation._id,
        adminName: conversation.adminName || 'ResqYOU Support'
      }
    });
  }, [router]);

  const handleStartNewChat = useCallback(async () => {
    const conversation = await getOrCreateConversation();
    if (conversation) {
      router.push({
        pathname: "./Chat",
        params: {
          conversationId: conversation._id,
          adminName: conversation.adminName || 'ResqYOU Support'
        }
      });
    }
  }, [router]);

  const handleBackPress = useCallback(() => {
    router.push("/Home");
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderItem = useCallback(({ item }: { item: Conversation }) => (
    <ChatListItem conversation={item} onPress={handleOpenChat} />
  ), [handleOpenChat]);

  const keyExtractor = useCallback((item: Conversation) => item._id, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <Text style={styles.emptySubtext}>Start a conversation with ResqYOU support</Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={handleStartNewChat}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.startChatButtonText}>Start Chat</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e57c2" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.headerBack}
          accessible={true}
          accessibilityLabel="Go back to home"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={handleStartNewChat}
        >
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={conversations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={conversations.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7e57c2']}
            tintColor="#7e57c2"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f5f5f5"
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#7e57c2",
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerBack: {
    padding: 4,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 10,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  chatCard: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadCard: {
    backgroundColor: "#f0f4ff",
    borderLeftWidth: 4,
    borderLeftColor: "#7e57c2",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  unreadBadge: {
    backgroundColor: '#7e57c2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  archivedText: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: "#666",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: 'center',
    marginBottom: 20,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7e57c2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChatList;
