import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MockListing {
  rewardAmount: number;
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
  };
  sponsor: {
    name: string;
    slug: string;
    logo: string;
    isVerified: boolean;
  };
}

class MockApiService {
  private mockData: MockListing[] = [];
  private envFilePath: string;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.envFilePath = join(process.cwd(), '.env');
    this.initializeMockData();
    this.startAutoUpdate();
  }

  private initializeMockData() {
    this.mockData = [
      {
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
          Comments: 14
        },
        sponsor: {
          name: 'NEAR DevHub',
          slug: 'devhub',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745002189/qutym1mzzo3ba5qwshia.png',
          isVerified: false
        }
      },
      {
        rewardAmount: 250,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'bounty',
        title: 'Create a DAO Reviewer Shade Agent Tutorial',
        sequentialId: 1,
        token: 'USDC',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'create-a-dao-reviewer-shade-agent-tutorial',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'fixed',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 0
        },
        sponsor: {
          name: 'Blockchain Acceleration Foundation',
          slug: 'thebafnetwork',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1752765602/d6dvsw3kfaegphpz6hul.png',
          isVerified: false
        }
      },
      {
        rewardAmount: 102,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'bounty',
        title: 'StakeWars with Qbit',
        sequentialId: 1,
        token: 'NEAR',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'stakewars-with-qbit',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'fixed',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 7
        },
        sponsor: {
          name: 'Q-Bit',
          slug: 'qbit',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1752159707/lr9egnkdpolvpirkg6et.png',
          isVerified: false
        }
      },
      {
        rewardAmount: 120,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'bounty',
        title: 'Make a Background Illustration for Intear Wallet',
        sequentialId: 1,
        token: 'USDC',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'intear-wallet-background',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'fixed',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 3
        },
        sponsor: {
          name: 'Intear',
          slug: 'intear',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1750257047/ibvndqwvdwhkxexl0fjv.png',
          isVerified: false
        }
      },
      {
        rewardAmount: 250,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'bounty',
        title: 'Implement Sign NEP-413 off-chain messages in near-cli-rs',
        sequentialId: 20,
        token: 'USDC',
        isPublished: true,
        isPrivate: false,
        winnersAnnouncedAt: null,
        slug: 'implement-sign-nep-413-off-chain-messages-in-near-cli-rs',
        isWinnersAnnounced: false,
        isFeatured: false,
        compensationType: 'fixed',
        minRewardAsk: null,
        maxRewardAsk: null,
        status: 'OPEN',
        _count: {
          Comments: 3
        },
        sponsor: {
          name: 'NEAR DevHub',
          slug: 'devhub',
          logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745002189/qutym1mzzo3ba5qwshia.png',
          isVerified: false
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
      'DeFi Yield Optimizer',
      'Web3 Social Network',
      'Blockchain Explorer Enhancement',
      'Smart Contract Library',
      'Token Launch Platform',
      'Decentralized Exchange'
    ];

    const tokens = ['NEAR', 'USDC', 'USDT', 'Any'];
    const types: ('bounty' | 'project')[] = ['bounty', 'project'];
    const sponsors = [
      { name: 'NEAR DevHub', slug: 'devhub', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1745002189/qutym1mzzo3ba5qwshia.png' },
      { name: 'Blockchain Acceleration Foundation', slug: 'thebafnetwork', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1752765602/d6dvsw3kfaegphpz6hul.png' },
      { name: 'Q-Bit', slug: 'qbit', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1752159707/lr9egnkdpolvpirkg6et.png' },
      { name: 'Intear', slug: 'intear', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1750257047/ibvndqwvdwhkxexl0fjv.png' },
      { name: 'Firehose', slug: 'firehose', verified: false, logo: 'https://res.cloudinary.com/dyydcyyje/image/upload/v1749299030/oni6wy19znu5hn9lkims.png' }
    ];

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
    const randomReward = Math.floor(Math.random() * 1000) + 100;
    const randomDeadline = new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000);
    const randomSequentialId = Math.floor(Math.random() * 100) + 1;

    return {
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
      isFeatured: Math.random() > 0.8, // 20% chance to be featured
      compensationType: 'fixed',
      minRewardAsk: null,
      maxRewardAsk: null,
      status: 'OPEN',
      _count: {
        Comments: Math.floor(Math.random() * 20)
      },
      sponsor: {
        name: randomSponsor.name,
        slug: randomSponsor.slug,
        logo: randomSponsor.logo,
        isVerified: randomSponsor.verified
      }
    };
  }



  private updateMockData() {
    // Always keep some base listings but modify them
    if (this.mockData.length === 0) {
      this.initializeMockData();
    }

    // Randomly remove some listings (30% chance)
    this.mockData = this.mockData.filter(() => Math.random() > 0.3);

    // Add 1-4 new listings
    const newListingsCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < newListingsCount; i++) {
      this.mockData.push(this.generateNewListing());
    }

    // Update existing listings with fresh data
    this.mockData.forEach(listing => {
      // 50% chance to update each listing
      if (Math.random() < 0.5) {
        // Update comment count
        listing._count.Comments += Math.floor(Math.random() * 5);
        
        // Update reward amount (small changes)
        const rewardChange = Math.floor(Math.random() * 100) - 50; // -50 to +50
        listing.rewardAmount = Math.max(10, listing.rewardAmount + rewardChange);
        
        // Update deadline (extend or shorten)
        const deadlineChange = Math.floor(Math.random() * 7) - 3; // -3 to +3 days
        const currentDeadline = new Date(listing.deadline);
        currentDeadline.setDate(currentDeadline.getDate() + deadlineChange);
        listing.deadline = currentDeadline.toISOString();
        
        // Randomly change status
        if (Math.random() < 0.1) {
          listing.status = listing.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        }
        
        // Randomly announce winners
        if (Math.random() < 0.05) {
          listing.isWinnersAnnounced = true;
          listing.winnersAnnouncedAt = new Date().toISOString();
        }
      }
    });

    // Shuffle the array to change order
    this.mockData.sort(() => Math.random() - 0.5);

    console.log(`[Mock API] Generated fresh data: ${this.mockData.length} listings`);
  }

  private updateEnvFile() {
    try {
      let envContent = '';
      
      if (existsSync(this.envFilePath)) {
        envContent = readFileSync(this.envFilePath, 'utf8');
      }

      // Update or add SUPERTEAM_API_BASE
      const apiBaseRegex = /^SUPERTEAM_API_BASE=.*$/m;
      const newApiBase = 'SUPERTEAM_API_BASE=http://localhost:3001/mock-api';
      
      if (apiBaseRegex.test(envContent)) {
        envContent = envContent.replace(apiBaseRegex, newApiBase);
      } else {
        envContent += `\n${newApiBase}\n`;
      }

      // Add mock API configuration
      const mockConfig = `
# Mock API Configuration
MOCK_API_ENABLED=true
MOCK_API_PORT=3001
MOCK_API_UPDATE_INTERVAL=60000
`;

      if (!envContent.includes('MOCK_API_ENABLED')) {
        envContent += mockConfig;
      }

      writeFileSync(this.envFilePath, envContent);
      console.log('[Mock API] Updated .env file');
    } catch (error) {
      console.error('[Mock API] Error updating .env file:', error);
    }
  }

  public startAutoUpdate() {
    // Update every minute (60000ms)
    this.updateInterval = setInterval(() => {
      this.updateMockData();
      this.updateEnvFile();
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
    // Generate fresh data on each request
    this.updateMockData();
    return this.mockData;
  }

  public getMockDataAsApiResponse() {
    // Generate fresh data on each request
    this.updateMockData();
    return {
      data: this.mockData,
      meta: {
        total: this.mockData.length,
        page: 1,
        limit: 50,
        hasMore: false
      }
    };
  }

  public getDetailedListing(slug: string): MockListing | null {
    return this.mockData.find(listing => listing.slug === slug || listing.sequentialId.toString() === slug) || null;
  }

  public resetMockData() {
    this.initializeMockData();
    console.log('[Mock API] Mock data reset');
  }


}

export const mockApiService = new MockApiService();
export default mockApiService; 