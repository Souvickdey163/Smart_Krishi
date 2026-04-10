# Smart Krishi - AI-Powered Farming Ecosystem

## Overview
A modern, accessible mobile application UI designed for rural farmers and agricultural buyers/sellers. Features dual role-based interfaces with bilingual support (English/Hindi).

## Features

### Authentication Flow
- **Splash Screen**: Welcoming intro with branding
- **Login/Signup**: Phone number + OTP authentication
- **Role Selection**: Choose between Farmer or Buyer/Seller

### Farmer Interface (5 Navigation Tabs)
1. **Home**
   - Personalized greeting
   - Weather information
   - Quick action cards (Scan Crop, Check Prices, Pest Alerts, Voice Help)
   - Recent updates feed
   - Daily farming tips

2. **Crop Doctor**
   - AI-powered disease detection
   - Camera/gallery upload
   - Diagnosis with confidence percentage
   - Treatment recommendations
   - Nearby product suggestions

3. **Soil & Insights**
   - Soil health metrics (pH, moisture, temperature, nitrogen)
   - Recommended crops based on soil
   - Irrigation scheduling
   - Harvest timing suggestions

4. **Alert Map**
   - Interactive pest outbreak map
   - Risk level visualization (high/medium/low)
   - Nearby farmer reports
   - Issue reporting system

5. **Market**
   - Real-time crop prices
   - Price trends and analytics
   - Nearby mandi locations
   - AI-powered selling suggestions

6. **Profile**
   - Personal information
   - Language selection (5 Indian languages)
   - Settings (voice assistant, notifications, SMS)
   - Quick links
   - Role switching

### Buyer/Seller Interface (4 Navigation Tabs)
1. **Home**
   - Business statistics
   - Featured crops
   - Nearby farmers
   - Demand highlights

2. **Marketplace**
   - Product listings with images
   - Advanced filters
   - Farmer ratings
   - Distance-based sorting
   - Contact and cart functionality

3. **Post Demand**
   - Create buying requests
   - Specify crop, quantity, and budget
   - Location-based matching
   - Quick crop selection

4. **Contracts**
   - Active deals tracking
   - Pre-booked crops (future harvest)
   - Completed orders history
   - Progress monitoring
   - Rating system

5. **Profile**
   - Business information
   - Trust score and ratings
   - Order history
   - Payment methods
   - Role switching

### Shared Components
- **Voice Assistant**: Floating button for multilingual voice help
- **Bottom Navigation**: Large, accessible navigation tabs
- **Notifications**: Real-time alerts and updates

## Design System

### Color Palette (Earthy Theme)
- **Primary Green**: `#4a7c59` - Represents agriculture and growth
- **Secondary Brown**: `#8b6f47` - Earth tones
- **Accent Beige**: `#d4a574` - Warm highlights
- **Background**: `#faf8f5` - Soft neutral
- **Destructive Red**: `#c75146` - Alerts and warnings

### Accessibility Features
- **Large Touch Targets**: Minimum 44x44px buttons
- **High Contrast**: WCAG AA compliant color ratios
- **Bilingual Labels**: English + Hindi (Devanagari script)
- **Voice Icons**: Clear visual indicators for voice features
- **Simple Layouts**: Reduced cognitive load for rural users
- **Icon-First Design**: Universal symbols for illiterate users

### Typography
- Clear, readable fonts
- Bilingual text support
- Hierarchical sizing for easy scanning

### Components
- Rounded corners (16px+ radius) for friendly feel
- Soft shadows for depth
- Card-based layouts
- Gradient headers
- Status badges
- Progress indicators

## Technical Stack
- **React**: UI framework
- **React Router**: Navigation (Data mode)
- **Tailwind CSS v4**: Styling
- **Lucide React**: Icon library
- **Radix UI**: Accessible components

## Mobile Optimization
- Responsive design (mobile-first)
- Touch-friendly interfaces
- Safe area support for notched devices
- Optimized images from Unsplash
- Fast loading times

## Navigation Structure
```
/                     → Splash Screen
/login                → Authentication
/select-role          → Role Selection
/farmer               → Farmer Dashboard
  ├── /crop-doctor    → AI Disease Detection
  ├── /soil-insights  → Soil Analysis
  ├── /alert-map      → Pest Alerts
  ├── /market         → Market Prices
  └── /profile        → Farmer Profile
/buyer                → Buyer Dashboard
  ├── /marketplace    → Browse Products
  ├── /post-demand    → Create Requests
  ├── /contracts      → Manage Contracts
  └── /profile        → Buyer Profile
```

## Future Enhancements
- Real-time chat between farmers and buyers
- Payment integration
- GPS-based location services
- Weather API integration
- Actual AI/ML model for crop disease detection
- Multi-language expansion (Punjabi, Telugu, Tamil, etc.)
- Dark mode support
- Offline functionality
- Push notifications
- SMS integration for OTP

## Usage
1. Start at splash screen
2. Login with phone number
3. Select your role (Farmer or Buyer/Seller)
4. Navigate using bottom tabs
5. Switch roles anytime from profile
