# LeadIntel - Independent Deployment Guide

This guide will help you deploy LeadIntel to independent cloud platforms.

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## 📋 Prerequisites

### 1. MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (Free M0 tier)
4. Create a database user:
   - Click "Database Access" → "Add New Database User"
   - Username: `leadintel_user`
   - Password: Generate a secure password
   - User Privileges: Read and write to any database
5. Whitelist IP addresses:
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for cloud platforms to connect
6. Get your connection string:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://leadintel_user:<password>@cluster0.xxxxx.mongodb.net/`
   - Replace `<password>` with your actual password

### 2. Apollo.io API Key (Optional)

- Sign up at [Apollo.io](https://www.apollo.io/)
- Get your API key from Settings → API Keys
- Note: Demo data will be used if no API key provided

---

## 🚀 Deployment Options

### Option A: Deploy to Render (Recommended)

#### Backend Deployment

1. **Prepare Data Files**:
   ```bash
   # Make sure these files exist in /app/backend/data/
   ls /app/backend/data/
   # Should show: crunchbase_companies.csv, linkedin_companies.csv, linkedin_jobs.csv
   ```

2. **Push to GitHub**:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "Initial commit - LeadIntel app"
   git branch -M main
   git remote add origin https://github.com/yourusername/leadintel.git
   git push -u origin main
   ```

3. **Deploy Backend on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `leadintel-backend`
     - **Region**: Oregon (US West)
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
     - **Plan**: Free
   - Add Environment Variables:
     - `MONGO_URL`: Your MongoDB Atlas connection string
     - `DB_NAME`: `leadintel_db`
     - `CORS_ORIGINS`: `*` (update later with frontend URL)
     - `APOLLO_API_KEY`: Your Apollo API key (optional)
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Copy your backend URL (e.g., `https://leadintel-backend.onrender.com`)

4. **Verify Backend**:
   ```bash
   curl https://your-backend-url.onrender.com/api/
   # Should return: {"message": "LeadIntel API v1.0..."}
   
   curl https://your-backend-url.onrender.com/api/data/status
   # Should return data status after initial load
   ```

#### Frontend Deployment

5. **Update Frontend Environment**:
   - Create `frontend/.env.production`:
     ```
     VITE_BACKEND_URL=https://your-backend-url.onrender.com
     ```

6. **Deploy Frontend on Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `yarn build`
     - **Output Directory**: `dist`
   - Add Environment Variable:
     - `VITE_BACKEND_URL`: `https://your-backend-url.onrender.com`
   - Click "Deploy"
   - Copy your frontend URL (e.g., `https://leadintel.vercel.app`)

7. **Update CORS in Backend**:
   - Go back to Render dashboard
   - Click on your backend service
   - Go to "Environment"
   - Update `CORS_ORIGINS` to your frontend URL:
     ```
     CORS_ORIGINS=https://leadintel.vercel.app
     ```
   - Save changes (service will auto-redeploy)

---

### Option B: Deploy to Railway

#### Backend Deployment

1. **Deploy Backend**:
   - Go to [Railway](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Configure:
     - **Root Directory**: `backend`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `MONGO_URL`: Your MongoDB Atlas connection string
     - `DB_NAME`: `leadintel_db`
     - `CORS_ORIGINS`: `*`
     - `PORT`: `8001`
   - Deploy and copy URL

#### Frontend Deployment

2. **Deploy Frontend on Vercel** (same as Option A, step 6-7)

---

### Option C: Deploy to Netlify (Frontend) + Render (Backend)

#### Backend: Same as Option A (steps 1-4)

#### Frontend Deployment

1. **Deploy on Netlify**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select repository
   - Configure:
     - **Base directory**: `frontend`
     - **Build command**: `yarn build`
     - **Publish directory**: `frontend/dist`
   - Add Environment Variable:
     - `VITE_BACKEND_URL`: `https://your-backend-url.onrender.com`
   - Deploy

---

## 🔧 Environment Variables Summary

### Backend (.env)
```bash
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/
DB_NAME=leadintel_db
CORS_ORIGINS=https://your-frontend-domain.com
APOLLO_API_KEY=your_api_key  # Optional
PORT=10000  # For Render, or 8001 for Railway
```

### Frontend (.env)
```bash
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

---

## 📊 Data Loading

The backend automatically loads data on startup from:
- `/backend/data/crunchbase_companies.csv`
- `/backend/data/linkedin_companies.csv`
- `/backend/data/linkedin_jobs.csv`

**Important**: These files must be included in your deployment:
1. Ensure data files are in the repository
2. Verify they're not in `.gitignore`
3. Check file sizes (Render free tier has limits)

If data files are too large for Git:
- Use Git LFS: `git lfs track "*.csv"`
- Or upload to cloud storage (S3, Google Drive) and modify `data_loader.py` to download on startup

---

## ✅ Post-Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured correctly
- [ ] CORS configured with frontend URL
- [ ] Data files loaded successfully
- [ ] Test API endpoint: `/api/data/status`
- [ ] Test search functionality: `/api/enrichment/search`
- [ ] Frontend can connect to backend
- [ ] Hero page loads with animations
- [ ] Dashboard displays company data
- [ ] Search and filtering works
- [ ] Export functionality works

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**:
```
Error: localhost:27017: [Errno 111] Connection refused
```
- **Solution**: Update `MONGO_URL` to your MongoDB Atlas connection string
- Verify IP whitelist includes 0.0.0.0/0
- Check username/password in connection string

**Data Not Loading**:
```
status: "empty"
```
- Check if data files exist in `backend/data/`
- Verify files are in the repository
- Check Render logs: Dashboard → Service → Logs
- Manual trigger: `curl -X POST https://your-backend.onrender.com/api/data/load`

**CORS Error in Browser**:
```
Access to fetch blocked by CORS policy
```
- Update `CORS_ORIGINS` in backend to include frontend URL
- Restart backend service after updating

### Frontend Issues

**API Calls Failing**:
- Verify `VITE_BACKEND_URL` is set correctly
- Check if backend is accessible: `curl https://your-backend.onrender.com/api/`
- Open browser console for error details

**Build Failing**:
- Run `yarn build` locally to test
- Check for TypeScript errors
- Verify all dependencies in package.json

---

## 💰 Costs

### Free Tier Limits

- **MongoDB Atlas**: Free M0 (512 MB storage)
- **Render**: Free (750 hours/month, sleeps after 15 min inactivity)
- **Vercel**: Free (100 GB bandwidth/month)
- **Netlify**: Free (100 GB bandwidth/month)
- **Railway**: $5 credit/month free

### Upgrade Recommendations

- **Production use**: Upgrade Render to Starter ($7/month) to avoid sleep
- **Large datasets**: Upgrade MongoDB to M2 ($9/month) for better performance
- **High traffic**: Monitor bandwidth on Vercel/Netlify

---

## 📞 Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set correctly
3. Test backend API endpoints directly with curl
4. Check browser console for frontend errors

---

## 🎉 Success!

Once deployed, your LeadIntel app will be:
- ✅ Accessible 24/7 from anywhere
- ✅ Backed by production-grade MongoDB
- ✅ Auto-scaling on free tiers
- ✅ SSL/HTTPS enabled by default
- ✅ Custom domain ready (optional upgrade)

**Next Steps**:
- Add custom domain names
- Set up monitoring and alerts
- Configure automatic backups for MongoDB
- Add analytics (Google Analytics, PostHog, etc.)
