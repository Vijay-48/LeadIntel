# LeadIntel - Deployment Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS / CLIENTS                          │
│                    (Web Browsers, Mobile)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ├─── HTTPS ───┐
                         │              │
          ┌──────────────▼────┐    ┌───▼──────────────┐
          │    FRONTEND       │    │   BACKEND API     │
          │                   │    │                   │
          │  Vercel/Netlify   │    │  Render/Railway   │
          │                   │    │                   │
          │  • React 18       │    │  • FastAPI        │
          │  • Vite           │    │  • Python 3.11    │
          │  • TypeScript     │    │  • Motor (async)  │
          │  • Tailwind CSS   │    │  • Pandas         │
          │  • Framer Motion  │    │  • Playwright     │
          │                   │    │                   │
          │  Port: 3000       │    │  Port: 10000      │
          └───────────────────┘    └──────┬────────────┘
                                           │
                                           │
                                   ┌───────▼────────────┐
                                   │   DATABASE         │
                                   │                    │
                                   │  MongoDB Atlas     │
                                   │                    │
                                   │  • M0 Free Tier    │
                                   │  • 512 MB Storage  │
                                   │  • Shared Cluster  │
                                   │                    │
                                   │  Collections:      │
                                   │  - crunchbase_co.. │
                                   │  - linkedin_comp.. │
                                   │  - enriched_data   │
                                   │  - leads           │
                                   │  - linkedin_jobs   │
                                   └────────────────────┘
```

---

## 🌐 Deployment Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 1: DEVELOPMENT (Local)                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Developer's Machine                                             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│   │   Backend        │  │   Frontend       │  │   MongoDB    │  │
│   │   :8001          │◄─┤   :3000          │  │   :27017     │  │
│   └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                    │
└────────────────────────────┬───────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Git Commit     │
                    │   git push       │
                    └────────┬─────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│  Step 2: SOURCE CONTROL (GitHub)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   GitHub Repository                                              │
│   ┌───────────────────────────────────────────────────────┐    │
│   │  leadintel/                                            │    │
│   │  ├── backend/                                          │    │
│   │  │   ├── server.py                                     │    │
│   │  │   ├── data_loader.py                                │    │
│   │  │   ├── enrichment_service.py                         │    │
│   │  │   ├── requirements.txt                              │    │
│   │  │   ├── render.yaml                                   │    │
│   │  │   ├── .env.example                                  │    │
│   │  │   └── data/ (147 MB)                                │    │
│   │  ├── frontend/                                          │    │
│   │  │   ├── src/                                           │    │
│   │  │   ├── package.json                                   │    │
│   │  │   ├── vercel.json                                    │    │
│   │  │   └── .env.example                                   │    │
│   │  └── docs/ (DEPLOYMENT.md, etc)                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                   │
└────────────────┬──────────────────────────┬───────────────────┘
                 │                          │
        ┌────────▼─────────┐       ┌────────▼─────────┐
        │  Connect to      │       │  Connect to      │
        │  Render          │       │  Vercel          │
        └────────┬─────────┘       └────────┬─────────┘
                 │                          │
┌────────────────▼────────────┐  ┌─────────▼──────────────┐
│  Step 3: BACKEND BUILD      │  │  FRONTEND BUILD         │
├─────────────────────────────┤  ├────────────────────────┤
│                              │  │                         │
│  Render Build Process:      │  │  Vercel Build Process:  │
│  1. Clone repo               │  │  1. Clone repo          │
│  2. cd backend/              │  │  2. cd frontend/        │
│  3. pip install -r req..     │  │  3. yarn install        │
│  4. Download data files      │  │  4. yarn build          │
│  5. Set env variables        │  │  5. Set env variables   │
│  6. Start uvicorn            │  │  6. Deploy to CDN       │
│                              │  │                         │
└────────────────┬─────────────┘  └─────────┬──────────────┘
                 │                          │
┌────────────────▼────────────┐  ┌─────────▼──────────────┐
│  Step 4: PRODUCTION         │  │  PRODUCTION             │
├─────────────────────────────┤  ├────────────────────────┤
│                              │  │                         │
│  Backend Server (Render)    │  │  Frontend (Vercel)      │
│  • URL: leadintel-back...   │  │  • URL: leadintel...    │
│  • Always-on (paid) OR      │  │  • Global CDN           │
│  • Sleeps after 15min(free) │  │  • Instant loading      │
│  • Auto-scaling             │  │  • Edge locations       │
│  • HTTPS enabled            │  │  • HTTPS enabled        │
│  • Logs available           │  │  • Analytics            │
│                              │  │                         │
└────────────────┬─────────────┘  └────────────────────────┘
                 │
                 │ MongoDB Connection
                 │
      ┌──────────▼──────────┐
      │  MongoDB Atlas      │
      │  Cloud Database     │
      │                     │
      │  • Multi-region     │
      │  • Auto-backup      │
      │  • Monitoring       │
      │  • 99.95% uptime    │
      └─────────────────────┘
```

