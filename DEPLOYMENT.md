# Deployment Guide - Innovatehub API Generator

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bossm747/innovatehub-api-generator)

### Option 2: Manual Deployment

1. **Fork or Clone the Repository**
   ```bash
   git clone https://github.com/bossm747/innovatehub-api-generator.git
   cd innovatehub-api-generator
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In your Vercel project settings, add:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_08eaQdWqkRTn@ep-solitary-salad-afenjx64-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project-name.vercel.app`

## 🗄️ Database Setup

The application uses **Neon PostgreSQL** for persistent storage:

- **Project ID**: `flat-sunset-84142638`
- **Database**: `neondb`
- **Connection String**: Already configured in `vercel.json`

### Database Schema

The following tables are automatically created:

- `recordings` - Stores browser automation recordings
- `api_registry` - Manages generated APIs
- `settings` - Application configuration
- `api_calls` - API usage analytics

## 🔧 Local Development

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Environment Variables**
   Create `.env` files:
   
   **Backend `.env`:**
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_08eaQdWqkRTn@ep-solitary-salad-afenjx64-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
   OPENAI_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   PORT=3001
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## 🌐 Production Features

### Full-Stack Architecture
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Vercel (serverless functions)

### Key Features
- ✅ Browser interaction recording
- ✅ AI-powered script generation
- ✅ Live API registry with Swagger testing
- ✅ Multiple AI provider support
- ✅ Persistent data storage
- ✅ Real-time analytics
- ✅ Production-ready deployment

### API Endpoints

**Core APIs:**
- `GET /api/health` - Health check
- `POST /api/recordings` - Create recording
- `GET /api/recordings` - List recordings
- `GET /api/recordings/:id` - Get recording details

**Live API Registry:**
- `GET /api/live/apis` - List registered APIs
- `POST /api/live/apis/:id/execute` - Execute API
- `GET /api/live/apis/:id/swagger` - Swagger UI
- `GET /api/live/dashboard` - API dashboard

**Settings:**
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings
- `POST /api/settings/test-ai` - Test AI connection

## 🔐 Security

- Database connections use SSL/TLS encryption
- API keys are stored securely in environment variables
- CORS configured for production domains
- Input validation and sanitization

## 📊 Monitoring

- Built-in analytics for API usage
- Performance monitoring for response times
- Error tracking and logging
- Database health monitoring

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` environment variable
   - Check Neon database status
   - Ensure SSL is enabled

2. **AI Generation Not Working**
   - Verify AI provider API keys
   - Check API quotas and limits
   - Test AI connection in settings

3. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Support

For issues and support:
- GitHub Issues: [Repository Issues](https://github.com/bossm747/innovatehub-api-generator/issues)
- Documentation: Check README.md
- Community: GitHub Discussions

---

**Developed by BossM | Innovatehub API Generator**
