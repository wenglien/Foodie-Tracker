import logger from '../utils/logger';

class AIService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isVercel = window.location.hostname.includes('vercel.app');
    this.isFirebase = window.location.hostname.includes('firebaseapp.com') || 
                      window.location.hostname.includes('web.app');
    this.proxyUrl = process.env.REACT_APP_AI_PROXY_URL || '';
    
    // conversation history
    this.conversationHistory = [];
    this.maxHistoryLength = 15; // maximum conversation history length
    
    logger.log('AI Service Initialized:', {
      isProduction: this.isProduction,
      isVercel: this.isVercel,
      isFirebase: this.isFirebase,
      usingProxy: !!this.proxyUrl || this.isFirebase || this.isVercel
    });
  }

  /**
   * clear conversation history
   */
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  /**
   * add message to conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    // keep conversation history within the limit
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      // remove the oldest conversation, but keep the latest
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  /**
   * Call AI API to get response
   * @param {string} message - User's message
   * @param {Array} recommendations - Current restaurant recommendations list
   * @param {Object} userLocation - User location information
   * @param {Object} selectedRestaurant - Selected restaurant with menu info
   * @returns {Promise<string>} AI response
   */
  async getAIResponse(message, recommendations, userLocation, selectedRestaurant = null) {
    try {
      // Save context info for proxy use
      this.currentRecommendations = recommendations;
      this.currentUserLocation = userLocation;
      this.currentSelectedRestaurant = selectedRestaurant;
      
      // Build context information
      const context = this.buildContext(recommendations, userLocation, selectedRestaurant);
      
      // Build system prompt (role setting)
      const systemPrompt = this.buildSystemPrompt(context);
      
      // add user message to history
      this.addToHistory('user', message);
      
      // build complete messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory
      ];
      
      // Call AI API
      const response = await this.callAIAPI(messages);
      
      // add AI response to history
      this.addToHistory('assistant', response);
      
      return response;
    } catch (error) {
      logger.error('AI Service Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Build context information
   */
  buildContext(recommendations, userLocation, selectedRestaurant = null) {
    let context = '';
    
    if (userLocation) {
      context += `📍 User's current location: Latitude ${userLocation.lat.toFixed(4)}, Longitude ${userLocation.lng.toFixed(4)}\n\n`;
    }
    
    if (recommendations && recommendations.length > 0) {
      context += 'Available nearby restaurants:\n';
      recommendations.slice(0, 8).forEach((place, index) => {
        context += `\n${index + 1}. **${place.name}**\n`;
        context += `   Rating: ${place.rating || 'N/A'} ${place.user_ratings_total ? `(${place.user_ratings_total} reviews)` : ''}\n`;
        context += `   Distance: ${place.distance ? place.distance.toFixed(2) + ' km' : 'Unknown'}\n`;
        context += `   Address: ${place.vicinity || 'Address not available'}\n`;
        if (place.price_level !== undefined) {
          context += `   Price: ${'$'.repeat(place.price_level + 1)} (${this.getPriceLevelDescription(place.price_level)})\n`;
        }
        if (place.opening_hours) {
          context += `   Status: ${place.opening_hours.open_now ? 'Currently Open' : 'Currently Closed'}\n`;
        }
        if (place.types && place.types.length > 0) {
          const cuisineTypes = place.types.filter(t => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t));
          if (cuisineTypes.length > 0) {
            context += `   Type: ${cuisineTypes.slice(0, 3).join(', ')}\n`;
          }
        }
      });
    } else {
      context += '⚠️ No restaurant recommendations available. The user needs to search for restaurants first.\n';
    }

    // Add selected restaurant menu information if available
    if (selectedRestaurant && selectedRestaurant.menu) {
      context += `\n\n Currently Viewing Restaurant: **${selectedRestaurant.name}**\n`;
      context += 'Menu Details:\n';
      selectedRestaurant.menu.categories.forEach(category => {
        context += `\n**${category.name}:**\n`;
        category.items.forEach(item => {
          context += `  • ${item.name} - $${item.price}`;
          if (item.description) {
            context += ` (${item.description})`;
          }
          context += '\n';
        });
      });
    }
    
    return context;
  }

  /**
   * get price level description
   */
  getPriceLevelDescription(level) {
    const descriptions = ['Very Affordable', 'Affordable', 'Moderate', 'Expensive', 'Very Expensive'];
    return descriptions[level] || 'Unknown';
  }

  /**
   * Build system prompt - set AI role and behavior
   */
  buildSystemPrompt(context) {
    const currentTime = new Date().toLocaleString('en-US', { 
      weekday: 'long', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    return `You are a friendly and knowledgeable AI restaurant assistant. Your name is "FoodieBot" 🤖

## Your Personality:
- Warm, helpful, and enthusiastic about food
- Concise but informative in your responses
- Use emojis occasionally to make conversations engaging
- Adapt your response style to match the user's tone

## Current Context:
- Current time: ${currentTime}
${context}

## Core Capabilities:
1. **Restaurant Recommendations**: Suggest restaurants based on user preferences (cuisine type, price, distance, ratings)
2. **Menu Guidance**: Help users choose dishes if menu information is available
3. **Comparisons**: Compare multiple restaurants based on specific criteria
4. **General Q&A**: Answer food-related questions and provide dining tips

## Response Guidelines:
1. **Be Relevant**: Always base your recommendations on the available restaurant data above
2. **Be Specific**: When recommending, mention restaurant name, rating, distance, and why it fits the user's needs
3. **Be Honest**: If no restaurants match the criteria or no data is available, say so clearly
4. **Be Conversational**: Remember the conversation context and refer back to previous exchanges when relevant
5. **Handle Languages**: Respond in the same language the user uses. If user speaks Chinese, respond in Chinese. If English, respond in English.
6. **Keep it Focused**: Provide 1-3 recommendations unless asked for more

## Important Rules:
- Only recommend restaurants from the provided list above
- If user asks about a restaurant not in the list, explain you don't have information about it
- For menu questions, only answer if menu data is available
- Don't make up information about restaurants or menus`;
  }

  /**
   * Call actual AI API via proxy
   * @param {Array} messages - complete conversation messages array [{role, content}, ...]
   */
  async callAIAPI(messages) {
    // Use external proxy if configured
    if (this.proxyUrl) {
      return await this.callViaExternalProxy(messages);
    }
    // Use Firebase/Vercel proxy
    if (this.isFirebase || this.isVercel) {
      return await this.callViaProxy(messages);
    }
    
    // Local development - also use proxy
    return await this.callViaProxy(messages);
  }

  /**
   * Call AI service via API proxy
   * @param {Array} messages - complete conversation messages array
   */
  async callViaProxy(messages) {
    try {
      logger.log('🔄 Using API proxy to call AI service');
      logger.log('📝 Sending messages:', messages.length, 'messages');
      
      const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          // the following information is for backend record, the actual context is already included in the system message
          metadata: {
            hasRecommendations: this.currentRecommendations?.length > 0,
            hasUserLocation: !!this.currentUserLocation,
            hasSelectedRestaurant: !!this.currentSelectedRestaurant,
            conversationLength: this.conversationHistory.length
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      logger.error('AI Proxy Error:', error);
      return `AI service temporarily unavailable: ${error.message}`;
    }
  }

  /**
   * Call AI service via external proxy (e.g., Cloudflare/Vercel/Netlify URL)
   * @param {Array} messages - complete conversation messages array
   */
  async callViaExternalProxy(messages) {
    try {
      logger.log('🔄 Using External API proxy to call AI service', this.proxyUrl);
      logger.log('📝 Sending messages:', messages.length, 'messages');
      
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          metadata: {
            hasRecommendations: this.currentRecommendations?.length > 0,
            hasUserLocation: !!this.currentUserLocation,
            hasSelectedRestaurant: !!this.currentSelectedRestaurant,
            conversationLength: this.conversationHistory.length
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.result || '';
    } catch (error) {
      logger.error('External AI Proxy Error:', error);
      return `AI service temporarily unavailable: ${error.message}`;
    }
  }

  /**
   * Check if AI service is available
   */
  async checkAvailability() {
    try {
      // Send a simple test request
      const testResponse = await this.getAIResponse('Hello', [], null);
      return testResponse !== null;
    } catch (error) {
      logger.error('AI Service not available:', error);
      return false;
    }
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
