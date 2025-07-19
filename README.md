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
BOT_TOKEN="<YOUR_BOT_API_TOKEN>"
SUPERTEAM_API_BASE="https://earn.superteam.fun/api"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
DATABASE_URL="postgresql://username:password@localhost:5432/superteam_bot"
SYNC_CRON_SCHEDULE="*/15 * * * *"
NOTIFICATION_CRON_SCHEDULE="*/5 * * * *"
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

1. Fork this repository
2. Connect to Vercel
3. Set environment variables
4. Deploy

**Important:** Turn off `Vercel Authentication` in Settings → Deployment Protection.

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
- **Categories** - For You, All, Content, Design, Development, Other
- **Project Type** - Bounties or Projects

## API Integration

The bot fetches data from the Superteam API (configurable via `SUPERTEAM_API_BASE` environment variable):
```
https://earn.superteam.fun/api/listings?context=all&tab=bounties&category=All&status=open&sortBy=Date&order=asc
```

## Cron Schedules

The bot uses two separate cron jobs:

### Data Sync Schedule (`SYNC_CRON_SCHEDULE`)
Syncs API data to database (configurable via `SYNC_CRON_SCHEDULE` environment variable):
- `*/15 * * * *` - Every 15 minutes (default)
- `*/30 * * * *` - Every 30 minutes
- `0 */1 * * *` - Every hour

### Notification Schedule (`NOTIFICATION_CRON_SCHEDULE`)
Sends notifications from database (configurable via `NOTIFICATION_CRON_SCHEDULE` environment variable):
- `*/5 * * * *` - Every 5 minutes (default)
- `*/10 * * * *` - Every 10 minutes
- `*/15 * * * *` - Every 15 minutes

Format: `minute hour day month day-of-week`

## Architecture

- **Services**: API integration, database operations, notifications, cronjob management
- **Commands**: User interaction handlers
- **Types**: TypeScript interfaces for data structures
- **Database**: Prisma ORM with PostgreSQL
- **Cronjob Service**: Two-phase system (data sync + notifications)

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

## License

MIT License - feel free to use and modify!
