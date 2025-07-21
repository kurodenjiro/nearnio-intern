# Vercel Deployment Troubleshooting Guide

This guide helps you troubleshoot issues when deploying the Telegram bot to Vercel.

## Common Issues and Solutions

### 1. Bot Not Responding to Messages

#### **Symptoms:**
- Bot doesn't reply to `/start` command
- No response to any messages
- Webhook not receiving updates

#### **Causes & Solutions:**

##### **A. Missing Environment Variables**
**Check these in Vercel dashboard:**
```bash
BOT_TOKEN=your-telegram-bot-token
VERCEL_URL=https://your-app.vercel.app
DATABASE_URL=your-database-connection-string
CRON_SECRET=your-cron-secret
```

**Test:** Visit `/api/health` to check environment variables

##### **B. Webhook Not Set**
**Manual webhook setup:**
```bash
# Set webhook manually
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api"}'

# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

##### **C. Vercel URL Issues**
**Check:**
- `VERCEL_URL` environment variable is set correctly
- URL format: `https://your-app.vercel.app` (no trailing slash)
- Bot can access the URL from Telegram servers

### 2. Cron Jobs Not Running

#### **Symptoms:**
- No data syncing
- No notifications sent
- No reminder checks

#### **Causes & Solutions:**

##### **A. Missing CRON_SECRET**
**Set in Vercel environment variables:**
```bash
CRON_SECRET=your-secret-key-here
```

##### **B. Incorrect Cron Schedules**
**Current schedules in vercel.json:**
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

##### **C. Test Cron Endpoints Manually**
```bash
# Test sync
curl -X POST https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"

# Test notifications
curl -X POST https://your-app.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"

# Test reminders
curl -X POST https://your-app.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### 3. Database Connection Issues

#### **Symptoms:**
- Bot responds but no data persistence
- Cron jobs fail with database errors
- User preferences not saved

#### **Causes & Solutions:**

##### **A. Missing DATABASE_URL**
**Set in Vercel environment variables:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

##### **B. Database Not Migrated**
**Run migrations:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

##### **C. Connection Limits**
**Check:**
- Database connection pool limits
- Vercel function timeout settings
- Database server availability

### 4. Build Errors

#### **Symptoms:**
- Deployment fails
- Build errors in Vercel logs
- TypeScript compilation errors

#### **Solutions:**

##### **A. Check Build Logs**
```bash
# View build logs in Vercel dashboard
# Or check locally
npm run build
```

##### **B. Fix TypeScript Errors**
```bash
# Check for type errors
npm run lint
```

##### **C. Update Dependencies**
```bash
# Update packages
npm update
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## Deployment Checklist

### **Pre-Deployment:**
- [ ] All environment variables set in Vercel
- [ ] Database is accessible from Vercel
- [ ] Bot token is valid and active
- [ ] Code builds successfully locally

### **Post-Deployment:**
- [ ] Visit `/api/health` to check environment
- [ ] Test webhook setup with GET request to `/api`
- [ ] Send `/start` command to bot
- [ ] Test cron endpoints manually
- [ ] Check Vercel function logs

### **Environment Variables Required:**
```bash
# Required
BOT_TOKEN=your-telegram-bot-token
VERCEL_URL=https://your-app.vercel.app
DATABASE_URL=your-database-connection-string
CRON_SECRET=your-cron-secret

# Optional
NODE_ENV=production
SUPERTEAM_API_BASE=https://api.superteam.fun
SERVER_URL=https://nearn.io
```

## Testing Commands

### **Health Check:**
```bash
curl https://your-app.vercel.app/api/health
```

### **Webhook Setup:**
```bash
curl https://your-app.vercel.app/api
```

### **Manual Cron Tests:**
```bash
# Test sync
curl -X POST https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"

# Test notifications
curl -X POST https://your-app.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"

# Test reminders
curl -X POST https://your-app.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### **Telegram API Tests:**
```bash
# Check bot info
curl "https://api.telegram.org/bot<BOT_TOKEN>/getMe"

# Check webhook info
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# Set webhook manually
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/api"}'
```

## Debugging Steps

### **1. Check Vercel Logs**
- Go to Vercel dashboard
- Select your project
- Check "Functions" tab for logs
- Look for errors in deployment logs

### **2. Test Environment Variables**
```bash
curl https://your-app.vercel.app/api/health
```

### **3. Test Webhook Setup**
```bash
curl https://your-app.vercel.app/api
```

### **4. Test Bot Response**
- Send `/start` to your bot
- Check if it responds
- Look for errors in Vercel logs

### **5. Test Cron Jobs**
```bash
# Test each cron endpoint manually
curl -X POST https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"
```

## Common Error Messages

### **"VERCEL_URL is not set"**
- Set `VERCEL_URL` environment variable in Vercel dashboard
- Format: `https://your-app.vercel.app` (no trailing slash)

### **"BOT_TOKEN is not set"**
- Set `BOT_TOKEN` environment variable in Vercel dashboard
- Get token from @BotFather on Telegram

### **"401 Unauthorized" (Cron Jobs)**
- Set `CRON_SECRET` environment variable
- Use correct Authorization header in requests

### **"Database connection failed"**
- Check `DATABASE_URL` environment variable
- Ensure database is accessible from Vercel
- Check connection limits and timeouts

### **"Webhook set failed"**
- Check bot token is valid
- Ensure Vercel URL is accessible
- Check Telegram API rate limits

## Getting Help

### **Vercel Support:**
- Check Vercel documentation
- Use Vercel community forums
- Contact Vercel support

### **Telegram Bot API:**
- Check Telegram Bot API documentation
- Use @BotFather for bot configuration
- Test with Telegram API directly

### **Database Issues:**
- Check database provider documentation
- Verify connection strings
- Test connectivity from Vercel 