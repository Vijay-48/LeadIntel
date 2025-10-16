# Data Files for Deployment

## \ud83d\udccb Overview

LeadIntel requires data files to be deployed with the backend. These files are located in `/backend/data/` directory.

## \ud83d\udcc2 Required Data Files

The following files must be present for the app to function:

### JSON Files (Crunchbase Data)
- `crunchbase-keyword-results.json` (816 KB)
- `crunchbase-company-profiles.json` (79 KB)

### CSV Files (LinkedIn & Company Data)
- `companies.csv` (5.7 MB) - Company information
- `company_industries.csv` (430 KB) - Industry mappings
- `company_specialities.csv` (3.0 MB) - Company specializations
- `employee_counts.csv` (480 KB) - Employee count data
- `job_postings.csv` (62 MB) - Job postings data

**Total Size**: ~147 MB

## \ud83d\ude80 Deployment Considerations

### Git Repository Size

The total data size is **147 MB**, which is acceptable for most Git hosting platforms:
- **GitHub**: 100 MB per file limit, 5 GB repo limit \u2705
- **GitLab**: 5 GB repo limit \u2705
- **Bitbucket**: 2 GB repo limit \u2705

**Largest file**: `job_postings.csv` (62 MB) - within GitHub's 100 MB limit \u2705

### Platform-Specific Notes

#### Render
- \u2705 Handles files up to 500 MB in repo
- \u2705 Files automatically deployed with service
- \u26a0\ufe0f Build time may be longer (5-10 minutes)

#### Railway
- \u2705 No specific file size limits
- \u2705 Automatic deployment
- \u26a0\ufe0f Watch out for egress bandwidth costs

#### Heroku
- \u26a0\ufe0f Slug size limit: 500 MB (should be fine)
- \u2705 Files included in deployment

#### Vercel/Netlify
- \u274c Not applicable (frontend only, no backend files needed)

## \ud83d\udee0\ufe0f Verification Before Deployment

Before deploying, verify all data files exist:

```bash
cd /app/backend/data
ls -lh

# Should show:
# - companies.csv (5.7M)
# - companies.json (75M)  # This may not be needed - check data_loader.py
# - company_industries.csv (430K)
# - company_specialities.csv (3.0M)
# - crunchbase-company-profiles.json (79K)
# - crunchbase-keyword-results.json (816K)
# - employee_counts.csv (480K)
# - job_postings.csv (62M)
```

## \ud83d\udcc4 Git LFS (Large File Storage)

If you encounter issues with large files, use Git LFS:

```bash
# Install Git LFS
git lfs install

# Track large CSV files
git lfs track "backend/data/*.csv"
git lfs track "backend/data/*.json"

# Add .gitattributes
git add .gitattributes

# Commit and push
git add backend/data/
git commit -m "Add data files with LFS"
git push
```

**Note**: Most platforms (Render, Railway, Heroku) support Git LFS automatically.

## \u26a0\ufe0f Alternative: Cloud Storage

If data files are too large for Git, consider cloud storage:

### Option 1: AWS S3

1. Upload files to S3 bucket
2. Modify `data_loader.py` to download from S3 on startup:

```python
import boto3
import os

def download_data_files():
    s3 = boto3.client('s3')
    bucket = 'leadintel-data'
    files = ['companies.csv', 'job_postings.csv', ...]
    
    for file in files:
        local_path = f'/tmp/{file}'
        s3.download_file(bucket, file, local_path)
```

### Option 2: Google Cloud Storage

Similar approach using `google-cloud-storage` library.

### Option 3: Direct URLs

Host files on CDN and download on startup:

```python
import requests

def download_data_files():
    files = {
        'companies.csv': 'https://cdn.example.com/companies.csv',
        'job_postings.csv': 'https://cdn.example.com/jobs.csv',
    }
    
    for filename, url in files.items():
        response = requests.get(url)
        with open(f'/tmp/{filename}', 'wb') as f:
            f.write(response.content)
```

## \ud83d\udcca Data Loading Process

On startup, the backend:
1. Checks if data is already loaded in MongoDB
2. If not, reads files from `/backend/data/`
3. Parses JSON and CSV files
4. Inserts data into MongoDB collections
5. Creates indexes for fast querying

**First startup**: Takes 30-60 seconds to load all data
**Subsequent startups**: Instant (data already in MongoDB)

## \ud83d\udee1\ufe0f .gitignore Considerations

Ensure data files are NOT in `.gitignore`:

```bash
# Check .gitignore
cat /app/.gitignore | grep -E "(\.csv|\.json|data/)"

# Should NOT match data files
# If it does, update .gitignore to exclude data directory:
# !/backend/data/*.csv
# !/backend/data/*.json
```

## \u2705 Deployment Checklist

Before deploying:

- [ ] All data files present in `/backend/data/`
- [ ] Total size < 500 MB (currently ~147 MB) \u2705
- [ ] Largest file < 100 MB (job_postings.csv is 62 MB) \u2705
- [ ] Files not in `.gitignore`
- [ ] Git LFS configured (if needed)
- [ ] Files committed to Git: `git add backend/data/ && git commit`
- [ ] Files pushed to remote: `git push`
- [ ] Verify files in GitHub/GitLab web interface

## \ud83d\udc1b Troubleshooting

### "Data files not found" error

**Cause**: Files not included in deployment

**Fix**:
```bash
# Verify files in repo
git ls-files backend/data/

# If empty, add files
git add -f backend/data/*.csv backend/data/*.json
git commit -m "Add data files"
git push
```

### "Status: empty" after deployment

**Cause**: Data loading failed or still in progress

**Fix**:
1. Check backend logs in deployment platform
2. Wait 1-2 minutes for data loading
3. Manual trigger: `curl -X POST https://backend/api/data/load`
4. Check MongoDB connection is working

### Build timeout on platform

**Cause**: Large files causing slow upload

**Fix**:
1. Use Git LFS for large files
2. Consider cloud storage alternative
3. Increase build timeout (platform settings)
4. Split large CSV files into smaller chunks

## \ud83d\udca1 Optimization Tips

### Reduce Data Size (Optional)

If needed, reduce file sizes:

```bash
# Keep only essential columns
# Keep top 10,000 companies instead of all
head -n 10000 job_postings.csv > job_postings_small.csv

# Compress data
gzip backend/data/*.csv
# Then modify data_loader.py to handle .gz files
```

### MongoDB Indexes

Ensure indexes are created for fast queries (already handled in data_loader.py):
- Company name
- Industry
- Location
- Employee count

---

**Ready for deployment!** All data files are included and optimized for cloud platforms. \ud83d\ude80
