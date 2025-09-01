"use client";

/**
 * SignalR Configuration
 * 
 * This automatically switches between development and production backends:
 * - Development (localhost): Uses local backend at http://localhost:5006
 * - Production (deployed): Uses Azure backend
 * 
 * To deploy:
 * 1. Update the BACKEND_URL below with your Azure deployment URL
 * 2. Make sure the backend CORS policy allows your frontend domain
 * 3. Deploy both frontend and backend
 */

// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development' || 
                      (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// Backend configuration
const config = {
  // Use Azure backend in production, localhost in development
  BACKEND_URL: isDevelopment 
    ? "http://localhost:5006"
    : "https://signalr-web-app-h8hkfddehthdbzhm.eastasia-01.azurewebsites.net",
  
  // SignalR Hub endpoints
  CHAT_HUB: "/chathub",
  GRID_HUB: "/gridhub",
  
  // Environment info
  isDevelopment,
};

export default config;