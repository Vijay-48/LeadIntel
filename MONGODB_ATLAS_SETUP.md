# MongoDB Atlas Setup Guide

This guide walks you through setting up a free MongoDB Atlas database for your LeadIntel deployment.

## \ud83c\udfaf Overview

MongoDB Atlas is MongoDB's cloud database service with a generous free tier (512 MB storage).

**Time Required**: 10-15 minutes

---

## \ud83d\udd11 Step 1: Create Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with:
   - Email and password, OR
   - Google account, OR
   - GitHub account
3. Complete email verification

---

## \u2699\ufe0f Step 2: Create Free Cluster

1. **Choose Plan**:
   - Select **"M0 Free"** (Shared cluster)
   - \u2705 512 MB storage
   - \u2705 Shared RAM
   - \u2705 Perfect for development and small projects

2. **Choose Cloud Provider & Region**:
   - **Provider**: AWS (recommended) or Google Cloud or Azure
   - **Region**: Choose closest to your deployment:
     - US: `us-east-1` (N. Virginia) or `us-west-2` (Oregon)
     - Europe: `eu-west-1` (Ireland)
     - Asia: `ap-southeast-1` (Singapore)
   
3. **Cluster Name**: 
   - Default: `Cluster0`
   - Or rename to: `leadintel-cluster`

4. Click **"Create Cluster"** (takes 3-5 minutes)

---

## \ud83d\udc64 Step 3: Create Database User

1. **Security Quickstart** appears automatically (or click "Database Access" in left sidebar)

2. **Add Database User**:
   - Click **"Add New Database User"**
   - **Authentication Method**: Password
   - **Username**: `leadintel_admin` (or your choice)
   - **Password**: Click "Autogenerate Secure Password"
     - \u26a0\ufe0f **IMPORTANT**: Copy and save this password securely!
     - Or create your own strong password
   - **Database User Privileges**: 
     - Select **"Read and write to any database"**
   - Click **"Add User"**

**Example Credentials** (save these securely):
```
Username: leadintel_admin
Password: aB9dK3mN7pQ2xY5z  (example - use your own!)
```

---

## \ud83c\udf10 Step 4: Configure Network Access

1. Click **"Network Access"** in left sidebar

2. **Add IP Address**:
   - Click **"Add IP Address"**
   - Two options:
   
   **Option A: Allow All** (recommended for cloud deployments)
   - Click **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - \u2705 Best for Render, Vercel, Railway (dynamic IPs)
   - \u26a0\ufe0f Less restrictive, but database still requires authentication
   
   **Option B: Specific IPs** (more secure)
   - Add your development machine IP
   - Add Render/Railway static IPs (if available)
   - Add office/home network IPs

3. Click **"Confirm"**

---

## \ud83d\udd17 Step 5: Get Connection String

1. Click **"Database"** in left sidebar

2. Click **"Connect"** button on your cluster

3. Select **"Connect your application"**

4. **Driver**: Select **"Python"** and version **"3.11 or later"**

5. **Copy Connection String**:
   ```
   mongodb+srv://leadintel_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Replace `<password>`**:
   ```
   # Original (DON'T USE THIS):
   mongodb+srv://leadintel_admin:<password>@cluster0.xxxxx.mongodb.net/
   
   # Updated (USE THIS):
   mongodb+srv://leadintel_admin:aB9dK3mN7pQ2xY5z@cluster0.xxxxx.mongodb.net/
   ```
   
   \u26a0\ufe0f **Important**: 
   - Replace `<password>` with your actual password
   - Remove `?retryWrites=true&w=majority` (optional)
   - Add `/leadintel_db` before the `?` to specify database name:
     ```
     mongodb+srv://leadintel_admin:aB9dK3mN7pQ2xY5z@cluster0.xxxxx.mongodb.net/leadintel_db
     ```

---

## \u2705 Step 6: Test Connection

### Local Test (Optional)

1. **Update backend/.env**:
   ```bash
   MONGO_URL=mongodb+srv://leadintel_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/leadintel_db
   DB_NAME=leadintel_db
   ```

2. **Test Connection**:
   ```bash
   cd backend
   python -c "from pymongo import MongoClient; client = MongoClient('YOUR_CONNECTION_STRING'); print('Connected:', client.server_info()['version'])"
   ```

   Expected output:
   ```
   Connected: 7.0.11
   ```

3. **Start Backend**:
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8001
   ```

4. **Verify Data Loading**:
   ```bash
   curl http://localhost:8001/api/data/status
   ```

---

## \ud83d\ude80 Step 7: Use in Deployment

### For Render

