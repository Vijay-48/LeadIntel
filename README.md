# LeadIntel - Business Intelligence Dashboard

A modern Business Intelligence Dashboard for lead generation and company enrichment, featuring a beautiful glassmorphism UI with dark theme.

## 🌟 Features

- **Beautiful Landing Page**: Animated hero section with floating shapes
- **BI Dashboard**: Modern glassmorphism design with dark theme
- **Multi-Source Data**: Integrates Crunchbase and LinkedIn company data
- **Smart Search**: Real-time filtering across all fields
- **Company Enrichment**: Email, LinkedIn, contact numbers, and more
- **Data Export**: Export filtered results to CSV
- **Apollo.io Integration**: Real-time company and contact enrichment
- **Job Postings**: View related job postings for companies

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Router (navigation)
- Axios (API calls)

### Backend
- FastAPI (Python)
- MongoDB (database)
- Motor (async MongoDB driver)
- Pandas (data processing)
- Playwright (web scraping)

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

### Local Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/leadintel.git
cd leadintel
```

2. **Backend Setup**:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB URL
python -m playwright install chromium
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

3. **Frontend Setup**:
```bash
cd frontend
yarn install
cp .env.example .env
# Edit .env with your backend URL
yarn dev
```

4. **Access the app**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api/
- API Docs: http://localhost:8001/docs

## 🚀 Deployment

For production deployment to cloud platforms (Render, Vercel, Railway, etc.), see [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

### Quick Deploy Summary

1. **Set up MongoDB Atlas** (free tier available)
2. **Deploy Backend** to Render/Railway
3. **Deploy Frontend** to Vercel/Netlify
4. **Configure Environment Variables**
5. **Update CORS settings**

Detailed step-by-step instructions in [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📊 Data Sources

The app comes pre-loaded with:
- **Crunchbase Companies**: Company funding and business data
- **LinkedIn Companies**: Professional network company data
- **LinkedIn Jobs**: Job postings from LinkedIn
- **Apollo.io**: Real-time company and contact enrichment (API key required)

Data files location: `/backend/data/`

## 🔑 Environment Variables

### Backend (.env)
```bash
MONGO_URL=mongodb://localhost:27017  # or MongoDB Atlas URL
DB_NAME=leadintel_db
CORS_ORIGINS=*  # or specific frontend URL
APOLLO_API_KEY=your_api_key  # Optional
```

### Frontend (.env)
```bash
VITE_BACKEND_URL=http://localhost:8001  # or production backend URL
```

## 📖 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Key Endpoints

- `GET /api/data/status` - Get data loading status
- `POST /api/enrichment/search` - Search companies with filters
- `POST /api/apollo/search` - Search via Apollo.io
- `POST /api/export/csv` - Export data to CSV

## 🧪 Testing

Test backend API:
```bash
curl http://localhost:8001/api/
curl http://localhost:8001/api/data/status
```

Test enrichment search:
```bash
curl -X POST http://localhost:8001/api/enrichment/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Apple", "limit": 10}'
```

## 📁 Project Structure

```
leadintel/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── data_loader.py         # Data loading from CSV files
│   ├── enrichment_service.py  # Company enrichment logic
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (create from .env.example)
│   └── data/                  # CSV data files
│       ├── crunchbase_companies.csv
│       ├── linkedin_companies.csv
│       └── linkedin_jobs.csv
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   ├── App.tsx            # Main app with routing
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   └── .env                   # Environment variables (create from .env.example)
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # This file
```

## 🎨 UI Features

- **Dark Theme**: Modern dark color scheme
- **Glassmorphism**: Frosted glass effect on cards
- **Animations**: Smooth transitions and floating shapes
- **Responsive**: Works on desktop, tablet, and mobile
- **Icons**: Lucide React icon library
- **Gradients**: Beautiful gradient text effects

## 🔒 Security Notes

- Never commit `.env` files to Git
- Use `.env.example` as template
- Rotate API keys regularly
- Use MongoDB Atlas IP whitelist for production
- Enable HTTPS in production (automatic on Vercel/Render)
- Update CORS_ORIGINS to specific domains in production

## 📈 Performance

- **Backend**: Async MongoDB operations for fast queries
- **Frontend**: React.memo and useMemo for optimized rendering
- **Search**: Client-side filtering for instant results
- **Data Loading**: Background loading on startup
- **Caching**: MongoDB indexes for fast searches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Data sources: Crunchbase, LinkedIn
- Icons: Lucide React
- UI inspiration: Modern glassmorphism design trends
- API integration: Apollo.io

## 📞 Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review API docs at `/docs` endpoint
- Check browser console for frontend errors
- Check backend logs for API errors

---

**Built with ❤️ using React, FastAPI, and MongoDB**
