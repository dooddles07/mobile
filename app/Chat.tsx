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
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  theme: string;
  colors: any;
}

// ============================================
// MESSAGE ITEM COMPONENT
// ============================================

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, theme, colors }) => {
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
        isUser ? styles.userMessage : { backgroundColor: colors.card, borderWidth: 1, borderColor: theme === 'dark' ? colors.border : '#e0e0e0' },
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
              <Ionicons name="videocam" size={48} color={colors.textSecondary} />
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
          <Ionicons name="mic" size={24} color={isUser ? "#fff" : "#14b8a6"} />
          <View style={styles.audioInfo}>
            <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }, isUser && styles.userMessageText]}>
              Voice message
            </Text>
            {message.mediaDuration && (
              <Text style={[{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }, isUser && styles.userMessageText]}>
                {formatDuration(message.mediaDuration)}
              </Text>
            )}
          </View>
          <Ionicons name="play" size={20} color={isUser ? "#fff" : "#14b8a6"} />
        </View>
      )}

      {/* Text (caption for media or standalone text) */}
      {message.text && (
        <Text style={[
          { fontSize: 15, color: colors.text, lineHeight: 20 },
          isUser && styles.userMessageText,
          message.messageType !== 'text' && styles.captionText
        ]}>
          {message.text}
        </Text>
      )}

      <Text style={[
        { fontSize: 11, color: colors.textTertiary, marginTop: 4, alignSelf: 'flex-end' },
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
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    conversationId?: string;
    adminName?: string;
  }>();
  const router = useRouter();

  const conversationId = params.conversationId;
  const adminName = params.adminName;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const pollingInterval = useRef<number | null>(null);
  const audioRecording = useRef<Audio.Recording | null>(null);
  const recordingInterval = useRef<number | null>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Check if conversationId is valid
    if (!conversationId || conversationId === 'undefined') {
      console.error('❌ No conversationId provided to Chat screen');
      console.log('Route params:', params);
      Alert.alert(
        'Error',
        'No conversation selected. Please select a conversation from the list.',
        [
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
      return;
    }

    console.log('✅ Chat screen opened with conversationId:', conversationId);
    fetchMessages();
    markMessagesAsRead();

    // Poll for new messages every 5 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages();
    }, 5000);

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

      // Handle both old format (direct array) and new format (wrapped in data property)
      const messagesData = Array.isArray(response.data) ? response.data : response.data.data;
      setMessages(messagesData || []);
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

      console.log('Sending message payload:', {
        conversationId: payload.conversationId,
        messageType: payload.messageType,
        mediaDuration: payload.mediaDuration,
        mediaSize: payload.mediaSize,
        mediaDataLength: payload.mediaData ? payload.mediaData.length : 0,
        mediaDataPrefix: payload.mediaData ? payload.mediaData.substring(0, 50) : null,
      });

      const response = await axios.post(
        `${API_BASE}/api/messages/send`,
        payload,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      // Extract the message data from response
      // Backend spreads document fields directly, so we need to exclude the success "message" field
      const { message: successMessage, ...rawMessageData } = response.data;

      // Handle Mongoose document format (with _doc) or plain object
      const messageData = rawMessageData._doc || rawMessageData;

      // Ensure the message has an _id for the key extractor
      if (messageData._id) {
        // Add new message to the list
        setMessages((prev) => [...prev, messageData]);
      } else {
        console.error('Received message without _id:', messageData);
        console.error('Raw response:', response.data);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      setSending(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);

      setSending(false);
      if (messageType === 'text') {
        setInput(trimmedInput); // Restore input on error for text messages
      }

      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'username']);
        router.replace('/');
      } else if (error.response?.status === 413) {
        Alert.alert('File Too Large', 'The file you are trying to send is too large. Please try a smaller file or compress it.');
      } else if (error.response?.status === 500) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Server error occurred';
        Alert.alert('Server Error', `The server encountered an error: ${errorMsg}`);
      } else {
        Alert.alert('Error', `Failed to send message: ${error.message || 'Please try again.'}`);
      }
    }
  }, [input, sending, conversationId, router]);

  // ============================================
  // MEDIA FUNCTIONS
  // ============================================

  // Audio recording functions using expo-av

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
        const size = asset.fileSize || 0;

        // Check file size before processing (5MB limit for images)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (size > maxSize) {
          Alert.alert(
            'File Too Large',
            `Image size is ${(size / (1024 * 1024)).toFixed(2)}MB. Please select an image smaller than 5MB.`
          );
          return;
        }

        const base64 = `data:image/jpeg;base64,${asset.base64}`;

        await sendMessage('image', base64, undefined, size);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const size = asset.fileSize || 0;

        // Check file size before processing (5MB limit for images)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (size > maxSize) {
          Alert.alert(
            'File Too Large',
            `Photo size is ${(size / (1024 * 1024)).toFixed(2)}MB. Please try a lower quality or compress it.`
          );
          return;
        }

        const base64 = `data:image/jpeg;base64,${asset.base64}`;

        await sendMessage('image', base64, undefined, size);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
        quality: 0.3, // Lower quality to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const size = asset.fileSize || 0;

        // Check file size before processing (10MB limit for videos)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (size > maxSize) {
          Alert.alert(
            'File Too Large',
            `Video size is ${(size / (1024 * 1024)).toFixed(2)}MB. Please select a video smaller than 10MB or compress it first.`
          );
          return;
        }

        // Show loading indicator for large files
        Alert.alert('Uploading', 'Please wait while your video is being processed...');

        // Read video file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        const dataUri = `data:video/mp4;base64,${base64}`;
        const duration = asset.duration || 0;

        await sendMessage('video', dataUri, duration / 1000, size); // Convert ms to seconds
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable microphone permissions to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      audioRecording.current = recording;
      setRecording(true);
      setRecordingTime(0);

      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      if (!audioRecording.current) {
        Alert.alert('Error', 'No active recording found.');
        setRecording(false);
        setRecordingTime(0);
        return;
      }

      await audioRecording.current.stopAndUnloadAsync();
      const uri = audioRecording.current.getURI();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setRecording(false);

      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        const dataUri = `data:audio/m4a;base64,${base64}`;
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const size = fileInfo.exists ? fileInfo.size : 0;

        await sendMessage('audio', dataUri, recordingTime, size);
      } else {
        Alert.alert('Error', 'Failed to save recording.');
      }

      audioRecording.current = null;
      setRecordingTime(0);

    } catch (error: any) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
      setRecording(false);
      setRecordingTime(0);
      audioRecording.current = null;
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      if (audioRecording.current) {
        await audioRecording.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
        audioRecording.current = null;
      }

      setRecording(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error canceling recording:', error);
      setRecording(false);
      setRecordingTime(0);
      audioRecording.current = null;
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // CALL FUNCTIONALITY
  // ============================================

  const handleCall = async () => {
    try {
      // Emergency hotline number for ResqYOU
      const emergencyNumber = '911'; // Default emergency number

      Alert.alert(
        'Make a Call',
        `Call emergency services or ResqYOU respondent?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Emergency (911)',
            onPress: async () => {
              const phoneUrl = `tel:${emergencyNumber}`;
              const canOpen = await Linking.canOpenURL(phoneUrl);

              if (canOpen) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Error', 'Unable to make phone calls on this device.');
              }
            }
          },
          {
            text: 'Respondent',
            onPress: () => {
              Alert.alert(
                'Contact Respondent',
                'Voice calling with respondents will be available soon. For now, please use the emergency hotline or continue chatting.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error initiating call:', error);
      Alert.alert('Error', 'Failed to initiate call. Please try again.');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} theme={theme} colors={colors} />
  ), [theme, colors]);

  const keyExtractor = useCallback((item: Message) => item._id, []);

  const handleInputSubmit = useCallback(() => {
    sendMessage('text');
    Keyboard.dismiss();
  }, [sendMessage]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Start the conversation by sending a message</Text>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme === 'dark' ? colors.background : '#f0fdfa' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: Math.max(insets.top + 12, 50) }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.headerBack}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{adminName || 'ResqYOU Respondents'}</Text>
          <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
            {messages.length > 0 ? 'Active' : 'Start conversation'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCall}
          style={styles.headerRight}
          accessible={true}
          accessibilityLabel="Call emergency or respondent"
          accessibilityRole="button"
        >
          <Ionicons name="call" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={messages.length === 0 ? [styles.emptyListContent, { paddingBottom: 20 }] : [styles.chatListContent, { paddingBottom: 20 }]}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={renderEmpty}
      />

      {/* Input Container */}
      {recording ? (
        /* Recording UI */
        <View style={[styles.recordingContainer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
            <Ionicons name="trash" size={24} color="#ff4444" />
          </TouchableOpacity>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={[styles.recordingText, { color: colors.text }]}>{formatRecordingTime(recordingTime)}</Text>
          </View>
          <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
            <Ionicons name="send" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Normal Input UI */
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          {/* Attachment Buttons */}
          <View style={[styles.attachmentBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={takePhoto} style={styles.attachmentButton}>
              <Ionicons name="camera" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={styles.attachmentButton}>
              <Ionicons name="image" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={styles.attachmentButton}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={startRecording} style={styles.attachmentButton}>
              <Ionicons name="mic" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[styles.input, {
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                borderWidth: 1,
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
              }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.placeholder}
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
                { backgroundColor: input.trim() && !sending ? '#14b8a6' : colors.border }
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
                  color={input.trim() && !sending ? "#fff" : colors.textTertiary}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
    backgroundColor: '#14b8a6',
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
  userTimestamp: {
    color: '#e0e0e0',
  },
  inputWrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  attachmentBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
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
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
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
  },
  cancelButton: {
    padding: 10,
  },
  stopButton: {
    padding: 10,
  },
});

export default Chat;
