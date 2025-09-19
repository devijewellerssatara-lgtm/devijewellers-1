# DEVI JEWELLERS - Gold Rate Management System

A comprehensive jewelry store management system with real-time gold/silver rate displays, mobile controls, and media management capabilities.

## 🏆 Features

### 📺 TV Display
- **Real-time Rate Display**: Live gold (24K, 22K, 18K) and silver rates
- **Professional UI**: Gold-themed interface with company branding
- **Promotional Slideshow**: Rotating promotional images below silver rates
- **Media Rotation**: Alternating between rates and promotional videos/images
- **Live Clock**: Real-time date and time display
- **Responsive Design**: Supports both landscape and portrait orientations

### 📱 Mobile Control Panel
- **Rate Management**: Update gold and silver rates in real-time
- **Form Validation**: Comprehensive input validation and error handling
- **Instant Updates**: Changes reflect immediately on TV display
- **Touch-Optimized**: Designed for mobile and tablet use
- **Status Monitoring**: View current rates and last update times

### ⚙️ Admin Dashboard
- **Display Configuration**: Orientation, font sizes, timing settings
- **Color Customization**: Background, text, and accent color controls
- **Quick Presets**: Pre-configured color themes
- **System Monitoring**: Server status, storage usage, connected devices
- **Settings Persistence**: All configurations saved to database

### 🎬 Media Manager
- **File Upload**: Drag-and-drop interface for videos and images
- **Media Library**: Organized grid view of all promotional content
- **Playback Controls**: Preview videos and images before activation
- **Bulk Operations**: Activate, deactivate, delete multiple items
- **Order Management**: Custom display order and duration settings

### 🖼️ Promo Manager
- **Image Slideshow**: Dedicated promotional image management
- **Transition Effects**: 10+ transition animations (fade, slide, zoom, etc.)
- **Preview Mode**: Real-time slideshow preview
- **Duration Control**: Individual timing for each image
- **Order Customization**: Drag-and-drop reordering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- 2GB free disk space
- Network access for mobile devices

### Local Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd devi-jewellers
npm install
```

## Vercel Deployment and Environment Variables

To operate securely in production (e.g., https://www.devi-jewellers.com), configure these environment variables in Vercel.

Server (API) environment variables:
- DATABASE_URL: Your Postgres connection string
- RATE_UPDATE_TOKEN: A long, random token to authorize POST /api/rates
- CORS_ALLOW_ORIGIN: Comma-separated list of allowed origins that can call the API from browsers. Example:
  https://www.devi-jewellers.com,https://admin.devi-jewellers.com

Notes:
- The server will block API requests from browser Origins not in CORS_ALLOW_ORIGIN.
- Preflight OPTIONS requests are handled automatically.

Client (UI) environment variables:
- VITE_API_BASE_URL: Base URL to target the production API from an admin/mobile UI hosted elsewhere. Example:
  VITE_API_BASE_URL=https://www.devi-jewellers.com
- VITE_RATE_UPDATE_TOKEN: The same value as RATE_UPDATE_TOKEN to authorize protected endpoints from the client.

Where to set them in Vercel:
- Project Settings → Environment Variables
- Add the keys listed above under the correct environment (Production/Preview/Development)
- Trigger a redeploy after changes

## Secure Rate Updates

- The endpoint POST /api/rates now requires an Authorization header:
  Authorization: Bearer <RATE_UPDATE_TOKEN>

- The client has built-in support:
  - If VITE_RATE_UPDATE_TOKEN is set in the client build, it will automatically include the Authorization header for writes (e.g., updating rates).
  - If you run the admin/mobile UI from a different origin than the API, set:
    - VITE_API_BASE_URL to the API domain (e.g., https://www.devi-jewellers.com)
    - Ensure that the API’s CORS_ALLOW_ORIGIN includes the admin UI origin

Example flows:

1) Update rates from the production site itself:
- Navigate to https://www.devi-jewellers.com/mobile-control
- Fill in rates and submit
- The app sends POST /api/rates with the token (if provided at build time)

2) Update rates from a separate admin domain:
- Host the admin UI at, say, https://admin.devi-jewellers.com
- Set in that UI build:
  - VITE_API_BASE_URL=https://www.devi-jewellers.com
  - VITE_RATE_UPDATE_TOKEN=<same as server RATE_UPDATE_TOKEN>
- On the API (production) set:
  - CORS_ALLOW_ORIGIN=https://admin.devi-jewellers.com
- Deploy both, then use the admin UI to update rates securely

## Troubleshooting

- 401 Unauthorized on POST /api/rates:
  - RATE_UPDATE_TOKEN missing on server, or client didn’t send Authorization header
  - Check VITE_RATE_UPDATE_TOKEN in client build, and RATE_UPDATE_TOKEN on server

- 403 CORS: origin not allowed:
  - The browser Origin is not included in CORS_ALLOW_ORIGIN
  - Add the exact origin (including scheme and domain) to CORS_ALLOW_ORIGIN and redeploy

- Client cannot reach API:
  - Ensure VITE_API_BASE_URL points to the production API when UI is hosted elsewhere
  - Verify API is healthy: GET https://www.devi-jewellers.com/api/health
