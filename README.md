# MedTrack — Frontend (Static Web Application)

This folder contains the complete, modern, responsive frontend for MedTrack.

## Files
- `index.html` — Patient schedule dashboard, adherence tracker, and prescription scanner.
- `login.html` — Patient sign-in page.
- `signup.html` — Patient registration page.
- `admin.html` — Doctor / Admin management dashboard.
- `css/styles.css` — Modern UI design system, glassmorphism, responsive styles.
- `js/config.js` — Backend API URL configuration.
- `js/script.js` — Client-side application logic and API calls.
- `render.yaml` — Static Site deployment blueprint for Render.

## How to Connect to Backend
Open `js/config.js` and set your backend URL:
```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-medtrack-backend.onrender.com'
};
```

## Manual Deployment on Render (Static Site)
1. In Render Dashboard: **New +** $\rightarrow$ **Static Site**.
2. Connect this frontend folder or repo.
3. Settings:
   - **Build Command**: *(Leave empty)*
   - **Publish Directory**: `.`
4. Click **Create Static Site**.
