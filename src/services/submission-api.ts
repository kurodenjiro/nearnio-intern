import createDebug from 'debug';

const debug = createDebug('bot:submission-api');

interface Submission {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  attachments?: string[];
}

interface SubmissionApiResponse {
  submissions: Submission[];
  total: number;
  hasMore: boolean;
}

export class SubmissionApiService {
  private static instance: SubmissionApiService;
  private submissionCache: Map<string, { data: SubmissionApiResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  private constructor() {}

  public static getInstance(): SubmissionApiService {
    if (!SubmissionApiService.instance) {
      SubmissionApiService.instance = new SubmissionApiService();
    }
    return SubmissionApiService.instance;
  }

  async fetchSubmissions(sponsorSlug: string, listingId: number): Promise<SubmissionApiResponse> {
    try {
      const cacheKey = `${sponsorSlug}-${listingId}`;
      const cached = this.submissionCache.get(cacheKey);
      
      // Check if we have valid cached data
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        debug(`Using cached submissions for ${sponsorSlug}/${listingId}`);
        return cached.data;
      }

      const url = `${process.env.SERVER_URL || 'https://nearn.io'}/_next/data/${process.env.NEXT_DATA_HASH}/${sponsorSlug}/${listingId}/submission.json`;
      debug(`Fetching submissions from: ${url}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          debug(`No submissions found for ${sponsorSlug}/${listingId}`);
          return { submissions: [], total: 0, hasMore: false };
        }
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }

      const data: SubmissionApiResponse = await response.json();
      
      // Cache the result
      this.submissionCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      debug(`Fetched ${data.submissions.length} submissions for ${sponsorSlug}/${listingId}`);
      return data;
    } catch (error) {
      debug(`Error fetching submissions for ${sponsorSlug}/${listingId}:`, error);
      
      // Return empty result on error
      return { submissions: [], total: 0, hasMore: false };
    }
  }

  async getNewSubmissions(sponsorSlug: string, listingId: number, lastCheckTime: Date): Promise<Submission[]> {
    try {
      const data = await this.fetchSubmissions(sponsorSlug, listingId);
      const newSubmissions = data.submissions.filter(submission => 
        new Date(submission.createdAt) > lastCheckTime
      );
      
      debug(`Found ${newSubmissions.length} new submissions since ${lastCheckTime.toISOString()}`);
      return newSubmissions;
    } catch (error) {
      debug(`Error getting new submissions:`, error);
      return [];
    }
  }

  async getApprovedSubmissions(sponsorSlug: string, listingId: number, lastCheckTime: Date): Promise<Submission[]> {
    try {
      const data = await this.fetchSubmissions(sponsorSlug, listingId);
      const approvedSubmissions = data.submissions.filter(submission => 
        submission.status === 'approved' && 
        new Date(submission.updatedAt) > lastCheckTime
      );
      
      debug(`Found ${approvedSubmissions.length} newly approved submissions since ${lastCheckTime.toISOString()}`);
      return approvedSubmissions;
    } catch (error) {
      debug(`Error getting approved submissions:`, error);
      return [];
    }
  }

  clearCache(): void {
    this.submissionCache.clear();
    debug('Submission cache cleared');
  }
}
