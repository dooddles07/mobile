/**
 * API Configuration
 * Central configuration for API endpoints
 * 🔒 SECURITY: API URL must be set in .env file
 * Set EXPO_PUBLIC_API_URL environment variable
 */

// 🔒 SECURITY: Require environment variable to be set
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.error('❌ EXPO_PUBLIC_API_URL environment variable is required!');
  console.error('   Please add EXPO_PUBLIC_API_URL to your .env file');
  console.error('   Example: EXPO_PUBLIC_API_URL=http://your-backend-url:10000');
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  AUTH: `${BASE_URL}/api/auth`,
  SOS: `${BASE_URL}/api/sos`,
  MESSAGES: `${BASE_URL}/api/messages`,
};

export default API_ENDPOINTS;
