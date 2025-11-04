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
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE = "http://192.168.100.6:10000"; // Your computer's IP address

// Types
interface Message {
  _id: string;
  conversationId: string;
  senderType: 'user' | 'admin';
  senderId: string;
  messageType: 'text' | 'image' | 'video' | 'audio';
  text?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaDuration?: number;
  isRead: boolean;
  createdAt: string;
}

interface MessageItemProps {
  message: Message;
}

// ============================================
// MESSAGE ITEM COMPONENT
// ============================================

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUser = message.senderType === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.supportMessage,
      ]}
    >
      {/* Image Message */}
      {message.messageType === 'image' && message.mediaUrl && (
        <Image
          source={{ uri: message.mediaUrl }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      )}

      {/* Video Message */}
      {message.messageType === 'video' && (
        <View style={styles.videoContainer}>
          {message.thumbnailUrl ? (
            <Image
              source={{ uri: message.thumbnailUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.messageImage, styles.videoPlaceholder]}>
              <Ionicons name="videocam" size={48} color="#fff" />
            </View>
          )}
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={48} color="#fff" />
          </View>
          {message.mediaDuration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(message.mediaDuration)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Audio Message */}
      {message.messageType === 'audio' && (
        <View style={styles.audioContainer}>
          <Ionicons name="mic" size={24} color={isUser ? "#fff" : "#7e57c2"} />
          <View style={styles.audioInfo}>
            <Text style={[styles.audioLabel, isUser && styles.userMessageText]}>
              Voice message
            </Text>
            {message.mediaDuration && (
              <Text style={[styles.audioDuration, isUser && styles.userMessageText]}>
                {formatDuration(message.mediaDuration)}
              </Text>
            )}
          </View>
          <Ionicons name="play" size={20} color={isUser ? "#fff" : "#7e57c2"} />
        </View>
      )}

      {/* Text (caption for media or standalone text) */}
      {message.text && (
        <Text style={[
          styles.messageText,
          isUser && styles.userMessageText,
          message.messageType !== 'text' && styles.captionText
        ]}>
          {message.text}
        </Text>
      )}

      <Text style={[
        styles.timestamp,
        isUser && styles.userTimestamp
      ]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
});

MessageItem.displayName = 'MessageItem';

// ============================================
// MAIN CHAT COMPONENT
// ============================================

const Chat: React.FC = () => {
  const { conversationId, adminName } = useLocalSearchParams<{
    conversationId: string;
    adminName: string;
  }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRecording = useRef<Audio.Recording | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    // Poll for new messages every 5 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    // Request audio permissions on mount
    requestAudioPermissions();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [conversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ============================================
  // API CALLS
  // ============================================

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/messages/conversation/${conversationId}?limit=100`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      setMessages(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setLoading(false);

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
      }
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.put(
        `${API_BASE}/api/messages/conversation/${conversationId}/read`,
        { readerType: 'user' },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = useCallback(async (
    messageType: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaData?: string,
    mediaDuration?: number,
    mediaSize?: number
  ) => {
    const trimmedInput = input.trim();

    if (messageType === 'text' && !trimmedInput) return;
    if (messageType !== 'text' && !mediaData) return;
    if (sending) return;

    setSending(true);
    setInput(""); // Clear input immediately for better UX

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setSending(false);
        router.replace('/');
        return;
      }

      const payload: any = {
        conversationId,
        senderType: 'user',
        messageType,
      };

      if (messageType === 'text') {
        payload.text = trimmedInput;
      } else {
        payload.mediaData = mediaData;
        if (trimmedInput) payload.text = trimmedInput; // Caption for media
        if (mediaDuration) payload.mediaDuration = mediaDuration;
        if (mediaSize) payload.mediaSize = mediaSize;
      }

      const response = await axios.post(
        `${API_BASE}/api/messages/send`,
        payload,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      // Add new message to the list
      setMessages((prev) => [...prev, response.data]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      setSending(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setSending(false);
      if (messageType === 'text') {
        setInput(trimmedInput); // Restore input on error for text messages
      }

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }
  }, [input, sending, conversationId, router]);

  // ============================================
  // MEDIA FUNCTIONS
  // ============================================

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Microphone permission denied');
      }
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable photo library permissions to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = `data:image/jpeg;base64,${asset.base64}`;
        const size = asset.fileSize || 0;

        await sendMessage('image', base64, undefined, size);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable photo library permissions to send videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Read video file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        const dataUri = `data:video/mp4;base64,${base64}`;
        const duration = asset.duration || 0;
        const size = asset.fileSize || 0;

        await sendMessage('video', dataUri, duration / 1000, size); // Convert ms to seconds
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable microphone permissions.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      audioRecording.current = recording;
      setRecording(true);
      setRecordingTime(0);

      // Update recording time every second
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!audioRecording.current) return;

      setRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      await audioRecording.current.stopAndUnloadAsync();
      const uri = audioRecording.current.getURI();

      if (uri) {
        // Read audio file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        const dataUri = `data:audio/m4a;base64,${base64}`;
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const size = fileInfo.exists ? fileInfo.size : 0;

        await sendMessage('audio', dataUri, recordingTime, size);
      }

      audioRecording.current = null;
      setRecordingTime(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const cancelRecording = async () => {
    try {
      if (audioRecording.current) {
        await audioRecording.current.stopAndUnloadAsync();
        audioRecording.current = null;
      }
      setRecording(false);
      setRecordingTime(0);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} />
  ), []);

  const keyExtractor = useCallback((item: Message) => item._id, []);

  const handleInputSubmit = useCallback(() => {
    sendMessage('text');
    Keyboard.dismiss();
  }, [sendMessage]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start the conversation by sending a message</Text>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e57c2" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{adminName || 'ResqYOU Respondents'}</Text>
          <Text style={styles.headerStatus}>
            {messages.length > 0 ? 'Active' : 'Start conversation'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={messages.length === 0 ? styles.emptyListContent : styles.chatListContent}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={renderEmpty}
      />

      {/* Input Container */}
      {recording ? (
        /* Recording UI */
        <View style={styles.recordingContainer}>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
            <Ionicons name="trash" size={24} color="#ff4444" />
          </TouchableOpacity>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{formatRecordingTime(recordingTime)}</Text>
          </View>
          <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
            <Ionicons name="send" size={24} color="#7e57c2" />
          </TouchableOpacity>
        </View>
      ) : (
        /* Normal Input UI */
        <View style={styles.inputWrapper}>
          {/* Attachment Buttons */}
          <View style={styles.attachmentBar}>
            <TouchableOpacity onPress={pickImage} style={styles.attachmentButton}>
              <Ionicons name="image" size={24} color="#7e57c2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={styles.attachmentButton}>
              <Ionicons name="videocam" size={24} color="#7e57c2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={startRecording} style={styles.attachmentButton}>
              <Ionicons name="mic" size={24} color="#7e57c2" />
            </TouchableOpacity>
          </View>

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
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage('text')}
              disabled={!input.trim() || sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={input.trim() && !sending ? "#fff" : "#ccc"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7e57c2',
  },
  supportMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  captionText: {
    marginTop: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    position: 'relative',
  },
  videoPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 12,
  },
  audioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#e0e0e0',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  attachmentBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7e57c2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4444',
    marginRight: 10,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    padding: 10,
  },
  stopButton: {
    padding: 10,
  },
});

export default Chat;