---

## 🔄 Data Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│          │         │          │         │          │
│  User    ├────1───►│ Frontend ├────2───►│ Backend  │
│  Browser │         │ (Vercel) │         │ (Render) │
│          │◄───6────┤          │◄───5────┤          │
└──────────┘         └──────────┘         └─┬──────┬─┘
                                             │      │
                                          3  │      │  4
                                             │      │
                                      ┌──────▼──────▼───┐
                                      │                  │
                                      │  MongoDB Atlas   │
                                      │                  │
                                      └──────────────────┘

1. User visits https://leadintel.vercel.app
2. Frontend makes API call to https://leadintel-backend.onrender.com/api/enrichment/search
3. Backend queries MongoDB Atlas
4. MongoDB returns data
5. Backend sends enriched JSON response
6. Frontend displays results in beautiful UI
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Security Layers                                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: HTTPS/TLS                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • All traffic encrypted                              │  │
│  │  • Automatic SSL certificates (Vercel/Render)         │  │
│  │  • TLS 1.3 support                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Layer 2: CORS Protection                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Backend only accepts requests from frontend URL    │  │
│  │  • Prevents unauthorized API access                   │  │
│  │  • CORS_ORIGINS environment variable                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Layer 3: Database Authentication                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • MongoDB requires username/password                 │  │
│  │  • Connection string in environment variables only    │  │
│  │  • IP whitelist (optional)                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Layer 4: Environment Variables                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  • Secrets not in code or Git                         │  │
│  │  • Platform-specific environment management           │  │
│  │  • .env files in .gitignore                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Data Architecture

```
MongoDB Atlas Database: leadintel_db
├── Collections:
│   │
│   ├── crunchbase_companies (52 documents)
│   │   ├── company_name: string
│   │   ├── uuid: string
│   │   ├── website: string
│   │   ├── description: string
│   │   ├── location: string
│   │   ├── founded_date: string
│   │   ├── total_funding: number
│   │   ├── employee_count: string
│   │   ├── founders: array
│   │   └── ...
│   │
│   ├── linkedin_companies (6,063 documents)
│   │   ├── id: string
│   │   ├── name: string
│   │   ├── url: string
│   │   ├── description: string
│   │   ├── industry: string
│   │   ├── company_size: string
│   │   ├── headquarters: string
│   │   └── ...
│   │
│   ├── linkedin_jobs (variable)
│   │   ├── job_id: string
│   │   ├── company_id: string
│   │   ├── company_name: string
│   │   ├── job_title: string
│   │   ├── location: string
│   │   └── ...
│   │
│   ├── enriched_data (generated at runtime)
│   │   ├── company_name: string
│   │   ├── email: string
│   │   ├── linkedin: string
│   │   ├── contact_number: string
│   │   ├── prospect_full_name: string
│   │   ├── data_source: string
│   │   └── ...
│   │
│   └── leads (Apollo.io cached data)
│       ├── id: string
│       ├── source: string
│       ├── company_name: string
│       ├── contact_email: string
│       ├── created_at: datetime
│       └── expires_at: datetime
│
└── Indexes:
    ├── crunchbase_companies.company_name
    ├── crunchbase_companies.uuid
    ├── linkedin_companies.id
    ├── linkedin_companies.name
    └── linkedin_jobs.company_id
```

---

## 🌍 Multi-Region Deployment (Optional)

