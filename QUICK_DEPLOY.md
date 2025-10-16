# \ud83d\ude80 Quick Deployment Checklist

Use this checklist to deploy LeadIntel to independent cloud platforms.

---

## \ud83d\udd34 BEFORE YOU START

### 1. MongoDB Atlas Setup
- [ ] Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- [ ] Create free account
- [ ] Create M0 Free cluster
- [ ] Create database user (username + password)
- [ ] Whitelist IP: `0.0.0.0/0` (allow from anywhere)
- [ ] Copy connection string
- [ ] Replace `<password>` in connection string
- [ ] Add `/leadintel_db` to connection string

**Connection String Format**:
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/leadintel_db
```

**Save this securely** - you'll need it for deployment!

**Detailed guide**: See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

---

## \ud83d\udfe1 DEPLOYMENT PATH 1: RENDER + VERCEL (RECOMMENDED)

### A. Backend on Render

1. **Push to GitHub**:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/leadintel.git
   git push -u origin main
   ```

2. **Deploy Backend**:
   - [ ] Go to [Render Dashboard](https://dashboard.render.com/)
   - [ ] Click "New +" \u2192 "Web Service"
   - [ ] Connect GitHub repository
   - [ ] **Name**: `leadintel-backend`
   - [ ] **Region**: Oregon (US West)
   - [ ] **Root Directory**: `backend`
   - [ ] **Environment**: Python 3
   - [ ] **Build Command**: `pip install -r requirements.txt`
   - [ ] **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - [ ] **Plan**: Free

3. **Add Environment Variables** (in Render):
   - [ ] `MONGO_URL`: `mongodb+srv://USER:PASS@cluster.mongodb.net/leadintel_db`
   - [ ] `DB_NAME`: `leadintel_db`
   - [ ] `CORS_ORIGINS`: `*` (update later)
   - [ ] `APOLLO_API_KEY`: `your_key` (optional)

4. **Deploy & Test**:
   - [ ] Click "Create Web Service"
   - [ ] Wait 5-10 minutes
   - [ ] Copy backend URL: `https://leadintel-backend-xxxx.onrender.com`
   - [ ] Test: `curl https://YOUR-BACKEND.onrender.com/api/`
   - [ ] Test: `curl https://YOUR-BACKEND.onrender.com/api/data/status`

### B. Frontend on Vercel

5. **Deploy Frontend**:
   - [ ] Go to [Vercel Dashboard](https://vercel.com/)
   - [ ] Click "Add New" \u2192 "Project"
   - [ ] Import your GitHub repository
   - [ ] **Framework Preset**: Vite
   - [ ] **Root Directory**: `frontend`
   - [ ] **Build Command**: `yarn build`
   - [ ] **Output Directory**: `dist`

6. **Add Environment Variable**:
   - [ ] `VITE_BACKEND_URL`: `https://YOUR-BACKEND.onrender.com`

7. **Deploy & Test**:
   - [ ] Click "Deploy"
   - [ ] Wait 2-3 minutes
   - [ ] Copy frontend URL: `https://leadintel-xxx.vercel.app`
   - [ ] Visit URL and test app

### C. Update CORS

8. **Update Backend CORS**:
   - [ ] Go back to Render dashboard
   - [ ] Click your backend service
   - [ ] Go to "Environment"
   - [ ] Update `CORS_ORIGINS` to: `https://leadintel-xxx.vercel.app`
   - [ ] Save (auto-redeploys)

---

## \ud83d\udfe2 DEPLOYMENT PATH 2: RAILWAY (ALL-IN-ONE)

### Backend + Frontend on Railway

1. **Push to GitHub** (same as above)

2. **Deploy Backend**:
   - [ ] Go to [Railway](https://railway.app/)
   - [ ] Click "New Project" \u2192 "Deploy from GitHub repo"
   - [ ] Select repository
   - [ ] **Service**: Backend
   - [ ] **Root Directory**: `backend`
   - [ ] Add variables:
     - `MONGO_URL`: `mongodb+srv://...`
     - `DB_NAME`: `leadintel_db`
     - `CORS_ORIGINS`: `*`
     - `PORT`: `8001`
   - [ ] Deploy
   - [ ] Copy backend URL

3. **Deploy Frontend**:
   - [ ] Add new service to same project
   - [ ] **Service**: Frontend
   - [ ] **Root Directory**: `frontend`
   - [ ] Add variable:
     - `VITE_BACKEND_URL`: `https://your-backend.railway.app`
   - [ ] Deploy
   - [ ] Copy frontend URL

4. **Update CORS**:
   - [ ] Update backend `CORS_ORIGINS` with frontend URL

---

## \ud83d\udfe0 DEPLOYMENT PATH 3: RENDER + NETLIFY

### A. Backend on Render (same as Path 1)

### B. Frontend on Netlify

1. **Deploy Frontend**:
   - [ ] Go to [Netlify](https://app.netlify.com/)
   - [ ] Click "Add new site" \u2192 "Import an existing project"
   - [ ] Connect GitHub and select repo
   - [ ] **Base directory**: `frontend`
   - [ ] **Build command**: `yarn build`
   - [ ] **Publish directory**: `frontend/dist`
   - [ ] Add environment variable:
     - `VITE_BACKEND_URL`: `https://YOUR-BACKEND.onrender.com`
   - [ ] Deploy

2. **Update CORS** (same as Path 1)

---

## \u2705 POST-DEPLOYMENT VERIFICATION

### Test Backend

```bash
# Test root endpoint
curl https://YOUR-BACKEND-URL.onrender.com/api/

# Expected: {"message": "LeadIntel API v1.0 - Enhanced with Multi-Source Enrichment"}

# Test data status
curl https://YOUR-BACKEND-URL.onrender.com/api/data/status

# Expected: {"status": "loaded", "crunchbase_companies": 52, "linkedin_companies": 6063, ...}

# Test enrichment search
curl -X POST https://YOUR-BACKEND-URL.onrender.com/api/enrichment/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Apple", "limit": 10}'

# Expected: {"results": [...], "count": 10, ...}
```

### Test Frontend

- [ ] Visit frontend URL
- [ ] Hero page loads with animated shapes
- [ ] Click "Get Started" button
- [ ] Dashboard loads
- [ ] Stats show correct numbers (6115+ companies)
- [ ] Search bar works
- [ ] Company cards display data
- [ ] Contact tab works
- [ ] Export CSV button works

---

## \ud83d\udd27 TROUBLESHOOTING

### Backend Won't Start

**Error**: `Connection refused` or `MongoDB error`

**Fix**:
1. Check `MONGO_URL` is correct in Render environment variables
2. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Test connection string locally first
4. Check Render logs: Dashboard \u2192 Service \u2192 Logs

### Frontend Can't Connect to Backend

**Error**: `Network error` or `CORS error` in browser console

**Fix**:
1. Verify `VITE_BACKEND_URL` in Vercel is correct
2. Check backend is accessible: `curl https://backend-url/api/`
3. Update backend `CORS_ORIGINS` with frontend URL
4. Clear browser cache and reload

### Data Not Loading

**Error**: Status shows `"status": "empty"`

**Fix**:
1. Check if data files exist in `/backend/data/`
2. Verify files are in GitHub repo (not in .gitignore)
3. Check file sizes (Render free tier limits)
4. Manual trigger: `curl -X POST https://backend/api/data/load`
5. Check Render logs for errors

### Render Service Sleeping

**Issue**: Backend takes 30+ seconds to respond first time

**Explanation**: Render free tier sleeps after 15 minutes of inactivity

**Solutions**:
1. Accept the delay (free tier behavior)
2. Upgrade to Render Starter ($7/month) to keep always awake
3. Use UptimeRobot to ping service every 5 minutes

---

## \ud83d\udcb0 COST SUMMARY

| Service | Free Tier | Upgrade |
|---------|-----------|---------|
| MongoDB Atlas | 512 MB | M2: $9/mo |
| Render Backend | 750 hrs/mo (sleeps) | $7/mo (always on) |
| Vercel Frontend | 100 GB bandwidth | $20/mo |
| Netlify Frontend | 100 GB bandwidth | $19/mo |
| Railway | $5 credit/mo | $5/GB egress |

**Total Free**: $0/month (with sleep limitations)
**Total Paid**: $16-26/month (production-ready)

---

## \ud83d\udcda RESOURCES

- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **MongoDB Setup**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
- **API Docs**: `https://your-backend.onrender.com/docs`
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app

---

## \ud83c\udf89 SUCCESS!

Once deployed, your app is:
- \u2705 Accessible worldwide 24/7
- \u2705 HTTPS enabled by default
- \u2705 Auto-scaling on demand
- \u2705 Production-ready MongoDB
- \u2705 Ready for custom domain

**Next Steps**:
- Add custom domain
- Set up monitoring (Sentry, LogRocket)
- Configure analytics
- Set up automated backups

---

**Questions?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide!
