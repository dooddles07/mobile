/**
 * API Configuration
 * Central configuration for API endpoints
 * Uses EXPO_PUBLIC_API_URL environment variable for production, falls back to production URL
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://resqyou-backend.onrender.com';

export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  AUTH: `${BASE_URL}/api/auth`,
  SOS: `${BASE_URL}/api/sos`,
  MESSAGES: `${BASE_URL}/api/messages`,
};

export default API_ENDPOINTS;
