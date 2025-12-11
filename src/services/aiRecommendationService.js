import logger from '../utils/logger';

class AIRecommendationService {
  constructor() {
    this.userPreferences = {
      cuisineTypes: [],
      priceRange: 'medium',
      rating: 4.0,
      distance: 1000
    };
  }

  // Simulate AI recommendation algorithm
  async getRecommendations(places, userLocation, preferences = {}) {
    const mergedPreferences = { ...this.userPreferences, ...preferences };
    
    // Calculate recommendation score for each place
    const scoredPlaces = places.map((place, index) => {
      const score = this.calculateRecommendationScore(place, userLocation, mergedPreferences);
      
      const restaurantType = this.getRestaurantType(place);
      const customPlaceId = this.generateCustomPlaceId(restaurantType, index);
      
      return {
        ...place,
        original_place_id: place.place_id, 
        place_id: place.place_id, 
        recommendationScore: score,
        distance: this.calculateDistance(userLocation, place.geometry.location),
        restaurantType: restaurantType
      };
    });

    // Sort by recommendation score
    scoredPlaces.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Return top 10 recommendations
    return scoredPlaces.slice(0, 10);
  }


  generateCustomPlaceId(restaurantType, index) {
    const typeMap = {
      'american': 'american_restaurant_1',
      'italian': 'italian_restaurant_1', 
      'japanese': 'japanese_restaurant_1',
      'chinese': 'chinese_restaurant_1',
      'mexican': 'mexican_restaurant_1',
      'thai': 'thai_restaurant_1',
      'indian': 'indian_restaurant_1',
      'korean': 'korean_restaurant_1',
      'french': 'french_restaurant_1',
      'seafood': 'seafood_restaurant_1',
      'cafe': 'cafe_restaurant_1',
      'fast_food': 'fast_food_restaurant_1',
      'default': 'american_restaurant_1'
    };
    
    const baseId = typeMap[restaurantType] || typeMap['default'];
    return `${baseId}_${index}`;
  }

  getRestaurantType(place) {
    if (!place.types) return 'default';
    
    const types = place.types.map(t => t.toLowerCase());
    const name = (place.name || '').toLowerCase();
    
    logger.debug('Restaurant type detection:', {
      name: place.name,
      types: place.types
    });
    
    
    if (types.some(t => t.includes('japanese') || t.includes('sushi') || t.includes('ramen'))) {
      return 'japanese';
    }
    if (name.includes('sushi') || name.includes('japanese') || name.includes('ramen') || 
        name.includes('sakura') || name.includes('tokyo') || name.includes('zen') ||
        name.includes('sashimi') || name.includes('tempura') || name.includes('teriyaki') ||
        name.includes('wasabi') || name.includes('miso') || name.includes('udon')) {
      return 'japanese';
    }
    
    if (types.some(t => t.includes('italian') || t.includes('pizza'))) {
      return 'italian';
    }
    if (name.includes('italian') || name.includes('pizza') || name.includes('pasta') || 
        name.includes('bella') || name.includes('roma') || name.includes('napoli') ||
        name.includes('spaghetti') || name.includes('lasagna') || name.includes('risotto') ||
        name.includes('carbonara') || name.includes('alfredo') || name.includes('marinara')) {
      return 'italian';
    }
    
    if (types.some(t => t.includes('chinese'))) {
      return 'chinese';
    }
    if (name.includes('chinese') || name.includes('dragon') || name.includes('wok') || 
        name.includes('golden') || name.includes('peking') || name.includes('shanghai') ||
        name.includes('kung pao') || name.includes('sweet and sour') || name.includes('lo mein') ||
        name.includes('chow mein') || name.includes('dim sum') || name.includes('beijing') ||
        name.includes('canton') || name.includes('mandarin')) {
      return 'chinese';
    }
    
    if (types.some(t => t.includes('mexican'))) {
      return 'mexican';
    }
    if (name.includes('mexican') || name.includes('taco') || name.includes('burrito') || 
        name.includes('el ') || name.includes('mariachi') || name.includes('cantina')) {
      return 'mexican';
    }
    
    if (types.some(t => t.includes('thai'))) {
      return 'thai';
    }
    if (name.includes('thai') || name.includes('bangkok') || name.includes('pad thai') || 
        name.includes('curry') || name.includes('spicy')) {
      return 'thai';
    }

    if (types.some(t => t.includes('indian'))) {
      return 'indian';
    }
    if (name.includes('indian') || name.includes('curry') || name.includes('tandoor') || 
        name.includes('spice') || name.includes('masala')) {
      return 'indian';
    }
    
    if (types.some(t => t.includes('korean'))) {
      return 'korean';
    }
    if (name.includes('korean') || name.includes('korean') || name.includes('bbq') || 
        name.includes('kimchi') || name.includes('seoul')) {
      return 'korean';
    }
    
    if (types.some(t => t.includes('french'))) {
      return 'french';
    }
    if (name.includes('french') || name.includes('bistro') || name.includes('cafe') || 
        name.includes('paris') || name.includes('brasserie')) {
      return 'french';
    }
    
    if (types.some(t => t.includes('seafood'))) {
      return 'seafood';
    }
    if (name.includes('seafood') || name.includes('fish') || name.includes('oyster') || 
        name.includes('lobster') || name.includes('crab')) {
      return 'seafood';
    }
    
    if (types.some(t => t.includes('cafe') || t.includes('coffee'))) {
      return 'cafe';
    }
    if (name.includes('cafe') || name.includes('coffee') || name.includes('espresso') || 
        name.includes('latte') || name.includes('brew')) {
      return 'cafe';
    }
    
    if (types.some(t => t.includes('fast_food') || t.includes('meal_takeaway'))) {
      return 'fast_food';
    }
    if (name.includes('mcdonalds') || name.includes('burger') || name.includes('kfc') || 
        name.includes('subway') || name.includes('pizza hut')) {
      return 'fast_food';
    }

    if (types.some(t => t.includes('american') || t.includes('steakhouse') || t.includes('restaurant'))) {
      return 'american';
    }
    if (name.includes('american') || name.includes('steak') || name.includes('grill') || 
        name.includes('bistro') || name.includes('diner')) {
      return 'american';
    }
    
    return 'american';
  }

