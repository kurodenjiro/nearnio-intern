# Vercel Cron Jobs Setup

This document explains how the cron jobs have been migrated from `node-cron` to Vercel's built-in cron job system.

## Overview

The bot now uses Vercel's cron jobs instead of the `node-cron` library for better reliability and serverless compatibility.

## Cron Job Endpoints

### 1. Sync Endpoint (`/api/cron/sync`)
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Purpose**: Fetches new listings from Superteam API and syncs them to the database
- **File**: `api/cron/sync.ts`

### 2. Notifications Endpoint (`/api/cron/notifications`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Checks for new listings and sends notifications to subscribed users
- **File**: `api/cron/notifications.ts`

### 3. Reminders Endpoint (`/api/cron/reminders`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Checks for due reminders and sends deadline notifications
- **File**: `api/cron/reminders.ts`

## Configuration

### Vercel Configuration (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/notifications",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables
Add these to your Vercel environment variables:

```bash
# Required for cron job authentication
CRON_SECRET=your-secret-key-here

# Optional: Override default schedules
SYNC_CRON_SCHEDULE=*/15 * * * *
NOTIFICATION_CRON_SCHEDULE=*/5 * * * *
REMINDER_CRON_SCHEDULE=*/5 * * * *
```

## Security

Each cron endpoint verifies the request using the `CRON_SECRET` environment variable:

```typescript
if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## Testing

### Local Testing
```bash
npm run test-vercel-cron
```

### Manual Testing
You can test the endpoints manually by making HTTP requests:

```bash
# Test sync endpoint
curl -X POST https://your-domain.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"

# Test notifications endpoint
curl -X POST https://your-domain.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"

# Test reminders endpoint
curl -X POST https://your-domain.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer your-cron-secret"
```

## Migration Changes

### Removed Dependencies
- `node-cron` - No longer needed
- `@types/node-cron` - No longer needed

### Updated Files
1. **`src/services/cronjob.ts`**
   - Removed `node-cron` import
   - Removed cron job scheduling logic
   - Made methods public for API access
   - Simplified start/stop methods

2. **`src/index.ts`**
   - Removed automatic cron job startup
   - Cron jobs now handled by Vercel

3. **`vercel.json`**
   - Added cron job configuration
   - Defined schedules for each endpoint

### New Files
1. **`api/cron/sync.ts`** - Sync endpoint handler
2. **`api/cron/notifications.ts`** - Notifications endpoint handler
3. **`api/cron/reminders.ts`** - Reminders endpoint handler
4. **`scripts/test-vercel-cron.ts`** - Testing script

## Benefits

### Reliability
- Vercel's cron jobs are more reliable than `node-cron`
- Automatic retry on failures
- Better monitoring and logging

### Serverless Compatibility
- No need to keep a process running
- Scales automatically with demand
- Cost-effective for low-frequency tasks

### Monitoring
- Vercel provides built-in monitoring
- Easy to track execution times and failures
- Integration with Vercel analytics

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that `CRON_SECRET` is set in Vercel environment variables
   - Verify the secret matches in your requests

2. **Cron jobs not running**
   - Check Vercel deployment logs
   - Verify cron configuration in `vercel.json`
   - Ensure endpoints are accessible

3. **Database connection issues**
   - Check database connection string
   - Verify Prisma client is properly generated
   - Check for connection limits

### Debugging
- Check Vercel function logs in the dashboard
- Use `console.log` statements in cron endpoints
- Monitor database for sync timestamps

## Deployment

1. **Set Environment Variables**
   ```bash
   vercel env add CRON_SECRET
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Verify Cron Jobs**
   - Check Vercel dashboard for cron job status
   - Monitor function logs for execution
   - Test endpoints manually

## Monitoring

### Vercel Dashboard
- Function execution logs
- Performance metrics
- Error tracking

### Database Monitoring
- Check `system_config` table for last sync times
- Monitor notification logs
- Track reminder activity

### Custom Monitoring
You can add custom monitoring by checking the response from cron endpoints:

```typescript
const response = await fetch('/api/cron/sync', {
  headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
});
const result = await response.json();
console.log('Sync result:', result);
``` 