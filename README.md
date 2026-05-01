# 🛠️ Team Report Manager (Backend API)

The robust, role-enforced REST API powering the Top Team Manager platform. Built with Node.js, Express, and MongoDB, with deep integration for Firebase Auth and Groq AI.

## 🚀 Live API URL
`https://team-report-m-backend.vercel.app/api`

---

## 🔐 Key API Features

### 🛡️ Role-Based Access Control (RBAC)
- **Strict Authorization:** Middleware enforces access levels for `Admin`, `Leader`, and `Member`.
- **Firebase Sync:** Automatically provisions MongoDB profiles for Firebase users on first login.
- **Cross-Role Visibility:** Leaders manage their team members, while Admins oversee the entire organization.

### 🤖 AI Engine (Groq + Llama 3.1)
- **Bulk Task Generation:** Endpoint to transform free-text project descriptions into structured JSON task lists.
- **Executive Summaries:** Generates professional project overviews for email reports.
- **Content Improvement:** Intelligent refinement of task metadata.

### ✉️ Email Reporting (SMTP)
- **HTML Templating:** Professional project report layouts with task tables.
- **SSRF Protection:** Proxy system for safely embedding external images in emails.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js (Express)
- **Database:** MongoDB (Mongoose)
- **Auth:** Firebase Admin SDK
- **AI:** Groq SDK (Llama 3.1 8B Instant)
- **Email:** Nodemailer (SMTP)
- **Deployment:** Vercel (Serverless Functions)

---

## ⚙️ Environment Variables
To run the backend locally or deploy it, you must configure the following `.env` variables:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# AI
GROQ_API_KEY=your_groq_api_key

# Firebase Admin SDK (Private Key JSON)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# SMTP Configuration (For Email Reports)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

---

## 🏗️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ArfatChowdhury/TeamReportM-backend.git
   cd TeamReportM-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

---

## 📁 Repository Links
- **Frontend:** [https://github.com/ArfatChowdhury/Team-Report-Manager](https://github.com/ArfatChowdhury/Team-Report-Manager)
- **Backend:** [https://github.com/ArfatChowdhury/TeamReportM-backend](https://github.com/ArfatChowdhury/TeamReportM-backend)

---
**Developed by Arfat Chowdhury**
