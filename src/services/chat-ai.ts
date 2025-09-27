import createDebug from 'debug';
import { DatabaseService } from './database';
import { escapeMarkdownV2 } from '../utils/markdown';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
const debug = createDebug('bot:chat-ai');

interface ChatSession {
  userId: number;
  listingId: number;
  sponsorSlug: string;
  sequentialId: number;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

interface ListingDetails {
  id: number;
  title: string;
  description: string;
  sponsorSlug: string;
  sequentialId: number;
  rewardAmount: number | null;
  token: string;
  deadline: string;
  type: string;
  status: string;
}

export class ChatAIService {
  private static instance: ChatAIService;
  private databaseService: DatabaseService;
  private activeSessions: Map<number, ChatSession> = new Map();

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  public static getInstance(): ChatAIService {
    if (!ChatAIService.instance) {
      ChatAIService.instance = new ChatAIService();
    }
    return ChatAIService.instance;
  }

  async startChatSession(userId: number, listingId: number): Promise<{ success: boolean; message: string; listingDetails?: ListingDetails | null }> {
    try {
      debug(`Starting chat session for user ${userId}, listing ${listingId}`);

      // Get listing details from database
      const listing = await this.databaseService.getListingById(listingId);
      if (!listing) {
        return { success: false, message: 'Listing not found' };
      }

      // Check if user already has an active session
      if (this.activeSessions.has(userId)) {
        const existingSession = this.activeSessions.get(userId)!;
        if (existingSession.isActive) {
          return { success: false, message: 'You already have an active chat session. Use /stopchat to end it first.' };
        }
      }

      // Create new session
      const session: ChatSession = {
        userId,
        listingId,
        sponsorSlug: listing.sponsorSlug,
        sequentialId: listing.sequentialId,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.activeSessions.set(userId, session);

      // Fetch detailed listing information from API
      const listingDetails = await this.fetchListingDetails(listing.sponsorSlug, listing.sequentialId);
      
      debug(`Chat session started for user ${userId}, listing ${listingId}`);
      return { 
        success: true, 
        message: `🤖 Chat AI session started for "${listing.title}"\n\nYou can now ask questions about this listing. Type /stopchat to end the session.`,
        listingDetails
      };
    } catch (error) {
      debug(`Error starting chat session:`, error);
      return { success: false, message: 'Failed to start chat session' };
    }
  }

  async stopChatSession(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      debug(`Stopping chat session for user ${userId}`);

      const session = this.activeSessions.get(userId);
      if (!session || !session.isActive) {
        return { success: false, message: 'No active chat session found' };
      }

      session.isActive = false;
      this.activeSessions.delete(userId);

      debug(`Chat session stopped for user ${userId}`);
      return { success: true, message: '🤖 Chat AI session ended. You can start a new session anytime.' };
    } catch (error) {
      debug(`Error stopping chat session:`, error);
      return { success: false, message: 'Failed to stop chat session' };
    }
  }

  async isChatActive(userId: number): Promise<boolean> {
    const session = this.activeSessions.get(userId);
    return session?.isActive === true;
  }

  async getChatSession(userId: number): Promise<ChatSession | null> {
    return this.activeSessions.get(userId) || null;
  }

  async processMessage(userId: number, message: string): Promise<{ success: boolean; response: string }> {
    try {
      const session = this.activeSessions.get(userId);
      if (!session || !session.isActive) {
        return { success: false, response: 'No active chat session. Start a chat session first.' };
      }

      // Update last activity
      session.lastActivity = new Date();

      // For now, return a simple response
      // In a real implementation, this would call an AI service
      const response = await this.generateAIResponse(session, message);
      
      return { success: true, response: escapeMarkdownV2(response) };
    } catch (error) {
      debug(`Error processing message:`, error);
      return { success: false, response: 'Sorry, I encountered an error processing your message.' };
    }
  }

  private async fetchListingDetails(sponsorSlug: string, sequentialId: number): Promise<ListingDetails | null> {
    try {
      const NEXT_DATA_HASH = process.env.NEXT_DATA_HASH || '_X';
      const url = `${process.env.SERVER_URL || 'https://nearn.io'}/_next/data/${NEXT_DATA_HASH}/${sponsorSlug}/${sequentialId}.json`;
      
      debug(`Fetching listing details from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const listing = data?.pageProps?.listing;

      if (!listing) {
        throw new Error('Listing data not found in API response');
      }

      return {
        id: listing.id,
        title: listing.title,
        description: listing.description || '',
        sponsorSlug: listing.sponsor?.slug || sponsorSlug,
        sequentialId: listing.sequentialId,
        rewardAmount: listing.rewardAmount,
        token: listing.token,
        deadline: listing.deadline,
        type: listing.type,
        status: listing.status
      };
    } catch (error) {
      debug(`Error fetching listing details:`, error);
      return null;
    }
  }

  private async generateAIResponse(session: ChatSession, message: string): Promise<string> {
    try {
      // Get listing details from the session
      const listing = await this.databaseService.getListingById(session.listingId);
      if (!listing) {
        return `I'm sorry, I couldn't find the listing details. Please try again.`;
      }

      // Create a context-rich prompt for the AI
      const systemPrompt = `You are a helpful AI assistant for the Nearn bounty platform. You help users understand listings and answer questions about them.

Listing Information:
- Title: ${listing.title}
- Type: ${listing.type}
- Reward: ${listing.rewardAmount} ${listing.token}
- Deadline: ${listing.deadline}
- Status: ${listing.status}
- Sponsor: ${listing.sponsorSlug}
- Description: ${listing.description || 'No description available'}

Please provide helpful, accurate responses about this listing. If you don't have specific information, suggest where the user can find it.`;

      // Use AI SDK generateText to generate response
      const result = await generateText({
        model: openai('gpt-3.5-turbo'),
        system: systemPrompt,
        prompt: message,
      });

      return result.text;
    } catch (error) {
      debug(`Error generating AI response:`, error);
      // Fallback to simple responses if AI fails
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('description') || lowerMessage.includes('what is') || lowerMessage.includes('about')) {
        return `This listing is about the project details. You can find more information in the listing description.`;
      }
      
      if (lowerMessage.includes('deadline') || lowerMessage.includes('when')) {
        return `The deadline for this listing is available in the listing details. Check the deadline information.`;
      }
      
      if (lowerMessage.includes('reward') || lowerMessage.includes('payment') || lowerMessage.includes('money')) {
        return `The reward amount and token information is available in the listing details.`;
      }
      
      if (lowerMessage.includes('how') || lowerMessage.includes('apply') || lowerMessage.includes('submit')) {
        return `To apply for this listing, you can view the full details and follow the application process described there.`;
      }
      
      // Default fallback response
      return `I understand you're asking about this listing. For specific details, please check the listing description and requirements. You can also ask me about the description, deadline, reward, or how to apply.`;
    }
  }

  // Clean up inactive sessions (call this periodically)
  cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    const entries = Array.from(this.activeSessions.entries());
    for (const [userId, session] of entries) {
      if (now.getTime() - session.lastActivity.getTime() > inactiveThreshold) {
        session.isActive = false;
        this.activeSessions.delete(userId);
        debug(`Cleaned up inactive session for user ${userId}`);
      }
    }
  }
}
