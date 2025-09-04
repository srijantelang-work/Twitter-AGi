/**
 * AI Configuration for Groq Cloud API
 * 
 * This file contains configuration for AI-powered features including:
 * - Response generation
 * - Intent detection
 * - Content creation
 * - Agent personality settings
 */

export const AI_CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192', // Fast and efficient model
    maxTokens: 500,
    temperature: 0.7,
    topP: 0.9,
    timeout: 30000, // 30 seconds
  },
  
  agent: {
    personality: {
      name: 'CommunityBot',
      tone: 'friendly',
      style: 'conversational',
      expertise: 'community building and engagement',
      language: 'English',
      emojiUsage: 'moderate',
      hashtagUsage: 'strategic',
    },
    
    response: {
      maxLength: 280, // Twitter character limit
      minConfidence: 0.7,
      autoApprove: false, // Require human approval for now
      maxDailyResponses: 50,
      cooldownMinutes: 15, // Wait between responses to same user
    },
    
    intent: {
      detectionThreshold: 0.6,
      categories: [
        'community_building',
        'customer_support',
        'engagement_opportunity',
        'spam_detection',
        'sentiment_analysis',
        'trending_topic',
        'influencer_interaction',
        'brand_mention'
      ]
    },
    
    engagement: {
      priorityKeywords: [
        'help',
        'support',
        'question',
        'feedback',
        'suggestion',
        'community',
        'connect',
        'collaborate'
      ],
      
      responseTemplates: {
        community_building: [
          'Thanks for reaching out! We love connecting with our community. {custom_response}',
          'Great to see you here! {custom_response} Let\'s build something amazing together.',
          'Welcome to the conversation! {custom_response} What\'s on your mind?'
        ],
        
        customer_support: [
          'We\'re here to help! {custom_response} Let us know if you need anything else.',
          'Thanks for bringing this to our attention. {custom_response} We\'re on it!',
          'We appreciate your patience. {custom_response} Our team is working on this.'
        ],
        
        engagement_opportunity: [
          'Love this energy! {custom_response} Keep the conversation going!',
          'This is exactly what our community is about! {custom_response}',
          'Amazing insight! {custom_response} What do others think?'
        ]
      }
    }
  },

  // AI Superconnector Configuration
  superconnector: {
    personality: {
      name: 'AI Superconnector',
      tone: 'friendly, confident, helpful',
      style: 'conversational, witty, professional',
      expertise: 'networking, AI, startup ecosystem, community building',
      brandVoice: 'approachable expert, connector, problem-solver',
      humorStyle: 'founder-friendly, tech-savvy, meme-aware',
      language: 'English',
      emojiUsage: 'strategic',
      hashtagUsage: 'targeted'
    },
    
    contentThemes: [
      'networking_tips',
      'ai_insights', 
      'startup_humor'
    ],
    
    postingSchedule: {
      frequency: '3-5 posts per day',
      optimalTimes: ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'],
      timezone: 'user_local',
      maxDailyPosts: 5,
      contentVariety: true
    },
    
    response: {
      maxLength: 280,
      minConfidence: 0.8,
      autoApprove: false,
      maxDailyResponses: 30,
      cooldownMinutes: 20
    },
    
    engagement: {
      priorityKeywords: [
        'networking',
        'startup',
        'founder',
        'ai',
        'community',
        'connect',
        'collaborate',
        'ecosystem',
        'innovation',
        'growth'
      ],
      
      responseTemplates: {
        networking_tips: [
          'Here\'s a networking insight that might help: {custom_response}',
          'Great question! Here\'s what I\'ve learned about networking: {custom_response}',
          'This is a common networking challenge. Here\'s my take: {custom_response}'
        ],
        
        ai_insights: [
          'Fascinating! Here\'s how AI is changing this space: {custom_response}',
          'Great observation! AI is indeed transforming this: {custom_response}',
          'This is exactly where AI can make a difference: {custom_response}'
        ],
        
        startup_ecosystem: [
          'This resonates with so many founders I know: {custom_response}',
          'Classic startup moment! Here\'s what I\'ve seen: {custom_response}',
          'This is the kind of insight that builds communities: {custom_response}'
        ]
      }
    }
  },
  
  monitoring: {
    sentiment: {
      positiveThreshold: 0.6,
      negativeThreshold: -0.4,
      neutralRange: [-0.3, 0.5]
    },
    
    engagement: {
      highEngagementThreshold: 100, // likes + retweets + replies
      viralThreshold: 1000,
      responsePriority: {
        high: 1,
        medium: 2,
        low: 3
      }
    }
  }
}

export const getGroqConfig = () => {
  if (!AI_CONFIG.groq.apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required')
  }
  
  return AI_CONFIG.groq
}

export const getAgentConfig = () => AI_CONFIG.agent

export const getSuperconnectorConfig = () => AI_CONFIG.superconnector

export const getMonitoringConfig = () => AI_CONFIG.monitoring
