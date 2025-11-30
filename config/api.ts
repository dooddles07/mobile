/**
 * API Configuration
 * Central configuration for API endpoints
 * Defaults to production URL, can be overridden with EXPO_PUBLIC_API_URL environment variable
 */

// Production backend URL - change to local IP for development (e.g., 'http://192.168.100.6:10000')
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://resqyou-backend.onrender.com';

export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  AUTH: `${BASE_URL}/api/auth`,
  SOS: `${BASE_URL}/api/sos`,
  MESSAGES: `${BASE_URL}/api/messages`,
};

export default API_ENDPOINTS;
