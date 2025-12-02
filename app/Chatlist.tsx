import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API_ENDPOINTS from '../config/api';

const API_BASE = API_ENDPOINTS.BASE_URL;

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
  const { theme, colors } = useTheme();

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
        {
          backgroundColor: '#FFF9E5',
          borderWidth: 2,
          borderColor: '#FFE4A3'
        },
        conversation.unreadCountUser > 0 && {
          backgroundColor: '#FFE8E8',
          borderLeftWidth: 4,
          borderLeftColor: '#E74C3C',
          borderColor: '#FFB8B8'
        }
      ]}
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatNameContainer}>
          <Text style={[styles.chatName, {
            color: conversation.unreadCountUser > 0 ? '#8B1A1A' : '#8B6914',
            fontWeight: '700'
          }]}>
            {conversation.adminName || 'ResqYOU Support'}
          </Text>
          {conversation.unreadCountUser > 0 && (
            <View style={[styles.unreadBadge, {
              backgroundColor: '#E74C3C',
              shadowColor: '#E74C3C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3
            }]}>
              <Text style={styles.unreadBadgeText}>{conversation.unreadCountUser}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.timestamp, {
          color: conversation.unreadCountUser > 0 ? '#A83232' : '#A0753D',
          fontWeight: '600'
        }]}>{formatTime(conversation.lastMessageTime)}</Text>
      </View>
      <Text style={[styles.lastMessage, {
        color: conversation.unreadCountUser > 0 ? '#8B1A1A' : '#8B6914',
        fontWeight: '500'
      }]} numberOfLines={1}>
        {conversation.lastMessage || 'No messages yet'}
      </Text>
      {conversation.status === 'archived' && (
        <Text style={[styles.archivedText, { color: '#FFB84D', fontWeight: '600' }]}>Archived</Text>
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
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  // ============================================
  // INITIALIZATION & DATA LOADING
  // ============================================

  useEffect(() => {
    fetchConversations();

    // Poll for new messages every 15 seconds (reduced frequency)
    const interval = setInterval(() => {
      fetchConversations();
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================
  // API CALLS
  // ============================================

  const fetchConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/messages/conversations/user`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        }
      );

      // Handle both old format (direct array) and new format (wrapped in data property)
      const conversationsData = Array.isArray(response.data) ? response.data : response.data.data;

      setConversations(conversationsData || []);
      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
      setLoading(false);
      setRefreshing(false);

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
      }
    }
  };

  const getOrCreateConversation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        router.replace('/');
        return null;
      }

      // The backend will get userId from the token, so we don't need to pass it explicitly
      const response = await axios.post(
        `${API_BASE}/api/messages/conversation`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating conversation:', error.message);

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
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
    // Prevent multiple clicks
    if (creatingChat) {
      return;
    }

    setCreatingChat(true);

    try {
      const conversation = await getOrCreateConversation();

      if (!conversation) {
        Alert.alert('Error', 'Failed to create conversation. Please try again.');
        return;
      }

      if (!conversation._id) {
        console.error('Conversation object missing _id property');
        Alert.alert('Error', 'Failed to create conversation. Please try again.');
        return;
      }

      // Use replace instead of push to avoid stacking multiple screens
      router.replace({
        pathname: "./Chat",
        params: {
          conversationId: conversation._id,
          adminName: conversation.adminName || 'ResqYOU Support'
        }
      });
    } finally {
      setCreatingChat(false);
    }
  }, [router, creatingChat]);

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
      <View style={{
        backgroundColor: '#FFF5E6',
        padding: 20,
        borderRadius: 50,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#FFD4A3'
      }}>
        <Ionicons name="chatbubbles-outline" size={64} color="#FF8C00" />
      </View>
      <Text style={[styles.emptyText, { color: '#5D4E37', fontWeight: '700' }]}>No conversations yet</Text>
      <Text style={[styles.emptySubtext, { color: '#8B6914', fontWeight: '500' }]}>Start a conversation with ResqYOU support</Text>
      <TouchableOpacity
        style={[
          styles.startChatButton,
          {
            backgroundColor: '#FFB84D',
            shadowColor: '#FF8C00',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          },
          creatingChat && styles.startChatButtonDisabled
        ]}
        onPress={handleStartNewChat}
        disabled={creatingChat}
        activeOpacity={0.7}
      >
        {creatingChat ? (
          <>
            <ActivityIndicator size={24} color="#fff" />
            <Text style={[styles.startChatButtonText, { fontWeight: '700' }]}>Creating...</Text>
          </>
        ) : (
          <>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={[styles.startChatButtonText, { fontWeight: '700' }]}>Start Chat</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  const gradientColors: readonly [string, string, string] = theme === 'light'
    ? ["rgba(254, 242, 242, 0.3)", "rgba(254, 226, 226, 0.3)", "rgba(254, 202, 202, 0.3)"]
    : ["rgba(15, 23, 42, 0.3)", "rgba(30, 41, 59, 0.3)", "rgba(51, 65, 85, 0.3)"];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#fcc585' }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.loadingContainer}
        >
          <View style={{
            backgroundColor: '#FFF9E5',
            padding: 30,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: '#FFD4A3',
            alignItems: 'center'
          }}>
            <ActivityIndicator size="large" color="#FF8C00" />
            <Text style={[styles.loadingText, { color: '#5D4E37', fontWeight: '600' }]}>Loading conversations...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#fcc585' }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
      >
        {/* Header */}
      <View style={[styles.header, {
        backgroundColor: '#FFF5E6',
        paddingTop: Math.max(insets.top + 10, 50),
        borderBottomWidth: 2,
        borderBottomColor: '#FFD4A3'
      }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={[styles.headerBack, {
            backgroundColor: '#FFF9E5',
            borderRadius: 10
          }]}
          accessible={true}
          accessibilityLabel="Go back to home"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#8B5A00" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: '#5D4E37', fontWeight: '700' }]}>Messages</Text>
          <Text style={[styles.headerSubtitle, { color: '#8B6914', fontWeight: '600' }]}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Chat List */}
      <FlatList
        data={conversations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={conversations.length === 0 ? [styles.emptyListContent, { paddingBottom: Math.max(insets.bottom + 10, 20) }] : [styles.listContent, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  },
  unreadBadge: {
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
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
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
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startChatButtonDisabled: {
    opacity: 0.6,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default ChatList;
