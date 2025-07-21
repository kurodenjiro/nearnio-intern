export interface SuperteamListing {
  id: string;
  sequentialId?: string;
  title: string;
  rewardAmount: number;
  token: string;
  deadline: string;
  type: string;
  status: string;
  slug: string;
  isWinnersAnnounced: boolean;
  isFeatured: boolean;
  compensationType: string;
  minRewardAsk: number | null;
  maxRewardAsk: number | null;
  winnersAnnouncedAt: string | null;
  _count: {
    Comments: number;
    Submission: number;
  };
  sponsor: {
    name: string;
    slug: string;
    logo: string;
    isVerified: boolean;
    st: boolean;
  };
}

export interface SuperteamApiResponse extends Array<SuperteamListing> {}

export interface UserPreferences {
  userId: number;
  chatId: number;
  categories: string[];
  minBounty: number;
  maxBounty?: number;
  projectType: string; // 'bounty', 'project', or 'all'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

 