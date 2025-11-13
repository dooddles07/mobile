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
        console.error('Error parsing userData:', e);
      }
    }

    // Fallback: try to get userId directly
    if (!userId) {
      userId = await AsyncStorage.getItem('userId');
    }

    // Get username
    username = await AsyncStorage.getItem('username');

    if (!userId && !username) {
      console.warn('⚠️ No userId or username found in storage. Socket will connect but won\'t join user room.');
    }

    socket = io(API_ENDPOINTS.BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);

      // Join user's personal room for receiving SOS resolved notifications
      if (userId) {
        socket?.emit('join', userId);
        console.log('✅ Joined personal room with userId:', userId);
      }

      // Also join by username as fallback
      if (username) {
        socket?.emit('join', `user-${username}`);
        console.log('✅ Joined username room:', `user-${username}`);
      }

      if (!userId && !username) {
        console.warn('⚠️ Cannot join personal room - no userId or username available');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('reconnect', async (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);

      // Rejoin user rooms after reconnection
      if (userId) {
        socket?.emit('join', userId);
        console.log('✅ Rejoined personal room after reconnection');
      }

      if (username) {
        socket?.emit('join', `user-${username}`);
        console.log('✅ Rejoined username room after reconnection');
      }
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
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
    console.log('Socket disconnected manually');
  }
};

/**
 * Listen for SOS resolved event
 */
export const onSOSResolved = (callback: (data: any) => void) => {
  socket?.on('sos-resolved', callback);
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
  onNewMessage,
  removeListener,
  emitEvent,
};
