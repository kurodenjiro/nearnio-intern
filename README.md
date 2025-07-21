# Superteam Bounty Notifications Bot

A Telegram bot that sends notifications for new bounties from [Superteam](https://earn.superteam.fun) based on user preferences.

## Features

- 🔔 **Real-time notifications** for new bounties
- 🎯 **Customizable preferences** (bounty amount, categories, project types)
- ⏰ **Automatic data sync** to database every 15 minutes
- 📧 **Smart notifications** from database every 5 minutes
- ⏸️ **Pause/Resume** notifications
- 📊 **Statistics** and user management
- 🗄️ **Database persistence** with Prisma
- 🚀 **Serverless deployment** on Vercel

## Setup

### 1. Environment Variables

Create a `.env` file with your bot token and API configuration:

```env
# Bot Configuration
BOT_TOKEN="<YOUR_BOT_API_TOKEN>"

# API Configuration
SUPERTEAM_API_BASE="https://earn.superteam.fun/api"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/superteam_bot"

# Cron Job Configuration (Vercel)
CRON_SECRET="<YOUR_CRON_SECRET_KEY>"

# Optional: Override default schedules
SYNC_CRON_SCHEDULE="*/15 * * * *"
NOTIFICATION_CRON_SCHEDULE="*/5 * * * *"
REMINDER_CRON_SCHEDULE="*/5 * * * *"
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Development

```bash
npm run dev
# or
yarn dev
```

### 5. Production Deployment

Deploy to Vercel:

1. **Fork this repository** to your GitHub account
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your forked repository
3. **Set environment variables** (see Environment Variables section below)
4. **Configure deployment settings**:
   - **⚠️ CRITICAL**: Disable Vercel Authentication
   - Go to Project Settings → Deployment Protection
   - Turn OFF "Vercel Authentication"
   - This is required for Telegram webhooks to work properly
5. **Deploy** the project

#### ⚠️ Important: Disable Vercel Authentication

**This step is crucial for the bot to function properly!**

Telegram webhooks require public access to your API endpoints. Vercel Authentication blocks these requests by default.

**How to disable:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Deployment Protection**
3. Find **"Vercel Authentication"**
4. **Turn it OFF** (toggle should be gray/disabled)
5. Save the changes

**Why this is needed:**
- Telegram sends webhook requests to your bot's API endpoint
- Vercel Authentication blocks these requests by default
- Without disabling it, your bot won't receive messages from users
- The bot will appear unresponsive to all commands

**Security Note:** The bot has its own authentication system through Telegram's API, so disabling Vercel Authentication doesn't compromise security.

## Bot Commands

### Setup & Configuration
- `/start` - Start the bot and setup process
- `/setup` - Configure your bounty preferences
- `/preferences` - View your current preferences
- `/edit` - Edit your preferences

### Information
- `/stats` - View your notification statistics
- `/help` - Show all available commands

### Management
- `/pause` - Pause notifications temporarily
- `/resume` - Resume notifications
- `/stop` - Stop all notifications and delete preferences

## User Preferences

Users can configure:

- **Bounty Range** - Choose from predefined ranges (Micro, Small, Medium, Large, Premium, Enterprise)
- **Categories** - All, Content, Design, Development, Other
- **Project Type** - Bounties or Projects

## API Integration

The bot fetches data from the Superteam API (configurable via `SUPERTEAM_API_BASE` environment variable):
```
https://earn.superteam.fun/api/listings?context=all&tab=bounties&category=All&status=open&sortBy=Date&order=asc
```

## Cron Jobs (Vercel)

The bot uses Vercel's built-in cron job system for reliable, serverless scheduling:

### 1. Data Sync (`/api/cron/sync`)
- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Purpose**: Fetches new listings from Superteam API and syncs to database
- **Endpoint**: `https://your-domain.vercel.app/api/cron/sync`

### 2. Notifications (`/api/cron/notifications`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Sends notifications to users for new listings
- **Endpoint**: `https://your-domain.vercel.app/api/cron/notifications`

### 3. Reminders (`/api/cron/reminders`)
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Sends deadline reminders to users
- **Endpoint**: `https://your-domain.vercel.app/api/cron/reminders`

### Configuration

Cron schedules are configured in `vercel.json`:
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

### Security

All cron endpoints require authentication using the `CRON_SECRET` environment variable:
```bash
# Test a cron endpoint
curl -X POST https://your-domain.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"
```

### Monitoring

- **Vercel Dashboard**: Check cron job execution status
- **Function Logs**: Monitor for errors and performance
- **Database**: Track last sync times in `system_config` table

## Architecture

- **Services**: API integration, database operations, notifications, reminder management
- **Commands**: User interaction handlers
- **Types**: TypeScript interfaces for data structures
- **Database**: Prisma ORM with PostgreSQL
- **Cron Jobs**: Vercel-managed scheduled tasks (sync, notifications, reminders)
- **API Endpoints**: Serverless functions for webhook handling and cron jobs

## Development

### Project Structure

```
src/
├── commands/          # Bot command handlers
├── services/          # Business logic services
├── types/            # TypeScript type definitions
├── core/             # Development/production setup
└── index.ts          # Main entry point
```

### Adding New Features

1. Create new command in `src/commands/`
2. Add service logic in `src/services/`
3. Update types in `src/types/`
4. Register command in `src/index.ts`

## Troubleshooting

### Common Issues

#### 🤖 Bot Not Responding to Commands

**Problem:** Bot is deployed but doesn't respond to any commands.

**Solution:** 
1. **Check Vercel Authentication** - This is the most common issue!
   - Go to Vercel Dashboard → Project Settings → Deployment Protection
   - Make sure "Vercel Authentication" is **TURNED OFF**
   - If it's enabled, Telegram webhooks are blocked

2. **Verify Environment Variables**
   - Check that `BOT_TOKEN` is set correctly
   - Ensure `DATABASE_URL` is valid and accessible
   - Verify `CRON_SECRET` is set for cron jobs

3. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Functions
   - Check for any error messages in the logs
   - Look for webhook setup errors

#### ⏰ Cron Jobs Not Running

**Problem:** Notifications or reminders are not being sent.

**Solution:**
1. **Check CRON_SECRET**
   - Verify `CRON_SECRET` environment variable is set
   - Test cron endpoints manually with the secret

2. **Check Vercel Cron Dashboard**
   - Go to Vercel Dashboard → Cron Jobs
   - Verify cron jobs are scheduled and running
   - Check for any failed executions

3. **Test Cron Endpoints**
   ```bash
   # Test manually (replace with your domain and secret)
   curl -X POST https://your-domain.vercel.app/api/cron/sync \
     -H "Authorization: Bearer your-cron-secret"
   ```

#### 🗄️ Database Connection Issues

**Problem:** Bot can't connect to the database.

**Solution:**
1. **Check DATABASE_URL**
   - Verify the connection string is correct
   - Ensure database is accessible from Vercel
   - Check for SSL requirements

2. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Check Prisma Client**
   ```bash
   npm run db:generate
   ```

#### 📱 Webhook Setup Issues

**Problem:** Bot receives webhooks but doesn't process them.

**Solution:**
1. **Check Webhook URL**
   - Verify webhook is set to: `https://your-domain.vercel.app/api`
   - Not: `https://your-domain.vercel.app/` (missing `/api`)

2. **Check Function Logs**
   - Look for webhook processing errors
   - Verify request body parsing

3. **Test Webhook Manually**
   ```bash
   # Test webhook endpoint (replace with your domain)
   curl -X POST https://your-domain.vercel.app/api \
     -H "Content-Type: application/json" \
     -d '{"update_id":123,"message":{"text":"/start"}}'
   ```

### Getting Help

If you're still having issues:

1. **Check the logs** in Vercel Dashboard
2. **Verify all environment variables** are set correctly
3. **Test locally** with `npm run dev` to isolate issues
4. **Open an issue** on GitHub with detailed error messages

## License

MIT License - feel free to use and modify!
 