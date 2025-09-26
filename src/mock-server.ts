import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { mockApiService } from './services/mock-api';

const PORT = process.env.MOCK_API_PORT || 3001;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Mock API endpoints
  if (path === '/mock-api/listings' && req.method === 'GET') {
    // Get all listings
    const data = mockApiService.getMockData();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
    return;
  }

  if (path.startsWith('/mock-api/listings/') && req.method === 'GET') {
    // Get specific listing by slug
    const slug = path.split('/').pop();
    if (slug) {
      const listing = mockApiService.getDetailedListing(slug);
      
      if (listing) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(listing, null, 2));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Listing not found' }, null, 2));
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid slug' }, null, 2));
    }
    return;
  }

  if (path === '/mock-api/health' && req.method === 'GET') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      listingsCount: mockApiService.getMockData().length
    }, null, 2));
    return;
  }

  if (path === '/mock-api/reset' && req.method === 'POST') {
    // Reset mock data
    mockApiService.resetMockData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Mock data reset successfully',
      listingsCount: mockApiService.getMockData().length
    }, null, 2));
    return;
  }



  if (path === '/mock-api/status' && req.method === 'GET') {
    // Get mock API status
    const data = mockApiService.getMockData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      timestamp: new Date().toISOString(),
      totalListings: data.length,
      sponsors: [...new Set(data.map(l => l.sponsor.name))],
      types: [...new Set(data.map(l => l.type))],
      tokens: [...new Set(data.map(l => l.token))],
      recentListings: data.slice(-5).map(l => ({
        title: l.title,
        rewardAmount: l.rewardAmount,
        token: l.token,
        type: l.type,
        sponsor: l.sponsor.name
      }))
    }, null, 2));
    return;
  }

  // Default response for unknown endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /mock-api/listings',
      'GET /mock-api/listings/:slug',
      'GET /mock-api/health',
      'GET /mock-api/status',
      'POST /mock-api/reset'
    ]
  }, null, 2));
});

server.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /mock-api/listings     - Get all listings (fresh data each time)`);
  console.log(`   GET  /mock-api/listings/:slug - Get specific listing`);
  console.log(`   GET  /mock-api/health       - Health check`);
  console.log(`   GET  /mock-api/status       - API status`);
  console.log(`   POST /mock-api/reset        - Reset mock data`);
  console.log(`⏰ Dynamic data: Changes on every request`);
  console.log(`📝 Data updates: ${mockApiService.getMockData().length} initial listings`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Mock API Server...');
  mockApiService.stopAutoUpdate();
  server.close(() => {
    console.log('✅ Mock API Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Mock API Server...');
  mockApiService.stopAutoUpdate();
  server.close(() => {
    console.log('✅ Mock API Server stopped');
    process.exit(0);
  });
});

export default server; 