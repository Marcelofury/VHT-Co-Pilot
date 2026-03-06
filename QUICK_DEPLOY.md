# Quick Deployment Commands

## Backend to Render

### 1. Push to GitHub
```bash
cd vht-copilot-backend
git add .
git commit -m "chore: Add production deployment configuration"
git push origin main
```

### 2. Deploy on Render
- Go to https://dashboard.render.com/
- New → Blueprint
- Connect GitHub repo
- Render auto-detects `render.yaml`
- Set environment variables:
  - `GROQ_API_KEY` (from https://console.groq.com)
  - `ALLOWED_HOSTS` (your-app.onrender.com)
  - `CORS_ALLOWED_ORIGINS` (your frontend URL)

### 3. Run migrations
- In Render Shell tab:
```bash
python manage.py migrate
python manage.py createsuperuser
```

## Frontend to Vercel

### 1. Push to GitHub
```bash
cd vht-copilot-mobile
git add .
git commit -m "chore: Add Vercel deployment config"
git push origin main
```

### 2. Deploy on Vercel
- Go to https://vercel.com/dashboard
- New Project → Import from GitHub
- Root Directory: `vht-copilot-mobile`
- Environment Variables:
  - `EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api`
- Deploy!

### 3. Update Backend CORS
Add Vercel URL to backend env vars:
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.
