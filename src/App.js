import React, { useState, useEffect } from 'react';
import { MapPin, Heart, Info, History, X, Bot, LogIn, LogOut, HelpCircle, Globe, User } from 'lucide-react';
import MapComponent from './components/MapComponent';
import RecommendationList from './components/RecommendationList';
import LocationControls from './components/LocationControls';
import PlaceDetailModal from './components/PlaceDetailModal';
import FavoritesPanel from './components/FavoritesPanel';
import HelpModal from './components/HelpModal';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AIChatModal from './components/AIChatModal';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import OnboardingTour from './components/OnboardingTour';
import LanguageSelector from './components/LanguageSelector';
import ProfileModal from './components/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import googleMapsService from './services/googleMapsService';
import aiRecommendationService from './services/aiRecommendationService';
import favoritesService from './services/favoritesService';
import searchHistoryService from './services/searchHistoryService';
import userStatsService from './services/userStatsService';
import { checkEnvironmentVariables } from './utils/envCheck';

function App() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, hasSelectedLanguage, currentLanguage, changeLanguage, languages } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [selectedRestaurantForAI, setSelectedRestaurantForAI] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(!hasSelectedLanguage);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hasTourCompleted, setHasTourCompleted] = useState(() => {
    return localStorage.getItem('foodieTracker_tourCompleted') === 'true';
  });

  // Check if user has seen the tour before
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('foodieTracker_tourCompleted');
    if (!hasSeenTour && isAuthenticated && hasSelectedLanguage) {
      // Delay tour start to let the UI render first
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasSelectedLanguage]);

  const handleTourComplete = () => {
    localStorage.setItem('foodieTracker_tourCompleted', 'true');
    setHasTourCompleted(true);
    setShowTour(false);
  };

  const handleTourSkip = () => {
    localStorage.setItem('foodieTracker_tourCompleted', 'true');
    setHasTourCompleted(true);
    setShowTour(false);
  };

  const handleRestartTour = () => {
    setShowTour(true);
  };

  const convertWeekdayToEnglish = (weekdayText) => {
    if (!weekdayText) return weekdayText;
    
    // Map Chinese weekdays to English
    const weekdayMap = {
      '星期一': 'Monday',
      '星期二': 'Tuesday',
      '星期三': 'Wednesday',
      '星期四': 'Thursday',
      '星期五': 'Friday',
      '星期六': 'Saturday',
      '星期日': 'Sunday',
      '星期天': 'Sunday',
      '週一': 'Monday',
      '週二': 'Tuesday',
      '週三': 'Wednesday',
      '週四': 'Thursday',
      '週五': 'Friday',
      '週六': 'Saturday',
      '週日': 'Sunday',
      '週天': 'Sunday'
    };
    
    let converted = weekdayText;
    // Replace Chinese weekdays with English
    Object.keys(weekdayMap).forEach(chinese => {
      const regex = new RegExp(chinese, 'g');
      converted = converted.replace(regex, weekdayMap[chinese]);
    });
    
    return converted;
  };

  const handleGetLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await googleMapsService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSearch = async (searchParams) => {
    if (!userLocation) {
      setError(t('location.pleaseGetLocation'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const places = await googleMapsService.searchNearbyPlaces(
        userLocation,
        searchParams.type,
        searchParams.radius
      );

      const aiRecommendations = await aiRecommendationService.getRecommendations(
        places,
        userLocation,
        {
          priceRange: searchParams.priceRange,
          distance: searchParams.radius
        }
      );

      const contextualRecommendations = aiRecommendationService.getContextualRecommendations(
        aiRecommendations,
        new Date().getHours(),
        'sunny' 
      );

      setRecommendations(contextualRecommendations);
      
      searchHistoryService.addSearch(searchParams, contextualRecommendations);
      userStatsService.recordSearch(searchParams);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async (searchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const places = await googleMapsService.searchPlacesByText(
        searchParams.query,
        searchParams.location,
        searchParams.radius
      );

      const placesWithDistance = places.map(place => {
        if (searchParams.location && place.geometry && place.geometry.location) {
          const distance = googleMapsService.calculateDistance(
            searchParams.location,
            place.geometry.location
          );
          return { ...place, distance };
        }
        return place;
      });

      const aiRecommendations = await aiRecommendationService.getRecommendations(
        placesWithDistance,
        searchParams.location,
        {
          priceRange: searchParams.priceRange,
          distance: searchParams.radius
        }
      );

      const contextualRecommendations = aiRecommendationService.getContextualRecommendations(
        aiRecommendations,
        new Date().getHours(),
        'sunny' 
      );

      setRecommendations(contextualRecommendations);
      
      searchHistoryService.addSearch({
        ...searchParams,
        type: 'text_search',
        query: searchParams.query
      }, contextualRecommendations);
      userStatsService.recordSearch(searchParams);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = async (place) => {
    setIsLoading(true);
    try {

      const originalPlaceId = place.original_place_id || place.place_id;
      const details = await googleMapsService.getPlaceDetails(originalPlaceId);
      const placeWithDetails = {
        ...place,
        details: details,
        place_id: place.place_id
      };
      setSelectedPlace(placeWithDetails);
      setShowPlaceDetail(true);
      userStatsService.recordPlaceView(place);
    } catch {
      setSelectedPlace(place);
      setShowPlaceDetail(true);
      userStatsService.recordPlaceView(place);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantClick = async (restaurant) => {
    setSelectedRestaurantForAI(restaurant);
    
    try {
      const menu = await googleMapsService.getRestaurantMenu(restaurant.place_id, restaurant);
      const restaurantWithMenu = {
        ...restaurant,
        menu: menu
      };
      setSelectedRestaurantForAI(restaurantWithMenu);
    } catch {
      // Menu loading failed, continue with basic restaurant info
    }
    
    setShowAIChat(true);
  };

  const handleRestaurantAnalysis = () => {
    // Restaurant analysis callback - can be extended for future features
  };

  const handleFavorite = (place) => {
    if (favoritesService.isFavorite(place.place_id)) {
      favoritesService.removeFavorite(place.place_id);
    } else {
      favoritesService.addFavorite(place);
    }
    setFavoritesCount(favoritesService.getFavorites().length);
  };

  const updateFavoritesCount = () => {
    setFavoritesCount(favoritesService.getFavorites().length);
  };

  useEffect(() => {
    // Validate environment configuration on startup
    checkEnvironmentVariables();
    
    // If not logged in, automatically show login interface
    if (!isAuthenticated) {
      setShowLogin(true);
      setShowRegister(false);
    } else {
      // After login, close all login/register modal boxes
      setShowLogin(false);
      setShowRegister(false);
      handleGetLocation();
      updateFavoritesCount();
      
      // Record login and initialize user stats
      if (user) {
        userStatsService.initializeForUser(user.id);
        userStatsService.recordLogin();
      }
    }
  }, [isAuthenticated, user]);

  // Show language selector first
  if (!hasSelectedLanguage) {
    return (
      <LanguageSelector 
        isOpen={true} 
        onClose={() => setShowLanguageSelector(false)} 
      />
    );
  }

  // If not logged in, only show login/register interface
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-surface">
        <LoginModal
          isOpen={showLogin}
          onClose={() => {
            if (isAuthenticated) {
              setShowLogin(false);
            }
          }}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          canClose={false}
        />
        <RegisterModal
          isOpen={showRegister}
          onClose={() => {
            if (isAuthenticated) {
              setShowRegister(false);
            }
          }}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          canClose={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface">
      {/* Modern Header */}
      <header className="glass-card border-b border-surface-200/50 sticky top-0 z-40 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="gradient-brand p-2 sm:p-2.5 rounded-xl shadow-glow animate-float">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-display text-gradient-brand">
                  {t('app.title')}
                </h1>
                <p className="text-[10px] sm:text-xs text-surface-500 font-medium hidden sm:block">{t('app.subtitle')}</p>
              </div>
            </div>

            {/* Mobile Right Controls - Only visible on mobile */}
            <div className="sm:hidden flex items-center gap-2">
              {/* Tour Button */}
              {hasTourCompleted && (
                <button
                  onClick={handleRestartTour}
                  className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all"
                  title={t('tour.startTour')}
                >
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                </button>
              )}
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 rounded-lg transition-all"
                >
                  <Globe className="w-4 h-4 text-surface-600" />
                  <span className="text-xs font-medium text-surface-700">
                    {currentLanguage === 'zh-TW' ? '中文' : 'EN'}
                  </span>
                </button>
                {showLanguageDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50 animate-fadeIn">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            changeLanguage(lang.code);
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm hover:bg-surface-50 transition-colors flex items-center gap-2 ${
                            currentLanguage === lang.code ? 'bg-brand-50 text-brand-600' : 'text-surface-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span className="font-medium">{lang.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => setShowAIChat(true)}
                className="btn-icon group"
                title={t('aiChat.title')}
                data-tour="ai-btn"
              >
                <Bot className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={() => setShowFavorites(true)}
                className="btn-icon group relative"
                title={t('favorites.myFavorites')}
                data-tour="favorites-btn"
              >
                <Heart className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 gradient-brand text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-glow">
                    {favoritesCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowSearchHistory(true)}
                className="btn-icon group"
                title={t('history.title')}
                data-tour="history-btn"
              >
                <History className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              </button>
              
              <button
                onClick={() => setShowHelp(true)}
                className="btn-icon group"
                title={t('help.userGuide')}
              >
                <Info className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              </button>
              
              {hasTourCompleted && (
              <button
                onClick={handleRestartTour}
                className="btn-icon group"
                  title={t('tour.startTour')}
              >
                <HelpCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              </button>
              )}

              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="btn-icon group"
                  title={t('language.selectLanguage')}
                >
                  <Globe className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
                </button>
                {showLanguageDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50 animate-fadeIn">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            changeLanguage(lang.code);
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-surface-50 transition-colors flex items-center gap-2 ${
                            currentLanguage === lang.code ? 'bg-brand-50 text-brand-600' : 'text-surface-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span className="font-medium">{lang.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="w-px h-6 bg-surface-200 mx-1"></div>
              
              {isAuthenticated ? (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-100 rounded-xl transition-all"
                  title={t('profile.title')}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium text-surface-700 max-w-[100px] truncate">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="btn-secondary text-sm py-2"
                  >
                    {t('common.login')}
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="btn-primary text-sm py-2"
                  >
                    {t('common.signUp')}
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
        
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
            retryText={t('common.close')}
          />
        )}

        <LocationControls
          onGetLocation={handleGetLocation}
          onSearch={handleSearch}
          onTextSearch={handleTextSearch}
          isLoading={isLoading}
          userLocation={userLocation}
        />

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Map Section */}
          <div className="xl:col-span-2 order-2 xl:order-1">
            <div className="card-elevated overflow-hidden animate-fadeInUp" data-tour="map">
              {/* Map Container - Full height, no header to maximize space */}
              <div className="h-64 sm:h-80 lg:h-96 xl:h-[480px] relative">
                <MapComponent
                  userLocation={userLocation}
                  recommendations={recommendations}
                  onLocationSelect={handleSelectPlace}
                  onRestaurantClick={handleRestaurantClick}
                />
                
                {/* Floating Title Badge */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-soft flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full gradient-brand" />
                    <span className="text-xs font-semibold text-surface-700">{t('map.exploreMap')}</span>
                    {userLocation && (
                      <span className="text-[10px] text-accent-mint font-medium">• {t('map.live')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <div className="xl:col-span-1 order-1 xl:order-2">
            <div className="card-elevated p-3 sm:p-5 animate-fadeInUp stagger-1" data-tour="recommendations">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 sm:h-6 gradient-mint rounded-full"></div>
                  <h3 className="text-sm sm:text-base font-bold font-display text-surface-800">{t('recommendations.forYou')}</h3>
                </div>
                {recommendations.length > 0 && (
                  <span className="badge badge-mint">
                    {recommendations.length} {t('common.found')}
                  </span>
                )}
              </div>
              <div className="max-h-[280px] sm:max-h-[350px] lg:max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                {isLoading ? (
                  <LoadingSpinner message={t('recommendations.findingPlaces')} />
                ) : (
                  <RecommendationList
                    recommendations={recommendations}
                    onSelectPlace={handleSelectPlace}
                    selectedPlace={selectedPlace}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Place Quick View */}
        {selectedPlace && selectedPlace.details && (
          <div className="mt-4 sm:mt-5 card-elevated p-4 sm:p-5 animate-fadeInUp">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-accent-sky rounded-full"></div>
              <h3 className="text-sm sm:text-base font-bold font-display text-surface-800">{t('recommendations.quickView')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <h4 className="font-semibold text-surface-800 mb-1.5 text-sm sm:text-base truncate">{selectedPlace.details.name}</h4>
                <p className="text-surface-500 mb-2 text-xs sm:text-sm break-words line-clamp-2">{selectedPlace.details.formatted_address}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                {selectedPlace.details.formatted_phone_number && (
                    <a 
                      href={`tel:${selectedPlace.details.formatted_phone_number}`}
                      className="badge badge-sky"
                    >
                      {t('recommendations.call')}
                    </a>
                )}
                {selectedPlace.details.website && (
                  <a
                    href={selectedPlace.details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="badge badge-brand"
                  >
                      {t('recommendations.website')}
                  </a>
                )}
                </div>
              </div>
              
              <div>
                {selectedPlace.details.reviews && selectedPlace.details.reviews.length > 0 && (
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-surface-600 text-xs sm:text-sm italic line-clamp-3">"{selectedPlace.details.reviews[0].text}"</p>
                    <p className="mt-2 text-xs text-surface-400 font-medium">
                      — {selectedPlace.details.reviews[0].author_name}
                      </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation - Modern Pill Style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden safe-area-bottom px-4 pb-2" data-tour="mobile-nav">
        <div className="glass-card rounded-2xl shadow-soft-lg border border-white/50">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setShowAIChat(true)}
              className="flex flex-col items-center gap-0.5 p-2.5 min-w-[52px] text-surface-500 active:text-brand-600 active:bg-brand-50 rounded-xl transition-all"
              data-tour="mobile-ai-btn"
            >
              <Bot className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t('nav.ai')}</span>
            </button>
            
            <button
              onClick={() => setShowFavorites(true)}
              className="relative flex flex-col items-center gap-0.5 p-2.5 min-w-[52px] text-surface-500 active:text-accent-coral active:bg-red-50 rounded-xl transition-all"
              data-tour="mobile-favorites-btn"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t('nav.saved')}</span>
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-2 gradient-brand text-white text-[8px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>
          
            {/* Center Action Button - Prominent Relocate */}
            <button
              onClick={handleGetLocation}
              disabled={isLoading}
              data-tour="mobile-location-btn"
              className={`relative -mt-5 w-16 h-16 rounded-2xl shadow-xl flex flex-col items-center justify-center active:scale-95 transition-all duration-200 ${
                userLocation 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                  : 'bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 animate-pulse'
              }`}
            >
              <MapPin className="w-6 h-6 text-white" />
              <span className="text-[8px] text-white font-bold mt-0.5">
                {userLocation ? t('nav.update') : t('nav.locate')}
              </span>
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-ping" />
              )}
            </button>
          
            <button
              onClick={() => setShowSearchHistory(true)}
              className="flex flex-col items-center gap-0.5 p-2.5 min-w-[52px] text-surface-500 active:text-accent-sky active:bg-sky-50 rounded-xl transition-all"
              data-tour="mobile-history-btn"
            >
              <History className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t('nav.history')}</span>
            </button>
            
            {isAuthenticated ? (
              <button
                onClick={() => setShowProfile(true)}
                className="flex flex-col items-center gap-0.5 p-2.5 min-w-[52px] text-surface-500 active:text-brand-600 active:bg-brand-50 rounded-xl transition-all"
              >
                <User className="w-5 h-5" />
                <span className="text-[9px] font-semibold">{t('nav.profile')}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex flex-col items-center gap-0.5 p-2.5 min-w-[52px] text-surface-500 active:text-brand-600 active:bg-brand-50 rounded-xl transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-[9px] font-semibold">{t('common.login')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Footer - Minimal */}
      <footer className="hidden sm:block mt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-surface-400">
              <span className="font-semibold text-gradient-brand">{t('app.title')}</span> • {t('app.footer')}
            </p>
          </div>
        </div>
      </footer>

      <PlaceDetailModal
        place={selectedPlace}
        isOpen={showPlaceDetail}
        onClose={() => setShowPlaceDetail(false)}
        onFavorite={handleFavorite}
        isFavorite={selectedPlace ? favoritesService.isFavorite(selectedPlace.place_id) : false}
        recommendations={recommendations}
        userLocation={userLocation}
      />

      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => {
          setShowFavorites(false);
          updateFavoritesCount();
        }}
        onSelectPlace={handleSelectPlace}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
      {showSearchHistory && (
        <div className="fixed inset-0 backdrop-overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-slideUp sm:animate-scaleIn shadow-soft-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-display text-surface-800">{t('history.title')}</h2>
                  <p className="text-xs text-surface-400">{searchHistoryService.getStats().totalSearches} {t('history.searches')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 max-h-[55vh] sm:max-h-[50vh] overflow-y-auto overscroll-contain">
              {searchHistoryService.getHistory().length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
                    <History className="w-8 h-8 text-surface-300" />
                  </div>
                  <p className="text-surface-600 font-medium">{t('history.noHistory')}</p>
                  <p className="text-xs text-surface-400 mt-1">{t('history.searchesAppear')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchHistoryService.getHistory().map((record, index) => (
                    <div 
                      key={record.id} 
                      className="bg-surface-50 p-3 rounded-xl card-interactive"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-surface-700">{searchHistoryService.getTypeName(record.params.type)}</span>
                        <span className="text-[10px] text-surface-400">
                          {searchHistoryService.formatTimestamp(record.timestamp)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="badge badge-brand text-[10px]">{record.params.radius}m</span>
                        <span className="badge badge-mint text-[10px]">{record.resultsCount} {t('common.found')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 sm:p-5 border-t border-surface-100 bg-surface-50 safe-area-bottom">
              <button
                onClick={() => {
                  if (window.confirm(t('history.clearHistory'))) {
                    searchHistoryService.clearHistory();
                    setShowSearchHistory(false);
                  }
                }}
                className="btn-secondary flex-1 py-2.5 text-accent-coral border-accent-coral/30 hover:bg-red-50 text-sm"
              >
                {t('common.clear')}
              </button>
              <button
                onClick={() => setShowSearchHistory(false)}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAIChat && (
        <AIChatModal
          isOpen={showAIChat}
          onClose={() => {
            setShowAIChat(false);
            setSelectedRestaurantForAI(null);
          }}
          recommendations={recommendations}
          userLocation={userLocation}
          selectedRestaurant={selectedRestaurantForAI}
          onRestaurantAnalysis={handleRestaurantAnalysis}
        />
      )}

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        canClose={true}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
        canClose={true}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />
    </div>
  );
}

export default App;
