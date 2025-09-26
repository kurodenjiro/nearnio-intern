import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MockListing {
  id: number;
  rewardAmount: number | null;
  deadline: string;
  type: 'bounty' | 'project';
  title: string;
  sequentialId: number;
  token: string;
  isPublished: boolean;
  isPrivate: boolean;
  winnersAnnouncedAt: string | null;
  slug: string;
  isWinnersAnnounced: boolean;
  isFeatured: boolean;
  compensationType: 'fixed' | 'variable';
  minRewardAsk: number | null;
  maxRewardAsk: number | null;
  status: 'OPEN' | 'CLOSED';
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

class MockApiService {
  private mockData: MockListing[] = [];
  private envFilePath: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private nextId: number = 1;

  constructor() {
    this.envFilePath = join(process.cwd(), '.env');
    this.initializeMockData();
    this.startAutoUpdate();
  }

  private generateUniqueId(): number {
    return this.nextId++;
  }

  private initializeMockData() {
    this.mockData = [
      {
        id: this.generateUniqueId(),
        rewardAmount: 3000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'bounty',
        title: 'Automate Generation of TypeScript RPC Client for NEAR Protocol',
        sequentialId: 13,
        token: 'NEAR',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'automate-generation-of-typescript-rpc-client-for-near-protocol',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'fixed',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 14,
          Submission: 3
        },
        sponsor: {
          name: 'NEAR DevHub',
          slug: 'devhub',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745002189/qutym1mzzo3ba5qwshia.png',
          isVerified: false,
          st: false
        }
      },
      {
        id: this.generateUniqueId(),
        rewardAmount: null, // NULL REWARD AMOUNT FOR TESTING
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'project',
        title: 'Chain Abstracted Relayer - Variable Compensation',
        sequentialId: 999,
        token: 'Any',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'chain-abstracted-relayer-variable-compensation',
        isWinnersAnnounced: false,
        isFeatured: true,
        compensationType: 'variable',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 5,
          Submission: 0
        },
        sponsor: {
          name: 'Infrastructure Committee',
          slug: 'infra-committee',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745424790/lpbjybyqs7nf9kxg4kki.png',
          isVerified: false,
          st: false
        }
      }
    ];
  }

  private generateNewListing(): MockListing {
    const titles = [
      'AI-Powered Analytics Dashboard',
      'NFT Marketplace Integration',
      'Cross-Chain Bridge Development',
      'DAO Governance Platform',
      'DeFi Yield Optimizer'
    ];

    const tokens = ['NEAR', 'USDC', 'USDT', 'Any'];
    const types: ('bounty' | 'project')[] = ['bounty', 'project'];
    const sponsors = [
      { name: 'NEAR DevHub', slug: 'devhub', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745002189/qutym1mzzo3ba5qwshia.png' },
      { name: 'Blockchain Acceleration Foundation', slug: 'thebafnetwork', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1752765602/d6dvsw3kfaegphpz6hul.png' }
    ];

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
    const randomReward = Math.floor(Math.random() * 1000) + 100;
    const randomDeadline = new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000);
    const randomSequentialId = Math.floor(Math.random() * 100) + 1;

    return {
      id: this.generateUniqueId(),
      rewardAmount: randomReward,
      deadline: randomDeadline.toISOString(),
      type: randomType,
      title: randomTitle,
      sequentialId: randomSequentialId,
      token: randomToken,
      isPublished: true,
      isPrivate: false,
      winnersAnnouncedAt: null,
      slug: randomTitle.toLowerCase().replace(/\s+/g, '-'),
      isWinnersAnnounced: false,
      isFeatured: Math.random() > 0.8,
      compensationType: 'fixed',
      minRewardAsk: null,
      maxRewardAsk: null,
      status: 'OPEN',
      _count: {
        Comments: Math.floor(Math.random() * 20),
        Submission: Math.floor(Math.random() * 10)
      },
      sponsor: {
        name: randomSponsor.name,
        slug: randomSponsor.slug,
        logo: randomSponsor.logo,
        isVerified: randomSponsor.verified,
        st: false
      }
    };
  }

  private updateMockData() {
    if (this.mockData.length === 0) {
      this.initializeMockData();
    }

    this.mockData = this.mockData.filter(() => Math.random() > 0.3);

    const newListingsCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < newListingsCount; i++) {
      this.mockData.push(this.generateNewListing());
    }

    this.mockData.forEach(listing => {
      if (Math.random() < 0.5) {
        listing._count.Comments += Math.floor(Math.random() * 5);
        
        if (listing.rewardAmount !== null) {
          const rewardChange = Math.floor(Math.random() * 100) - 50;
          listing.rewardAmount = Math.max(10, listing.rewardAmount + rewardChange);
        }
        
        const deadlineChange = Math.floor(Math.random() * 7) - 3;
        const currentDeadline = new Date(listing.deadline);
        currentDeadline.setDate(currentDeadline.getDate() + deadlineChange);
        listing.deadline = currentDeadline.toISOString();
        
        if (Math.random() < 0.1) {
          listing.status = listing.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        }
        
        if (Math.random() < 0.05) {
          listing.isWinnersAnnounced = true;
          listing.winnersAnnouncedAt = new Date().toISOString();
        }
      }
    });
  }

  private startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      this.updateMockData();
    }, 60000);

    console.log('[Mock API] Auto-update started (every 1 minute)');
  }

  public stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('[Mock API] Auto-update stopped');
    }
  }

  public getMockData(): MockListing[] {
    this.updateMockData();
    return this.mockData;
  }

  public getDetailedListing(slug: string): MockListing | null {
    return this.mockData.find(listing => 
      listing.slug === slug || listing.sequentialId.toString() === slug
    ) || null;
  }

  public resetMockData() {
    this.mockData = [];
    this.initializeMockData();
    console.log('[Mock API] Mock data reset');
  }
}

export const mockApiService = new MockApiService();
