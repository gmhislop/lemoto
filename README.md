# Lemoto - Smart Ride Weather Companion

A Next.js application that provides personalized riding recommendations based on weather conditions and user preferences.

## Features

### ✅ Implemented Minimal Features

- **Basic User Setup**: Configure riding schedule (weekdays/weekends, time slots) and simple weather preferences
- **Weather Check Engine**: Pulls weather forecast and compares with user preferences to output "Ride OK" / "Not Recommended"
- **Widget**: Shows current ride suitability with tap-to-open functionality
- **Basic Notifications**: Foundation for push notifications when weather changes impact ride suitability

### Core Components

- **Dashboard**: Main ride suitability indicator with real-time weather data
- **Settings**: User preference configuration (schedule, weather conditions, location)
- **Weather API Integration**: OpenWeatherMap integration for current and forecast data
- **Ride Engine**: Smart analysis of weather conditions vs. user preferences

## Architecture

The app is built with route groups for easy migration to subdomains:

**Current (Development)**:
- `/` - Marketing landing page
- `/app/dashboard` - Main app dashboard  
- `/app/settings` - User preferences
- `/sign-in`, `/sign-up` - Authentication

**Future (Production)**:
- `lemoto.com` - Marketing site
- `app.lemoto.com` - App dashboard & auth

Authentication cookies are configured domain-wide (`.lemoto.com`) for seamless subdomain migration.

## Setup Instructions

### 1. Environment Variables

Update `.env.local` with your API keys:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenWeatherMap API (required)
OPENWEATHER_API_KEY=your_openweather_api_key

# Domain Configuration (already configured for localhost)
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DOMAIN=lemoto.com
NEXT_PUBLIC_COOKIE_DOMAIN=.lemoto.com
```

Get your OpenWeatherMap API key from: https://openweathermap.org/api

### 2. Database Setup

Run the SQL migration in your Supabase SQL editor:

```sql
-- See supabase_migration.sql file
```

### 3. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Initial Setup

1. Sign up/Sign in with your credentials
2. Navigate to Settings to configure:
   - Location (use "Use Current Location" button)
   - Riding schedule (days and time windows)
   - Weather preferences (temperature, rain, wind limits)
3. Return to dashboard to see your personalized ride recommendations

## Usage

### Dashboard Features

- **Right Now**: Current ride suitability with real-time weather check
- **Today Overall**: Best riding conditions available today
- **Weather Summary**: Current conditions with temperature, humidity, rain, and wind
- **Next Good Ride Window**: When conditions will next be suitable

### Settings Configuration

- **Location**: Set coordinates manually or use device location
- **Schedule**: Choose riding days and time windows
- **Weather Preferences**: Set minimum temperature, wind speed limits, rain tolerance
- **Notifications**: Enable/disable push notifications (requires setup)

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, Supabase Auth & Database
- **Weather API**: OpenWeatherMap
- **Database**: PostgreSQL (via Supabase) with RLS policies
- **Notifications**: Service Workers (foundation implemented)

## API Structure

- `/api/weather` - Fetch weather data and ride analysis
- `/api/preferences` - User preference management
- `/api/notifications/subscribe` - Push notification subscription (to be implemented)

## Next Steps for Full Implementation

1. **Push Notifications**: Complete server-side push notification implementation
2. **Location Services**: Enhanced location detection and management
3. **Advanced Scheduling**: More granular time slot management
4. **Weather Alerts**: Proactive notifications for changing conditions
5. **Historical Data**: Track riding patterns and recommendations
6. **Mobile App**: React Native implementation for better widget experience
