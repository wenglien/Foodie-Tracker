# Foodie Tracker

An AI-powered restaurant and cafe recommender built with React. It integrates the Google Maps Platform to get your current location, search nearby places, score results, and provide AI-assisted insights and recommendations.

🌐 **Live Demo**: [https://foodieapp-df66c.web.app](https://foodieapp-df66c.web.app)

## Features

### Core Features

- **Location-based Search** - Get your current location and search nearby restaurants
- **Interactive Map** - View restaurants on Google Maps with color-coded score markers
- **AI Recommendations** - Get personalized restaurant recommendations powered by Groq AI
- **Ratings & Reviews** - View restaurant ratings, reviews, and detailed information
- **Favorites** - Save your favorite restaurants locally
- **Advanced Filters** - Filter by radius, type, and price range
- **Multi-language Support** - Full support for English and Traditional Chinese (繁體中文)

### User Account Features

- **Firebase Authentication** - Secure user registration and login with Firebase Auth
- **User Profile** - Comprehensive profile page with user statistics and activity tracking
- **Level System** - Gamified experience with levels based on user activity (Newbie → Foodie → Explorer → Expert → Master)
- **Achievements** - Unlock achievements for milestones (First Search, Explorer, Collector, AI Friend, Navigator, Streak Master)
- **Login Streak** - Track consecutive login days with streak counter
- **Activity Tracking** - View search history, viewed places, and top categories

### AI Features

- **AI Chat Assistant** - Ask questions about restaurants and get personalized recommendations
- **Menu AI Assistant** - Get dish recommendations and menu insights
- **Smart Translation** - Automatically detect and translate non-English reviews to English

### Additional Features

- **Search History** - Keep track of your recent searches locally
- **Real-time Menu Data** - View restaurant menus with AI-powered search fallback
- **Mobile Optimized** - Responsive design with smooth scrolling and touch-friendly UI
- **Onboarding Tour** - Interactive guided tour for new users
- **Language Selector** - Choose your preferred language on first visit

## Requirements

- Node.js 18+
- npm 6+
- Google Maps API Key (Places, Maps JavaScript)
- Firebase Account (for deployment and authentication)

## How to Use

1. **Select Language** - Choose English or 繁體中文 on first visit
2. **Create Account** - Register with email/password to track your activity and achievements
3. Click **Get Location** to allow the browser to access your location
4. Choose search radius, type, and price range, then click **Search Nearby**
5. Click a restaurant marker or list item to see details
6. Click the **robot icon** 🤖 to open AI chat and ask for recommendations
7. Use Favorites to save places; Search History keeps your recent searches locally
8. Click **Translate** 🌐 on non-English reviews to see English translations
9. Click the **globe icon** 🌍 in the header to change language anytime
10. Click your **profile avatar** to view stats, achievements, and activity history

## Multi-language Support

The app supports the following languages:

| Language                       | Code    | Status          |
| ------------------------------ | ------- | --------------- |
| English                        | `en`    | ✅ Full support |
| 繁體中文 (Traditional Chinese) | `zh-TW` | ✅ Full support |

### Language Features

- **First-visit language selection** - Beautiful language selector on first visit
- **Persistent preference** - Language choice saved in browser localStorage
- **Real-time switching** - Change language anytime via header dropdown
- **Complete translations** - All UI elements, modals, and tour fully translated
- **Auto-detection** - Detects browser language as default

### Adding New Languages

To add a new language:

1. Create a new translation file in `src/locales/` (e.g., `ja.js` for Japanese)
2. Add the language to `src/locales/index.js`
3. All translation keys are documented in `src/locales/en.js`

## AI Assistant

The AI assistant can help you:

- Get personalized restaurant recommendations
- Compare restaurants by rating, distance, and price
- Answer questions about nearby restaurants
- Recommend dishes from restaurant menus
- Translate reviews to English

**Example questions:**

- "Which restaurant is closest?"
- "Find me a cheap place to eat"
- "What's popular at this restaurant?"
- "Recommend something healthy"

## Project Structure

```
csc642/
├── api/
│   └── ai-proxy.js               # Legacy Vercel serverless function
├── functions/
│   ├── index.js                  # Firebase Cloud Functions (Groq AI proxy)
│   ├── package.json
│   └── .env                      # Groq API key (not in git)
├── public/
│   ├── 404.html
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AIChatModal.js        # AI chat interface
│   │   ├── ErrorMessage.js       # Error display component
│   │   ├── FavoritesPanel.js     # Favorites management panel
│   │   ├── HelpModal.js          # Help & instructions modal
│   │   ├── LanguageSelector.js   # Language selection screen
│   │   ├── LoadingSpinner.js     # Loading indicator
│   │   ├── LocationControls.js   # Location & search controls
│   │   ├── LoginModal.js         # User login modal (Firebase Auth)
│   │   ├── MapComponent.js       # Google Maps integration
│   │   ├── MenuAIChat.js         # Menu AI assistant
│   │   ├── MenuModal.js          # Restaurant menu display
│   │   ├── OnboardingTour.js     # Interactive guided tour
│   │   ├── PlaceDetailModal.js   # Place details view
│   │   ├── ProfileModal.js       # User profile with stats & achievements
│   │   ├── RecommendationList.js # AI recommendations list
│   │   ├── RegisterModal.js      # User registration modal (Firebase Auth)
│   │   └── ReviewsModal.js       # Place reviews display
│   ├── contexts/
│   │   ├── AuthContext.js        # Authentication context provider
│   │   └── LanguageContext.js    # Language/i18n context provider
│   ├── locales/
│   │   ├── en.js                 # English translations
│   │   ├── zh-TW.js              # Traditional Chinese translations
│   │   └── index.js              # Locales configuration
│   ├── services/
│   │   ├── aiRecommendationService.js  # AI recommendation scoring
│   │   ├── aiService.js          # AI API integration
│   │   ├── authService.js        # Firebase Authentication service
│   │   ├── currencyService.js    # Currency conversion
│   │   ├── favoritesService.js   # Favorites storage
│   │   ├── firebaseConfig.js     # Firebase app configuration
│   │   ├── googleMapsService.js  # Google Maps API wrapper
│   │   ├── realMenuService.js    # Menu data service
│   │   ├── searchHistoryService.js # Search history storage
│   │   ├── translateService.js   # AI-powered translation
│   │   └── userStatsService.js   # User activity & stats tracking
│   ├── utils/
│   │   └── envCheck.js           # Environment validation
│   ├── App.js                    # Main application component
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles (Tailwind)
├── firebase.json                 # Firebase configuration
├── .firebaserc                   # Firebase project settings
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Environment Variables

### Frontend (.env)

| Variable                        | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API key for maps and places search |
| `REACT_APP_AI_PROXY_URL`        | (Optional) External AI proxy URL               |

### Firebase Functions (functions/.env)

| Variable       | Description                   |
| -------------- | ----------------------------- |
| `GROQ_API_KEY` | Groq API key for AI responses |

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Maps**: Google Maps JavaScript API, Places API
- **AI**: Groq API (Llama 3.1)
- **Authentication**: Firebase Authentication (Email/Password)
- **Hosting**: Firebase Hosting
- **Backend**: Firebase Cloud Functions
- **Fonts**: Outfit, Inter (Google Fonts)
- **i18n**: Custom React Context-based internationalization

## Key Features Explained

### AI Score System

Each restaurant receives an AI-calculated score (0-100) based on:

- Rating (40%)
- Distance from user (30%)
- Price level (20%)
- Number of reviews (10%)

Map markers are color-coded:

- 🟢 Green: 70+ (Excellent)
- 🟡 Amber: 50-69 (Good)
- ⚪ Gray: <50 (Fair)

### Translation Feature

- Automatically detects non-English reviews (Chinese, Japanese, Korean, Arabic, etc.)
- One-click translation to English using AI
- Shows original text alongside translation
- Translations are cached for better performance

### User Profile & Achievements

The app includes a gamified user experience with:

- **Level System**: Users earn levels based on activity (searches, views, AI chats)

  - Level 1-4: Newbie
  - Level 5-14: Foodie
  - Level 15-29: Explorer
  - Level 30-49: Expert
  - Level 50+: Master

- **Achievements**: Unlock badges for reaching milestones

  - First Search - Complete your first search
  - Explorer - Complete 10 searches
  - Collector - Save 5 favorites
  - AI Friend - Have 10 AI conversations
  - Navigator - Use navigation 5 times
  - Streak Master - Maintain a 7-day login streak

- **Activity Tracking**: View your search history, viewed places, and preferred categories

### Internationalization (i18n)

- Context-based language management via `LanguageContext`
- Translation function `t()` for easy usage in components
- Supports nested translation keys (e.g., `t('login.welcomeBack')`)
- Fallback to English if translation key not found
- Language preference persisted in localStorage

## Limitations

- Search results depend on Google Maps API availability and quota
- AI responses may vary in accuracy
- Favorites, search history, and user stats are stored in browser localStorage
- Translation requires AI API access
- Firebase Authentication requires network connectivity

## Security

This project follows security best practices:

- **Environment Variables**: All sensitive API keys are stored in `.env` files (not committed to git)
- **Firebase Security**: Firebase configuration in the frontend is public by design; security is enforced through Firebase Security Rules
- **API Proxy**: AI API calls are proxied through Firebase Functions to protect the Groq API key
- **No Hardcoded Secrets**: Use `.env.example` templates to set up your own API keys

## License

MIT License - see the [LICENSE](LICENSE) file for details
