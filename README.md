# Obesity Management System 🏥

A modern, full-stack **MERN (MongoDB, Express.js, React, Node.js)** application designed for obesity management.

---

## 📁 Project Structure

This project is organized as a monorepo containing both the frontend and backend:

*   **`backend/`**: Node.js & Express.js REST API with Mongoose schemas for MongoDB.
*   **`frontend/`**: React application built with Vite for fast HMR (Hot Module Replacement) and optimized bundling.

---

## 🚀 Getting Started

### 📋 Prerequisites

Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas URI)
*   [Git](https://git-scm.com/)

---

### 🔧 Installation & Setup

1.  **Clone the Repository** (once pushed to GitHub):
    ```bash
    git clone https://github.com/<your-username>/obesity-management.git
    cd obesity-management
    ```

2.  **Install Dependencies**:
    You can install dependencies for the root, frontend, and backend all at once:
    ```bash
    npm install
    npm run install-all
    ```

3.  **Configure Environment Variables**:
    *   Navigate to the `backend/` folder.
    *   Duplicate `.env.example` and rename it to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Open `backend/.env` and update the port and MongoDB connection string as needed:
        ```env
        PORT=5000
        MONGODB_URI=mongodb://localhost:27017/obesity-management
        ```

---

## 💻 Running the Application

To run both the **Frontend** and the **Backend** concurrently in development mode, run the following command from the **root directory**:

```bash
npm run dev
```

*   **Backend Server**: Runs on [http://localhost:5000](http://localhost:5000)
*   **Frontend Client**: Runs on [http://localhost:5173](http://localhost:5173) (or next available port)

### Individual commands:
*   Run Backend only: `npm run dev-backend`
*   Run Frontend only: `npm run dev-frontend`

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, HTML5, Vanilla CSS
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB (via Mongoose ODM)
*   **Dev Tooling**: Nodemon (Backend live reload), Oxlint (Frontend linting), Concurrently (Simultaneous run)
