# Team Report Manager - Backend

A Node.js/Express backend for managing team reports, projects, and tasks with AI-powered features.

## Features
- **Role-based Authentication**: Integration with Firebase Admin SDK for secure access.
- **Project & Task Management**: CRUD operations with status flow enforcement and carry-over logic.
- **AI Integration**: Powered by Groq to improve task descriptions and generate task lists.
- **Daily Reports**: Automated daily report aggregation and filtering.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: Firebase Admin SDK
- **AI**: Groq API
- **Utilities**: Nodemailer, Axios, Cors, Dotenv

## Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ArfatChowdhury/TeamReportM-backend.git
    cd TeamReportM-backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file based on `.env.example` and fill in your credentials:
    - `MONGO_URI`
    - `GROQ_API_KEY`
    - `GOOGLE_APPLICATION_CREDENTIALS` (path to your `serviceAccountKey.json`)
    - `FIREBASE_PROJECT_ID`

4.  **Seed Initial Data**:
    ```bash
    npm run seed
    ```

5.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

## API Endpoints
- `GET /api/auth/me`: Current user profile.
- `GET /api/projects`: List projects (role-filtered).
- `PATCH /api/tasks/:id/status`: Update task status with flow enforcement.
- `POST /api/ai/improve-task`: AI-powered task enhancement.
- `GET /api/reports/daily`: Daily status reports.

## License
MIT
