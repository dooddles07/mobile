/**
 * WebSocket Helper
 * Manages real-time communication with Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    // Get user info from storage - try multiple sources for userId
    let userId = null;
    let username = null;

    // Try to get from userData object first
    const userDataStr = await AsyncStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        userId = userData?.userId;
      } catch (e) {
        // Error parsing userData
      }
    }

    // Fallback: try to get userId directly
    if (!userId) {
      userId = await AsyncStorage.getItem('userId');
    }

    // Get username
    username = await AsyncStorage.getItem('username');

    // Socket will connect but won't join user room if no userId or username

    socket = io(API_ENDPOINTS.BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      // Join user's personal room for receiving SOS resolved notifications
      if (userId) {
        socket?.emit('join', userId);
        console.log(`📡 Joined room: ${userId}`);
      }

      // Also join by username as fallback
      if (username) {
        socket?.emit('join', `user-${username}`);
        console.log(`📡 Joined room: user-${username}`);
      }
    });

    socket.on('disconnect', (reason) => {
      // Socket disconnected
    });

    socket.on('connect_error', (error) => {
      // Socket connection error
    });

    socket.on('reconnect', async (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      // Rejoin user rooms after reconnection
      if (userId) {
        socket?.emit('join', userId);
        console.log(`📡 Rejoined room: ${userId}`);
      }

      if (username) {
        socket?.emit('join', `user-${username}`);
        console.log(`📡 Rejoined room: user-${username}`);
      }
    });

    return socket;
  } catch (error) {
    throw error;
  }
};

/**
 * Get the current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Listen for SOS resolved event
 * Removes any previous listeners to prevent duplicates
 */
export const onSOSResolved = (callback: (data: any) => void) => {
  console.log('👂 Setting up sos-resolved listener');
  // Remove all existing listeners first to prevent duplicates
  socket?.off('sos-resolved');
  // Register the new listener
  socket?.on('sos-resolved', (data) => {
    console.log('📥 Received sos-resolved event:', data);
    callback(data);
  });
};

/**
 * Listen for SOS cancelled event
 * Removes any previous listeners to prevent duplicates
 */
export const onSOSCancelled = (callback: (data: any) => void) => {
  console.log('👂 Setting up sos-cancelled listener');
  // Remove all existing listeners first to prevent duplicates
  socket?.off('sos-cancelled');
  // Register the new listener
  socket?.on('sos-cancelled', (data) => {
    console.log('📥 Received sos-cancelled event:', data);
    callback(data);
  });
};

/**
 * Listen for new messages
 */
export const onNewMessage = (callback: (data: any) => void) => {
  socket?.on('new-message', callback);
};

/**
 * Remove event listener
 */
export const removeListener = (event: string) => {
  socket?.off(event);
};

/**
 * Emit an event to the server
 */
export const emitEvent = (event: string, data: any) => {
  socket?.emit(event, data);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  onSOSResolved,
  onSOSCancelled,
  onNewMessage,
  removeListener,
  emitEvent,
};
