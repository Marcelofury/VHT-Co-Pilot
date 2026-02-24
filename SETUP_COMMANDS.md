# VHT Co-Pilot - Setup Commands

## 1. Git Configuration

Run these commands in your terminal to set up Git credentials:

```bash
git config --global user.name "RockieRaheem"
git config --global user.email "kamwangaraheem2050@gmail.com"
```

## 2. Clone the Repository (if not already done)

```bash
cd ~/Desktop
git clone https://github.com/Marcelofury/VHT-Co-Pilot.git
cd VHT-Co-Pilot
```

## 3. Create React Native Project (Expo - recommended for hackathons)

```bash
npx create-expo-app@latest vht-copilot-mobile --template blank-typescript
cd vht-copilot-mobile
npx expo install expo-router expo-speech expo-av expo-location expo-haptics
npx expo install react-native-gesture-handler react-native-reanimated
npm install axios zustand @tanstack/react-query
npm install nativewind tailwindcss
```

## 4. Create Django Backend

```bash
cd ../
mkdir vht-copilot-backend && cd vht-copilot-backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
pip install django djangorestframework django-cors-headers
pip install djangorestframework-simplejwt python-dotenv
pip install openai groq transformers
django-admin startproject vht_backend .
python manage.py startapp patients
python manage.py startapp triage
python manage.py startapp voice_processing
python manage.py startapp referrals
```

## 5. Run Development Servers

### Backend:

```bash
cd vht-copilot-backend
python manage.py migrate
python manage.py runserver
```

### Mobile App:

```bash
cd vht-copilot-mobile
npx expo start
```

---

## Project Structure Created:

- `vht-copilot-mobile/` - React Native (Expo) mobile app
- `vht-copilot-backend/` - Django REST API backend
