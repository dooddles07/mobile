/**
 * API Configuration
 * Central configuration for API endpoints
 */

const BASE_URL = 'http://192.168.100.6:10000';

export const API_ENDPOINTS = {
  BASE_URL: BASE_URL,
  AUTH: `${BASE_URL}/api/auth`,
  SOS: `${BASE_URL}/api/sos`,
  MESSAGES: `${BASE_URL}/api/messages`,
};

export default API_ENDPOINTS;