  calculateRecommendationScore(place, userLocation, preferences) {
    let score = 0;

    if (place.rating) {
      score += (place.rating / 5) * 40;
    }
    const distance = this.calculateDistance(userLocation, place.geometry.location);
    const maxDistance = preferences.distance || 1000;
    if (distance <= maxDistance) {
      score += (1 - distance / maxDistance) * 30;
    }
    if (place.price_level !== undefined) {
      const priceScore = (4 - place.price_level) / 4; // Lower price gets higher score
      score += priceScore * 20;
    }

    if (place.user_ratings_total) {
      const reviewScore = Math.min(place.user_ratings_total / 100, 1); // Maximum 100 reviews
      score += reviewScore * 10;
    }

    return Math.round(score);
  }

  calculateDistance(location1, location2) {
    const R = 6371; // Earth radius (kilometers)
    const dLat = this.deg2rad(location2.lat() - location1.lat);
    const dLon = this.deg2rad(location2.lng() - location1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(location1.lat)) * Math.cos(this.deg2rad(location2.lat())) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Convert to meters
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Adjust recommendations based on time and weather
  getContextualRecommendations(places, timeOfDay, weather = 'sunny') {
    return places.map(place => {
      let contextScore = 0;

      // Adjust based on time
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 11) {
        // Breakfast time - cafes get bonus points
        if (place.types && place.types.includes('cafe')) {
          contextScore += 20;
        }
      } else if (hour >= 11 && hour < 14) {
        // Lunch time - restaurants get bonus points
        if (place.types && place.types.includes('restaurant')) {
          contextScore += 20;
        }
      } else if (hour >= 14 && hour < 17) {
        // Afternoon tea time - cafes and dessert shops get bonus points
        if (place.types && (place.types.includes('cafe') || place.types.includes('bakery'))) {
          contextScore += 20;
        }
      } else if (hour >= 17 && hour < 21) {
        // Dinner time - restaurants get bonus points
        if (place.types && place.types.includes('restaurant')) {
          contextScore += 20;
        }
      }

      // Adjust based on weather
      if (weather === 'rainy' && place.types && place.types.includes('cafe')) {
        contextScore += 10; // Rainy day cafes get bonus points
      }

      return {
        ...place,
        contextScore: contextScore,
        finalScore: (place.recommendationScore || 0) + contextScore
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  // Learn user preferences
  updateUserPreferences(selectedPlace) {
    // Here you can implement machine learning algorithms to learn user preferences
    // Currently using simple rule-based updates
    if (selectedPlace.types) {
      selectedPlace.types.forEach(type => {
        if (!this.userPreferences.cuisineTypes.includes(type)) {
          this.userPreferences.cuisineTypes.push(type);
        }
      });
    }

    if (selectedPlace.price_level !== undefined) {
      this.userPreferences.priceRange = selectedPlace.price_level <= 1 ? 'low' : 
                                       selectedPlace.price_level <= 2 ? 'medium' : 'high';
    }
  }
}

export default new AIRecommendationService();