```
┌──────────────────────────────────────────────────────────────┐
│  Global Deployment Architecture (Advanced)                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   Frontend: Vercel Edge Network (Automatic)                   │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  • USA (East, West)                                     │ │
│   │  • Europe (London, Frankfurt, Paris)                    │ │
│   │  • Asia (Singapore, Tokyo, Hong Kong)                   │ │
│   │  • Australia (Sydney)                                   │ │
│   │  • South America (São Paulo)                            │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                                │
│   Backend: Single Region (Initially)                          │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  • Render: Oregon (US West) or                          │ │
│   │  • Railway: Choose closest to users                     │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                                │
│   Database: MongoDB Atlas Multi-Region (Optional Upgrade)    │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  • Primary: US West                                     │ │
│   │  • Secondary: US East (replica)                         │ │
│   │  • Tertiary: Europe (replica)                           │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Scaling Architecture

```
Current State (Free Tier):
┌─────────────────────────────────────────┐
│  Frontend (Vercel Free)                 │
│  • 100 GB bandwidth/month               │
│  • Unlimited requests                   │
│  • Global CDN                           │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Backend (Render Free)                  │
│  • 750 hours/month                      │
│  • Sleeps after 15 min inactivity       │
│  • Wakes in 30-60 seconds               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Database (MongoDB Atlas M0)            │
│  • 512 MB storage                       │
│  • Shared cluster                       │
│  • Unlimited connections                │
└─────────────────────────────────────────┘

Scaled State (Production):
┌─────────────────────────────────────────┐
│  Frontend (Vercel Pro)                  │
│  • 1 TB bandwidth/month                 │
│  • Priority builds                      │
│  • Advanced analytics                   │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Backend (Render Starter+)              │
│  • Always-on (no sleep)                 │
│  • Auto-scaling                         │
│  • 2+ instances for redundancy          │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Database (MongoDB Atlas M10)           │
│  • 10 GB storage                        │
│  • Dedicated cluster                    │
│  • Better performance                   │
│  • Automated backups                    │
└─────────────────────────────────────────┘
```

---

## 🔧 Environment Variables Flow

```
Development:
┌─────────────────────────────────────────────────────┐
│  backend/.env (local)                                │
│  ├── MONGO_URL=mongodb://localhost:27017            │
│  ├── DB_NAME=leadintel_db                           │
│  ├── CORS_ORIGINS=*                                 │
│  └── APOLLO_API_KEY=your_key                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  frontend/.env (local)                               │
│  └── VITE_BACKEND_URL=http://localhost:8001         │
└─────────────────────────────────────────────────────┘

Production:
┌─────────────────────────────────────────────────────┐
│  Render Environment Variables                        │
│  ├── MONGO_URL=mongodb+srv://user:pass@atlas...     │
│  ├── DB_NAME=leadintel_db                           │
│  ├── CORS_ORIGINS=https://leadintel.vercel.app      │
│  └── APOLLO_API_KEY=your_key                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Vercel Environment Variables                        │
│  └── VITE_BACKEND_URL=https://backend.onrender.com  │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 CI/CD Pipeline (Optional)

```
┌────────────────┐
│  Developer     │
│  git push      │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐
│  GitHub Repository     │
└───────┬────────────────┘
        │
        ├──────────────────────────┐
        │                          │
        ▼                          ▼
┌────────────────┐       ┌─────────────────┐
│  Render Deploy │       │  Vercel Deploy  │
│  (Backend)     │       │  (Frontend)     │
│                │       │                 │
│  1. Build      │       │  1. Build       │
│  2. Test       │       │  2. Preview     │
│  3. Deploy     │       │  3. Deploy      │
└────────────────┘       └─────────────────┘
        │                          │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Live Production │
        └──────────────────┘
```

---

## 💰 Cost Breakdown

```
Free Tier (Total: $0/month)
├── MongoDB Atlas M0: $0
├── Render Free: $0 (sleeps)
├── Vercel Free: $0
└── Total: $0/month

Starter Tier (Total: $16/month)
├── MongoDB Atlas M0: $0
├── Render Starter: $7/month
├── Vercel Hobby: $0
└── Total: $7/month

Production Tier (Total: $50-100/month)
├── MongoDB Atlas M10: $9/month
├── Render Professional: $25/month
├── Vercel Pro: $20/month
└── Total: $54/month

Enterprise Tier (Total: $500+/month)
├── MongoDB Atlas M30+: $100+/month
├── Render Team: $85+/month
├── Vercel Enterprise: Custom
└── Total: $500+/month
```

---

## 📈 Performance Metrics

```
Expected Performance:

Frontend (Vercel):
├── First Load: 1-2 seconds
├── Time to Interactive: 2-3 seconds
├── Lighthouse Score: 90+
└── Global CDN: <100ms latency

Backend (Render):
├── API Response: 100-500ms
├── Cold Start (free tier): 30-60s
├── Warm Response: 50-200ms
└── Database Query: 10-100ms

Database (MongoDB Atlas):
├── Query Response: 10-50ms
├── Connection Time: 50-100ms
├── Index Lookup: 5-20ms
└── Full Scan: 100-500ms
```

---

This architecture provides a scalable, production-ready deployment that can grow with your needs!
