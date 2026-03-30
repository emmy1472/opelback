# 🚀 HOW TO DEPLOY YOUR OPEL SCRAPER API

## STEP 1: Prepare Your Code for Deployment

### 1.1 Create a GitHub Repo
```bash
# Initialize git in your project
git init
git add .
git commit -m "Initial commit - Opel scraper API"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/opelback.git
git branch -M main
git push -u origin main
```

### 1.2 Verify package.json has start script
```json
{
  "name": "opelback",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "seed": "node seed-database.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 1.3 Ensure .env is in .gitignore (SECRET!)
```
# .gitignore file must contain:
.env
node_modules/
```

---

## STEP 2: Choose Your Hosting Platform

### ⭐ OPTION A: Railway.app (EASIEST - RECOMMENDED)

1. **Sign up** at https://railway.app (free tier available)
2. **Connect GitHub repo**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your opelback repository
3. **Add MongoDB**:
   - Click "Add"
   - Search "MongoDB"
   - Add MongoDB plugin
4. **Set Environment Variables**:
   - Go to Variables tab
   - Add your secrets:
     - `MONGO_URI` = (auto-filled from MongoDB plugin)
     - `JWT_SECRET` = opelcore-secret-key-change-in-production
     - `NODE_ENV` = production
5. **Deploy**:
   - Railway auto-deploys when you push to GitHub
   - Your API will be live at: `https://your-project-name.up.railway.app`

**Cost**: Free tier includes $5/month credit (enough for testing)

---

### ⭐ OPTION B: Render.com

1. **Sign up** at https://render.com
2. **Create New Service**:
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub
3. **Configure**:
   - Name: opelback-api
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** in dashboard:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=opelcore-secret-key-change-in-production
   NODE_ENV=production
   ```
5. **Deploy** - Automatically deploys on git push

**URL**: `https://opelback-api.onrender.com`

**Cost**: Free tier (sleeps after 15 mins inactivity)

---

### ⭐ OPTION C: Heroku (Classic)

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```
2. **Create app**:
   ```bash
   heroku create opelback-api
   ```
3. **Set environment variables**:
   ```bash
   heroku config:set MONGO_URI="mongodb+srv://..."
   heroku config:set JWT_SECRET="opelcore-secret-key-change-in-production"
   ```
4. **Deploy**:
   ```bash
   git push heroku main
   ```

**Cost**: Paid (updated pricing model)

---

### ⭐ OPTION D: Vercel (Node option)

1. Go to https://vercel.com
2. Import GitHub project
3. Set environment variables in project settings
4. Deploy

---

## STEP 3: Seed Initial Data on Production

After deployment, populate your database:

```bash
# Option 1: SSH into production and run seed
# (Different for each platform - check docs)

# Option 2: Create an admin endpoint
# Add this to server.js temporarily:
app.post('/api/admin/seed', async (req, res) => {
    const { key } = req.body;
    if (key !== 'secret-seed-key-12345') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    // Run seed logic here
    res.json({ message: 'Seeding started' });
});

# Then call from your machine:
curl -X POST https://your-api.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"key":"secret-seed-key-12345"}'
```

---

## STEP 4: Monitor & Manage

### Railway Dashboard
- Real-time logs
- Deployment history
- Environment variable editor

### Render Dashboard
- Health checks
- Manual restart option
- Log viewer

### Heroku Dashboard
- Dyno status
- Log streaming
- Add-on management

---

## TESTING YOUR LIVE API

Once deployed, test all endpoints:

```bash
# Replace YOUR_DOMAIN with actual domain

# 1. Register user
curl -X POST https://YOUR_DOMAIN/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'

# 2. Get token
curl -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# 3. Get models
curl https://YOUR_DOMAIN/api/models

# 4. VIN lookup (with token)
curl -X POST https://YOUR_DOMAIN/api/vin-lookup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"vin":"W0L0TGH86K2000002"}'
```

---

## STEP 5: Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (all platforms do this automatically)
- [ ] Set up MongoDB Atlas backup
- [ ] Test all API endpoints
- [ ] Monitor error logs regularly
- [ ] Set rate limiting if needed
- [ ] Add analytics/logging

---

## QUICK COMPARISON TABLE

| Platform | Ease | Cost | Auto-Deploy | Node Support |
|----------|------|------|------------|--------------|
| Railway  | ⭐⭐ | Free tier | ✅ Yes | ✅ Full |
| Render   | ⭐⭐ | Free tier | ✅ Yes | ✅ Full |
| Heroku   | ⭐⭐⭐ | Paid | ✅ Yes | ✅ Full |
| Vercel   | ⭐⭐ | Free | ✅ Yes | ⚠️ Limited |
| AWS      | ⭐⭐⭐⭐ | Varies | ✅ Yes | ✅ Full |

---

## TROUBLESHOOTING

### "Cannot connect to MongoDB"
- Check `MONGO_URI` is correct
- Add platform IP to MongoDB Atlas whitelist (use 0.0.0.0/0 for "allow all")

### "Deployment keeps crashing"
- Check platform logs for errors
- Ensure all npm dependencies are in package.json
- Verify environment variables are set

### "API is slow"
- Check MongoDB query performance
- Add caching headers
- Consider database indexes

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Build Frontend** - Create React/Vue app that calls your API
2. **Add Authentication** - Consider OAuth/social login
3. **Setup CDN** - For image caching/delivery
4. **Enable Analytics** - Track API usage
5. **Add Rate Limiting** - Prevent abuse
6. **Setup Monitoring** - Get alerts on errors

---

**Your API is now LIVE! 🎉**

Visit: `https://YOUR_DOMAIN/api/models` to verify
