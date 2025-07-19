import createDebug from 'debug';
import { UserPreferences } from '../types/superteam';
import { DatabaseService } from './database';

const debug = createDebug('bot:storage');

export class StorageService {
  private static instance: StorageService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Preferences Methods
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    debug(`Saving preferences for user ${preferences.userId}`);
    await this.databaseService.saveUserPreferences(preferences);
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    return await this.databaseService.getUserPreferences(userId);
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<void> {
    await this.databaseService.updateUserPreferences(userId, updates);
    debug(`Updated preferences for user ${userId}`);
  }

  async deleteUserPreferences(userId: number): Promise<void> {
    await this.databaseService.deleteUserPreferences(userId);
    debug(`Deleted preferences for user ${userId}`);
  }

  async getAllActiveUsers(): Promise<UserPreferences[]> {
    return await this.databaseService.getAllActiveUsers();
  }



  // Utility Methods
  async userExists(userId: number): Promise<boolean> {
    const preferences = await this.databaseService.getUserPreferences(userId);
    return preferences !== null;
  }

  async getActiveUserCount(): Promise<number> {
    const users = await this.databaseService.getAllActiveUsers();
    return users.length;
  }
} 