import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Types
interface User {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
}

interface ChatListItemProps {
  user: User;
  onPress: (user: User) => void;
}

// Mock data - consider moving to a separate data file or API
const MOCK_USERS: User[] = [
  { id: "1", name: "VAWC Support", lastMessage: "How can we help you?", timestamp: "10:30 AM" },
  { id: "2", name: "Counselor Jane", lastMessage: "Take care of yourself", timestamp: "Yesterday" },
  { id: "3", name: "Legal Aid Team", lastMessage: "We're here to assist", timestamp: "2 days ago" },
];

// Separated component for better reusability
const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ user, onPress }) => (
  <TouchableOpacity 
    style={styles.chatCard} 
    onPress={() => onPress(user)}
    activeOpacity={0.7}
  >
    <View style={styles.chatHeader}>
      <Text style={styles.chatName}>{user.name}</Text>
      {user.timestamp && (
        <Text style={styles.timestamp}>{user.timestamp}</Text>
      )}
    </View>
    {user.lastMessage && (
      <Text style={styles.lastMessage} numberOfLines={1}>
        {user.lastMessage}
      </Text>
    )}
  </TouchableOpacity>
));

ChatListItem.displayName = 'ChatListItem';

const ChatList: React.FC = () => {
  const router = useRouter();

  const handleOpenChat = React.useCallback((user: User) => {
    router.push({ 
      pathname: "./Chat", 
      params: { userId: user.id, name: user.name } 
    });
  }, [router]);

  const handleBackPress = React.useCallback(() => {
    router.push("/Home");
  }, [router]);

  const renderItem = React.useCallback(({ item }: { item: User }) => (
    <ChatListItem user={item} onPress={handleOpenChat} />
  ), [handleOpenChat]);

  const keyExtractor = React.useCallback((item: User) => item.id, []);

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
        <Text style={styles.headerTitle}>Chats</Text>
        {/* Empty view for balanced spacing */}
        <View style={styles.headerRight} />
      </View>

      {/* Chat List */}
      <FlatList
        data={MOCK_USERS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats available</Text>
          </View>
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
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    paddingVertical: 10,
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
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333",
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default ChatList;