1. In Render Dashboard \u2192 Your Service \u2192 **Environment**
2. Add variable:
   - **Key**: `MONGO_URL`
   - **Value**: `mongodb+srv://leadintel_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/leadintel_db`
3. Save (auto-redeploys)

### For Railway

1. In Railway Project \u2192 **Variables**
2. Add:
   - `MONGO_URL`: `mongodb+srv://...`
   - `DB_NAME`: `leadintel_db`
3. Redeploy

### For Vercel/Netlify (Frontend)

Frontend doesn't need MongoDB access - only backend does.

---

## \ud83d\udcca Step 8: Monitor Usage

1. **Database Dashboard**:
   - Go to Atlas Dashboard \u2192 **Database** tab
   - View clusters, collections, storage

2. **Monitor Metrics**:
   - Click on your cluster
   - **Metrics** tab shows:
     - Connections
     - Operations per second
     - Network I/O
     - Storage used

3. **Free Tier Limits**:
   - \u2705 512 MB storage
   - \u2705 Shared vCPU
   - \u2705 Shared RAM
   - \ud83d\udea8 If you exceed 512 MB, upgrade to paid tier

4. **View Collections**:
   - Click **"Browse Collections"**
   - See your data:
     - `crunchbase_companies`
     - `linkedin_companies`
     - `linkedin_jobs`
     - `enriched_data`
     - `leads`

---

## \ud83d\udd12 Security Best Practices

1. **Rotate Passwords Regularly**:
   - Database Access \u2192 Edit User \u2192 Edit Password

2. **Use Strong Passwords**:
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Restrict IP Access** (Production):
   - Remove `0.0.0.0/0` after getting static IPs
   - Add only deployment platform IPs

4. **Enable Audit Logs** (Paid tiers):
   - Track all database operations

5. **Backup Strategy**:
   - Free tier: Manual exports
   - Paid tiers: Automatic backups

---

## \ud83d\udc1b Troubleshooting

### Error: "Authentication Failed"

**Cause**: Wrong password in connection string

**Solution**:
1. Verify password is correct
2. Check for special characters that need URL encoding:
   - `@` \u2192 `%40`
   - `#` \u2192 `%23`
   - `%` \u2192 `%25`
3. Or reset password:
   - Database Access \u2192 Edit User \u2192 Edit Password

### Error: "Connection Timeout"

**Cause**: IP not whitelisted

**Solution**:
1. Network Access \u2192 Verify IPs
2. Add `0.0.0.0/0` temporarily to test
3. Check firewall rules on your network

### Error: "Cannot Connect to Server"

**Cause**: Invalid connection string

**Solution**:
1. Verify format: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/dbname`
2. Check cluster name is correct
3. Ensure DNS resolution is working

### Error: "Quota Exceeded"

**Cause**: Storage limit reached (512 MB)

**Solution**:
1. Check storage: Atlas Dashboard \u2192 Metrics
2. Delete unnecessary data
3. Upgrade to paid tier (M2: $9/month for 2 GB)

---

## \ud83d\udcbc Upgrade Options

### When to Upgrade

- \ud83d\udcc8 Storage exceeds 512 MB
- \ud83d\ude80 Need better performance
- \ud83d\udd12 Need automated backups
- \ud83d\udc65 Team collaboration needed

### Pricing

- **M0** (Free): 512 MB, Shared resources
- **M2** ($9/month): 2 GB, Shared resources
- **M10** ($57/month): 10 GB, Dedicated resources
- **M20** ($140/month): 20 GB, Better performance

Compare plans: [MongoDB Pricing](https://www.mongodb.com/pricing)

---

## \ud83c\udf89 Quick Reference

**Connection String Template**:
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME
```

**LeadIntel Example**:
```
mongodb+srv://leadintel_admin:aB9dK3mN7pQ2xY5z@cluster0.abc123.mongodb.net/leadintel_db
```

**Environment Variable**:
```bash
MONGO_URL=mongodb+srv://leadintel_admin:aB9dK3mN7pQ2xY5z@cluster0.abc123.mongodb.net/leadintel_db
DB_NAME=leadintel_db
```

---

## \u2705 Checklist

Before deploying, ensure:

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster provisioned
- [ ] Database user created with strong password
- [ ] Password saved securely
- [ ] IP whitelist configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained
- [ ] Password replaced in connection string
- [ ] Connection tested locally (optional)
- [ ] Environment variable set in deployment platform
- [ ] Backend deployment successful
- [ ] Data loaded successfully (`/api/data/status` returns data)

---

**Need Help?**
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
- [Atlas Support](https://support.mongodb.com/)

**Ready to deploy!** \ud83d\ude80
