# VHT Co-Pilot Deployment Guide

## 🚀 Deployment Overview

- **Backend**: Deploy to Render (Django REST API + PostgreSQL)
- **Frontend**: Deploy to Vercel (Expo Web version)
- **Mobile Apps**: Build with EAS Build for Android/iOS app stores

---

## 📦 Backend Deployment (Render)

### Prerequisites
- [Render account](https://render.com) (free tier available)
- GitHub repository connected to Render

### Step 1: Push Code to GitHub
```bash
cd vht-copilot-backend
git add .
git commit -m "chore: Add production deployment configuration"
git push origin main
```

### Step 2: Deploy on Render

#### Option A: Using Render Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` and create:
   - Web Service (Django API)
   - PostgreSQL Database
5. Click **"Apply"**

#### Option B: Manual Setup
1. **Create PostgreSQL Database**:
   - Go to Render Dashboard
   - Click **"New"** → **"PostgreSQL"**
   - Name: `vht-copilot-db`
   - Plan: Free
   - Note the **Internal Database URL**

2. **Create Web Service**:
   - Click **"New"** → **"Web Service"**
   - Connect GitHub repository
   - Select `vht-copilot-backend` folder
   - Settings:
     - **Name**: `vht-copilot-backend`
     - **Runtime**: Python 3
     - **Build Command**: `bash build.sh`
     - **Start Command**: `gunicorn config.wsgi:application`
     - **Instance Type**: Free

3. **Add Environment Variables**:
   ```
   DATABASE_URL=<paste Internal Database URL>
   SECRET_KEY=<generate random 50-char string>
   DEBUG=False
   ALLOWED_HOSTS=vht-copilot-backend.onrender.com,localhost
   CORS_ALLOWED_ORIGINS=https://vht-copilot.vercel.app,http://localhost:8081
   GROQ_API_KEY=<your groq api key>
   OPENAI_API_KEY=<your openai api key>
   USE_GROQ_LLM=true
   ```

4. Click **"Create Web Service"**

### Step 3: Verify Deployment
After deployment completes (5-10 minutes):
- Visit: `https://vht-copilot-backend.onrender.com/api/health/`
- Should return: `{"status": "healthy"}`

### Step 4: Run Migrations (First Time Only)
1. Go to Render Dashboard → Web Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

---

## 🌐 Frontend Deployment (Vercel)

### Prerequisites
- [Vercel account](https://vercel.com) (free tier available)
- GitHub repository

### Step 1: Push Code to GitHub
```bash
cd vht-copilot-mobile
git add .
git commit -m "chore: Add Vercel deployment configuration"
git push origin main
```

### Step 2: Deploy on Vercel

#### Option A: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select `vht-copilot-mobile` folder
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `vht-copilot-mobile`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   ```
   EXPO_PUBLIC_API_URL=https://vht-copilot-backend.onrender.com/api
   ```
7. Click **"Deploy"**

#### Option B: Vercel CLI
```bash
cd vht-copilot-mobile
npm install -g vercel
vercel login
vercel
# Follow prompts, set API_URL when asked
```

### Step 3: Update Backend CORS
Add your Vercel URL to backend environment variables:
```
CORS_ALLOWED_ORIGINS=https://vht-copilot.vercel.app,https://vht-copilot-*.vercel.app
```

### Step 4: Verify Deployment
- Visit: `https://vht-copilot.vercel.app`
- Test login and features

---

## 📱 Mobile App Deployment (App Stores)

### Prerequisites
- [Expo account](https://expo.dev)
- EAS CLI installed

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS
```bash
cd vht-copilot-mobile
eas build:configure
```

### Step 3: Build for Android
```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

### Step 4: Build for iOS
```bash
# Requires Apple Developer account ($99/year)
eas build --platform ios --profile production
```

### Step 5: Submit to App Stores
```bash
# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## 🔧 Environment Variables Reference

### Backend (Render)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | Yes | Auto-provided by Render |
| `SECRET_KEY` | Django secret key | Yes | Generate 50-char random string |
| `DEBUG` | Debug mode | Yes | `False` |
| `ALLOWED_HOSTS` | Allowed hostnames | Yes | `vht-copilot-backend.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs | Yes | `https://vht-copilot.vercel.app` |
| `GROQ_API_KEY` | GROQ AI API key | Yes | Get from [console.groq.com](https://console.groq.com) |
| `OPENAI_API_KEY` | OpenAI API key | Optional | For Whisper transcription |
| `USE_GROQ_LLM` | Use GROQ instead of OpenAI | No | `true` |

### Frontend (Vercel)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes | `https://vht-copilot-backend.onrender.com/api` |

---

## 🚨 Common Issues

### Backend Issues

#### 1. "Application failed to start"
- Check logs: Render Dashboard → Logs tab
- Verify all environment variables are set
- Check `requirements.txt` has all dependencies

#### 2. "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check PostgreSQL database is running
- Ensure database migrations ran: `python manage.py migrate`

#### 3. "Static files not loading"
- Run: `python manage.py collectstatic --no-input`
- Verify `whitenoise` is in middleware

#### 4. "CORS errors"
- Update `CORS_ALLOWED_ORIGINS` to include frontend URL
- Include both production and preview URLs

### Frontend Issues

#### 1. "API requests failing"
- Check `EXPO_PUBLIC_API_URL` environment variable
- Verify backend CORS allows your domain
- Check backend is running

#### 2. "Build failed"
- Run locally first: `npm run build:web`
- Check for TypeScript errors
- Verify all dependencies installed

#### 3. "Blank page after deployment"
- Check browser console for errors
- Verify `vercel.json` routing is correct
- Clear cache and redeploy

---

## 📊 Monitoring & Logs

### Render Monitoring
- **Logs**: Dashboard → Web Service → Logs
- **Metrics**: CPU, RAM, response time
- **Shell Access**: Debug with Python shell

### Vercel Monitoring
- **Logs**: Dashboard → Project → Deployments → View Function Logs
- **Analytics**: Built-in web analytics
- **Speed Insights**: Performance monitoring

---

## 💰 Cost Estimate

### Free Tier (Development)
- **Render**: 750 hours/month free, PostgreSQL included
- **Vercel**: Unlimited deployments, 100GB bandwidth
- **Total**: $0/month

### Production Tier (Recommended)
- **Render Starter**: $7/month (better performance)
- **Vercel Pro**: $20/month (domains, analytics)
- **Total**: $27/month

---

## 🔒 Security Checklist

Before going live:
- ✅ Change `SECRET_KEY` to random 50+ character string
- ✅ Set `DEBUG=False` in production
- ✅ Configure `ALLOWED_HOSTS` properly
- ✅ Set up HTTPS (automatic on Render/Vercel)
- ✅ Enable database backups (Render PostgreSQL settings)
- ✅ Review CORS settings
- ✅ Set up error monitoring (Sentry recommended)
- ✅ Regular security updates: `pip list --outdated`

---

## 🎯 Next Steps

1. **Set up CI/CD**: Auto-deploy on git push
2. **Add monitoring**: Sentry for error tracking
3. **Database backups**: Weekly automated backups
4. **Custom domain**: Point your domain to deployments
5. **SSL certificates**: Automatic with custom domains
6. **Load testing**: Test with expected user load
7. **Documentation**: Update API docs with production URL

---

## 📞 Getting Help

- **Render Support**: [Render Community](https://community.render.com/)
- **Vercel Support**: [Vercel Support](https://vercel.com/support)
- **Expo Support**: [Expo Forums](https://forums.expo.dev/)

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables documented
- [ ] Database migrations tested
- [ ] Static files collected locally
- [ ] CORS origins configured
- [ ] Secret keys generated

### Deployment
- [ ] Backend deployed to Render
- [ ] Database created and connected
- [ ] Migrations run successfully
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set

### Post-Deployment
- [ ] Health check endpoint works
- [ ] Login functionality tested
- [ ] API endpoints responding
- [ ] Mobile app can connect
- [ ] Error logging configured

---

**Deployment Status**: 🟢 Ready to deploy!

For issues or questions, refer to the main [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md)
