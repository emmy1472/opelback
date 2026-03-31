# Vercel Deployment Fixes

## 🔴 ERROR: 500 on /api/models

This happens because MongoDB Atlas is blocking Vercel's IP addresses.

---

## ✅ FIX #1: Update MongoDB Atlas Whitelist (CRITICAL!)

1. Go to: https://cloud.mongodb.com/
2. Login to your MongoDB Atlas account
3. Click **Network Access** (left sidebar)
4. Click **ADD IP ADDRESS**
5. Choose **ALLOW ACCESS FROM ANYWHERE**
   - Enter: `0.0.0.0/0`
   - This allows all IPs (including Vercel/Railway/Render)
6. Click **Confirm**

**Status:** ✅ Now Vercel can connect

---

## ✅ FIX #2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value |
|------|-------|
| `MONGO_URI` | `mongodb+srv://opelback_db_user:auGTbxyho3LNHefI@opelback1.1dtqehu.mongodb.net/opel-scraper` |
| `JWT_SECRET` | `hE5Pjbfu6vhW33zecJt0s+FnJ3NgKgYrpOaPlqrDzds=` |
| `NODE_ENV` | `production` |

4. Click **Save**
5. **Redeploy** your project:
   - Go to **Deployments**
   - Click the latest deployment
   - Click **Redeploy**

**Status:** ✅ Environment variables now set

---

## ✅ FIX #3: Update server configuration for Vercel

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

This ensures Vercel knows how to run your Node.js server.

---

## ✅ FIX #4: Verify .env.local for local testing

Make sure `.env` has:
```
MONGO_URI=mongodb+srv://opelback_db_user:auGTbxyho3LNHefI@opelback1.1dtqehu.mongodb.net/opel-scraper
JWT_SECRET=hE5Pjbfu6vhW33zecJt0s+FnJ3NgKgYrpOaPlqrDzds=
NODE_ENV=production
```

---

## 🧪 Test After Fixes

```bash
# Test /api/models
curl https://your-project.vercel.app/api/models

# You should get 74 Opel models back, NOT 500 error
```

---

## 📋 Complete Vercel Setup Checklist

- [ ] Push code to GitHub
- [ ] Create account on vercel.com
- [ ] Import your GitHub repository
- [ ] Set environment variables (MONGO_URI, JWT_SECRET, NODE_ENV)
- [ ] **Allow all IPs in MongoDB Atlas** (0.0.0.0/0)
- [ ] Redeploy the project
- [ ] Test /api/models endpoint
- [ ] Get a 200 response with 74 models

---

## 🚨 If Still Getting 500 Error

Check Vercel logs:
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click latest deployment
4. Click **Runtime Logs** tab
5. Look for MongoDB connection errors

Common issues:
- ❌ "Authentication failed" → Username/password wrong
- ❌ "IP whitelist" → Need to add 0.0.0.0/0
- ❌ "ENOTFOUND" → MONGO_URI not set in environment variables

---

## 💡 Pro Tip: Use Environment-Specific Configuration

Update your `server.js` to handle Vercel better:

```javascript
// At the top of server.js, after require('dotenv').config();
console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 Database: ${process.env.MONGO_URI ? 'Configured' : 'Missing'}`);
```

This will help you debug faster by seeing what's configured on Vercel.

---

**After these fixes, your API will work on Vercel! 🎉**
