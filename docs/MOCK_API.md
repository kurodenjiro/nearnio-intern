# Mock Superteam API

This mock API service provides simulated Superteam API responses for testing the Telegram bot without hitting the real API endpoints.

## 🚀 Quick Start

### 1. Start the Mock API Server

```bash
# Start mock API server
npm run mock-api

# Or with auto-reload (development)
npm run mock-api:dev
```

### 2. Test the Mock API

```bash
# Test all endpoints
npm run test-mock
```

### 3. Use with Your Bot

Set the environment variable in your `.env` file:

```env
SUPERTEAM_API_BASE=http://localhost:3001/mock-api
```

Then start your bot normally:

```bash
npm run dev
```

## 📊 Available Endpoints

### GET `/mock-api/listings`
Returns all mock listings in the same format as the real Superteam API.

**Response:**
```json
{
  "data": [
    {
      "id": "mock-1",
      "title": "Build a DeFi Dashboard",
      "description": "Create a comprehensive DeFi dashboard...",
      "rewardAmount": 500,
      "token": "NEAR",
      "deadline": "2024-01-15T14:30:00.000Z",
      "submissionCount": 3,
      "sponsorName": "NEAR Protocol",
      "sponsorSlug": "near-protocol",
      "slug": "defi-dashboard",
      "sequentialId": "001",
      "type": "bounty",
      "status": "OPEN",
      "sponsorIsVerified": true,
      "mappedCategory": "DEV",
      "skills": [
        {
          "skills": "Frontend",
          "subskills": ["React", "TypeScript", "Tailwind CSS"]
        }
      ],
      "maxBounty": 1000,
      "minBounty": 500
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 50,
    "hasMore": false
  }
}
```

### GET `/mock-api/listings/:slug`
Returns a specific listing by slug or sequential ID.

### GET `/mock-api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "listingsCount": 5
}
```

### GET `/mock-api/status`
Returns detailed status information about the mock API.

**Response:**
```json
{
  "status": "running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalListings": 5,
  "categories": ["DEV", "DESIGN", "SECURITY", "CONTENT", "MOBILE"],
  "types": ["bounty", "project"],
  "tokens": ["NEAR", "USDC", "USDT", "Any"],
  "recentListings": [
    {
      "id": "mock-1",
      "title": "Build a DeFi Dashboard",
      "rewardAmount": 500,
      "token": "NEAR",
      "type": "bounty",
      "category": "DEV"
    }
  ]
}
```

### POST `/mock-api/reset`
Resets the mock data to initial state.

## 🔄 Auto-Update Features

The mock API automatically updates data every minute:

- **Adds 1-3 new listings** randomly
- **Removes 20% of old listings** randomly
- **Updates existing listings** (submission count, reward amount)
- **Updates .env file** with mock API configuration

## 📝 Mock Data Structure

### Initial Data
The mock API starts with 5 predefined listings:

1. **Build a DeFi Dashboard** - DEV bounty (500 NEAR)
2. **Design System for Web3 App** - DESIGN project (300 USDC)
3. **Smart Contract Audit** - SECURITY bounty (1000 NEAR)
4. **Content Creation for NEAR Ecosystem** - CONTENT bounty (200 USDC)
5. **Mobile App Development** - MOBILE project (750 NEAR)

### Generated Data
New listings are generated with:

- **Random titles** from a predefined list
- **Random categories** (DEV, DESIGN, SECURITY, CONTENT, MOBILE, MARKETING)
- **Random tokens** (NEAR, USDC, USDT, Any)
- **Random types** (bounty, project)
- **Random skills** with subskills
- **Random deadlines** (1-30 days from now)
- **Random reward amounts** (100-1000)

## 🛠️ Skills and Categories

### Available Skills
- **Frontend**: React, Vue.js, Angular, TypeScript, JavaScript
- **Backend**: Node.js, Python, Go, Java, Express
- **Blockchain**: NEAR Protocol, Ethereum, Rust, Solidity, Web3.js
- **Design**: Figma, Sketch, Adobe XD, UI/UX, Prototyping
- **Mobile**: React Native, Flutter, iOS, Android, Swift
- **DevOps**: Docker, Kubernetes, AWS, CI/CD, Monitoring

### Categories
- **DEV**: Development and programming
- **DESIGN**: UI/UX and design work
- **SECURITY**: Security and auditing
- **CONTENT**: Content creation and marketing
- **MOBILE**: Mobile app development
- **MARKETING**: Marketing and promotion

## 🔧 Configuration

### Environment Variables
The mock API automatically updates your `.env` file with:

```env
# Mock API Configuration
SUPERTEAM_API_BASE=http://localhost:3001/mock-api
MOCK_API_ENABLED=true
MOCK_API_PORT=3001
MOCK_API_UPDATE_INTERVAL=60000
```

### Customization
You can modify the mock data by editing `src/services/mock-api.ts`:

- Change initial listings in `initializeMockData()`
- Modify generation logic in `generateNewListing()`
- Adjust update frequency in `startAutoUpdate()`
- Add new skills in `generateRandomSkills()`

## 🧪 Testing Scenarios

### 1. Basic Notification Testing
```bash
# Start mock API
npm run mock-api

# In another terminal, start your bot
npm run dev

# Send /start to your bot and configure preferences
# Wait for notifications (updates every minute)
```

### 2. Different Categories
The mock API generates listings across all categories, so you can test:
- Category filtering
- Different skill requirements
- Various reward amounts and tokens

### 3. Edge Cases
The mock API includes:
- Verified and unverified sponsors
- Different project types (bounty vs project)
- Various deadline scenarios
- Different submission counts

### 4. Token Price Testing
Mock data includes different tokens:
- **NEAR**: Will be converted using real price API
- **USDC/USDT**: Stable coins
- **Any**: Special case (reward already in USD)

## 🚨 Troubleshooting

### Mock API Won't Start
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### Bot Can't Connect to Mock API
```bash
# Check if mock API is running
curl http://localhost:3001/mock-api/health

# Verify .env configuration
cat .env | grep SUPERTEAM_API_BASE
```

### No New Data
- Mock API updates every minute
- Check console logs for update messages
- Use `/mock-api/reset` to force refresh

## 📈 Monitoring

### Console Output
The mock API provides detailed logging:

```
🚀 Mock API Server running on http://localhost:3001
📊 Available endpoints:
   GET  /mock-api/listings     - Get all listings
   GET  /mock-api/listings/:slug - Get specific listing
   GET  /mock-api/health       - Health check
   GET  /mock-api/status       - API status
   POST /mock-api/reset        - Reset mock data
⏰ Auto-update: Every 1 minute
📝 Data updates: 5 initial listings
[Mock API] Updated data: 7 listings
[Mock API] Updated .env file
```

### Health Monitoring
```bash
# Check API health
curl http://localhost:3001/mock-api/health

# Get detailed status
curl http://localhost:3001/mock-api/status
```

## 🎯 Use Cases

1. **Development Testing**: Test bot functionality without API limits
2. **Notification Testing**: Verify notification formatting and delivery
3. **Filter Testing**: Test user preference filtering
4. **Performance Testing**: Test with consistent data
5. **Demo Purposes**: Show bot capabilities with predictable data
6. **Offline Development**: Work without internet connection

## 🔄 Switching Back to Real API

To switch back to the real Superteam API:

1. Stop the mock API server
2. Update your `.env` file:
   ```env
   SUPERTEAM_API_BASE=https://api.superteam.fun
   ```
3. Restart your bot

The bot will automatically use the real API when the mock API is not available. 