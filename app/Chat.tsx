import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

// Types
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isUser: boolean;
}

interface MessageItemProps {
  message: Message;
}

// Separated Message Component
const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.supportMessage,
      ]}
    >
      {!message.isUser && (
        <Text style={styles.sender}>{message.sender}</Text>
      )}
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
    </View>
  );
});

MessageItem.displayName = 'MessageItem';

const Chat: React.FC = () => {
  const { name, userId } = useLocalSearchParams<{ name: string; userId: string }>();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      text: `Hi, this is ${name}. How can I help you?`, 
      sender: name as string,
      timestamp: new Date(),
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const sendMessage = useCallback(() => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput || isSending) return;

    setIsSending(true);
    
    const newMessage: Message = { 
      id: Date.now().toString(), 
      text: trimmedInput, 
      sender: "You",
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    
    // Simulate response (remove this in production with real API)
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. Someone will respond shortly.",
        sender: name as string,
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, autoReply]);
      setIsSending(false);
    }, 1000);
  }, [input, isSending, name]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleInputSubmit = useCallback(() => {
    sendMessage();
    Keyboard.dismiss();
  }, [sendMessage]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress} 
          style={styles.headerBack}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{name}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.chatListContent}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start a conversation</Text>
          </View>
        }
      />

      {/* Input Container */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleInputSubmit}
            returnKeyType="send"
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!input.trim() || isSending) && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!input.trim() || isSending}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={input.trim() && !isSending ? "#fff" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7e57c2',
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: '#e0e0e0',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  chatList: { 
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexGrow: 1,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '75%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#7e57c2',
    borderBottomRightRadius: 4,
  },
  supportMessage: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  sender: { 
    fontWeight: '600', 
    marginBottom: 4, 
    color: '#7e57c2',
    fontSize: 13,
  },
  messageText: { 
    color: '#333',
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: { 
    backgroundColor: '#7e57c2', 
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
    elevation: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default Chat;