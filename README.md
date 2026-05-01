# Top Team Manager - Backend 🌐

The robust server-side engine powering the Top Team Manager platform. Built for scalability on Vercel with MongoDB Atlas and Firebase integration.

## 🚀 Key Modules

- **AI Engine**: Integrated with Groq (Llama 3.1) for task suggestion and text improvement.
- **Auto-Sync Auth**: Custom middleware that automatically synchronizes Firebase Auth users into MongoDB profiles.
- **Reporting System**: Real-time aggregation of task progress and team productivity metrics.
- **Bulk Operations**: High-performance endpoints for multi-task project initialization.

## 🛠️ Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5.x
- **Database**: MongoDB (Mongoose)
- **Auth**: Firebase Admin SDK
- **Deployment**: Vercel

## ⚙️ Configuration

Set the following variables in your `.env` or Vercel Environment:
- `MONGO_URI`: MongoDB connection string.
- `GROQ_API_KEY`: API key for Groq Cloud.
- `JWT_SECRET`: Secret key for session management.
- `serviceAccountKey.json`: Firebase Admin credentials.

## 📦 Deployment

This backend is pre-configured for Vercel. 
```bash
vercel --prod
```

---
© 2026 Arfat Chowdhury
