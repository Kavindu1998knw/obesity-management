# Obesity Management System 🏥🥗

[![CI Quality Gate](https://github.com/Kavindu1998knw/obesity-management/actions/workflows/ci.yml/badge.svg)](https://github.com/Kavindu1998knw/obesity-management/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/Node.js-v20_LTS-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19.2-61DAFB?logo=react)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/Express-v5.1-000000?logo=express)](https://expressjs.com/)
[![Python Version](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2D6?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_8.16-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose_v2-2496ED?logo=docker)](https://www.docker.com/)
[![OpenAPI 3.0](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?logo=swagger)](http://localhost:5000/api-docs)

An intelligent, full-stack clinical decision-support and dietary management web platform developed for the **BSc (Hons) in Software Engineering** degree final-year project at **Cardiff Metropolitan University**.

The platform combines a **17-feature supervised Machine Learning (Random Forest) classifier** for multi-class obesity risk stratification, an **automated bio-energetic nutritional engine (Mifflin-St Jeor BMR & TDEE)** seeded with **56 authentic Sri Lankan meal templates**, conflict-free appointment workflows, longitudinal patient progress tracking, and client-side color-gamut sanitized PDF clinical reporting.

---

## 🌟 Key System Features

### 🛡️ 1. Administrator Portal
* **Clinician Management:** Provision doctor profiles, send automated HTML credentials emails with 48-hour password reset tokens, and toggle account statuses.
* **Patient Directory & Doctor Assignment:** Filter registered patients and assign primary clinicians.
* **Anti-Conflict Appointment Management:** Approve, reject (with mandatory reason), or reschedule appointments with real-time double-booking verification for both clinicians and patients.
* **Global System Analytics:** Interactive Recharts analytics tracking 6-month assessment trends and system-wide obesity distributions.
* **Audit Reporting:** Generate 5 exportable administrative audit reports in PDF format.

### 🩺 2. Doctor / Clinician Portal
* **Patient Clinical Dossier:** View comprehensive patient history across medical notes, prior assessments, and active meal plans.
* **ML-Powered Obesity Risk Stratification:** Input 17 physiological and lifestyle features to receive real-time classification across 7 WHO categories with class confidence percentages and top-3 probability breakdowns.
* **Automated Sri Lankan Meal Planning Engine:** Calculate BMR (Mifflin-St Jeor), TDEE, and disease-adjusted caloric targets ($\ge 1200\text{ kcal}$ safety floor), automatically curating 4-slot daily meal plans from 56 native Sri Lankan dishes.
* **Slot Substitution:** Query alternative meal templates to swap individual meal items while maintaining macro balances.
* **Clinical Consultation Notes:** Multi-author clinical progress notes with strict author ownership protection.
* **Consultation Completion:** Complete appointments with mandatory consultation notes and follow-up flags.

### 👤 3. Patient Portal
* **Self-Registration & Security:** Patient self-registration with bcrypt password hashing (12 salt rounds) and stateless 7-day JWT authentication.
* **Appointment Booking:** Request consultation slots with active clinicians, view status updates, and cancel pending requests.
* **Approved Meal Plan Review:** Access tailored daily meal plans complete with portion sizes, macronutrient breakdowns, hydration targets, and substitute suggestions.
* **Longitudinal Progress Tracking:** Log daily body weight, meal plan compliance, and physical activity with interactive Recharts BMI trend lines.
* **Sanitized PDF Health Reports:** Export client-side clinical health summaries using a custom color-gamut converter (`pdfExport.js`) supporting modern Tailwind v4 CSS.

---

## 🧠 Machine Learning Subsystem

* **Algorithm:** `RandomForestClassifier` (scikit-learn `1.6.1` Pipeline serialized via `joblib` into a 19.5 MB model binary).
* **Dataset:** UCI Obesity Levels dataset ($N=2,087$ clean records across 17 features).
* **Engineered Feature:** $\text{Physical\_Activity\_Score} = (\text{FAF} \times 3) + \left(1 - \frac{\text{TUE}}{24}\right) \times 2$.
* **Classification Targets (7 WHO Classes):** `Insufficient_Weight`, `Normal_Weight`, `Overweight_Level_I`, `Overweight_Level_II`, `Obesity_Type_I`, `Obesity_Type_II`, `Obesity_Type_III`.
* **Empirical Test Performance ($N=418$ independent test instances):**
  * **Overall Accuracy:** `94.26%`
  * **Macro-Averaged Precision:** `94.59%`
  * **Macro-Averaged Recall:** `94.05%`
  * **Macro-Averaged F1-Score:** `94.15%`
  * **10-Fold Stratified Cross-Validation F1-Score:** `94.43%`

---

## 🥗 Nutritional & Energy Balance Formulations

1. **Body Mass Index (BMI):** $\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Height (m)})^2}$
2. **Basal Metabolic Rate (Mifflin-St Jeor):**
   * $\text{BMR}_{\text{Male}} = (10 \times W_{\text{kg}}) + (6.25 \times H_{\text{cm}}) - (5 \times A) + 5$
   * $\text{BMR}_{\text{Female}} = (10 \times W_{\text{kg}}) + (6.25 \times H_{\text{cm}}) - (5 \times A) - 161$
3. **Total Daily Energy Expenditure (TDEE):** $\text{TDEE} = \text{BMR} \times \text{Activity Factor}$ ($1.20$ to $1.725$).
4. **Caloric Adjustment by Class:** Insufficient ($+300$), Normal ($0$), Overweight I ($-300$), Overweight II ($-400$), Obesity I/II/III ($-500$), clamped to $\ge 1200\text{ kcal}$.
5. **Daily Meal Split:** Breakfast ($25\%$), Lunch ($35\%$), Dinner ($30\%$), Snack ($10\%$).
6. **Sri Lankan Meal Library:** 56 seeded authentic native recipes (Red Rice Milk Rice, String Hoppers, Kurakkan Pittu, Pol Roti, Dhal Curry, Fish Ambul Thiyal, etc.) with 9 allergen filters and medical warning tags.

---

## 📁 Monorepo Project Structure

```
obesity-management/
├── .github/
│   └── workflows/
│       └── ci.yml                          # 4-stage GitHub Actions CI pipeline
├── backend/
│   ├── config/
│   │   └── dbConnection.js                 # Mongoose connection with timeout handling
│   ├── controllers/                        # 13 REST API controllers (~4,500 lines)
│   ├── docs/
│   │   └── swagger.js                      # OpenAPI 3.0.3 documentation (2,728 lines)
│   ├── middleware/
│   │   └── authMiddleware.js               # JWT verification & RBAC authorization
│   ├── models/                             # 9 Mongoose schemas (User, Patient, Doctor, Appt, etc.)
│   ├── routes/                             # 13 Express route files (53 endpoints)
│   ├── scripts/
│   │   ├── seedMealTemplates.js            # Seeds 56 authentic Sri Lankan meal templates
│   │   ├── testSchema.js                   # Mongoose schema validation tests
│   │   └── verifyMath.js                   # BMR / TDEE mathematical calculation validator
│   ├── services/
│   │   └── emailService.js                 # Nodemailer credentials dispatcher
│   ├── Dockerfile                          # Node.js 20 Alpine production image
│   └── index.js                            # Express server entry point
├── frontend/
│   ├── public/                             # Favicons and SVG sprite assets
│   ├── src/
│   │   ├── components/                     # 11 reusable components and admin modals
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx         # App shell with in-DOM logout confirmation
│   │   ├── pages/                          # 24 React page views across 3 roles
│   │   ├── router/
│   │   │   └── AppRouter.jsx               # React Router v7 routes & protected guards
│   │   ├── services/
│   │   │   └── apiClient.js                # Axios client with auto 401/403 interceptors
│   │   ├── utils/
│   │   │   └── pdfExport.js                # 363-line modern CSS gamut sanitizer for PDF
│   │   └── index.css                       # Tailwind CSS v4 stylesheets
│   ├── Dockerfile                          # Multi-stage build (Node 20 -> Nginx 1.27)
│   ├── nginx.conf                          # Production Nginx SPA routing & Gzip
│   └── vite.config.js                      # Vite 8 configuration
├── ml-service/
│   ├── models/
│   │   └── final_obesity_random_forest_pipeline.joblib # Serialized 19.5 MB Random Forest
│   ├── app.py                              # Flask 3.1 inference microservice (Port 5001)
│   ├── Dockerfile                          # Python 3.11 Slim production image
│   └── requirements.txt                    # ML dependencies
├── docker-compose.yml                      # 3-tier container orchestration
├── package.json                            # Root concurrently script runner
└── README.md                               # Project documentation
```

---

## 🛠️ Complete Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend SPA** | React 19.2, Vite 8.1, Tailwind CSS 4.3, React Router DOM 7.18, Axios 1.18, Recharts 3.10, Lucide React 1.33, Framer Motion 12.41, html2pdf.js 0.14 |
| **Backend API** | Node.js 20 Alpine, Express 5.1.0, Mongoose 8.16.0, JSON Web Token 9.0, BcryptJS 3.0, Nodemailer 7.0, Swagger UI Express 5.0 |
| **ML Microservice** | Python 3.11 Slim, Flask 3.1.1, Scikit-learn 1.6.1, Pandas 2.2.3, NumPy 2.2.6, Joblib 1.4.2 |
| **Database** | MongoDB Atlas (Cloud Cluster Replica Set) |
| **DevOps & QA** | Docker & Compose v2, Nginx 1.27 Alpine, Oxlint 1.69, GitHub Actions CI |

---

## 🚀 Getting Started

### 📋 Prerequisites
* [Node.js](https://nodejs.org/) (v20 LTS recommended)
* [Python](https://www.python.org/) (v3.11 recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection string)
* [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized run)

---

### ⚙️ Option 1: Running Locally with Concurrently (Recommended for Dev)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Kavindu1998knw/obesity-management.git
   cd obesity-management
   ```

2. **Install All Dependencies:**
   ```bash
   npm install
   npm run install-all
   ```

3. **Install Python ML Dependencies:**
   ```bash
   cd ml-service
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure Environment Variables:**
   * Duplicate `backend/.env.example` as `backend/.env`:
     ```bash
     cp backend/.env.example backend/.env
     ```
   * Update configuration variables:
     ```env
     PORT=5000
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/obesity_management_db
     JWT_SECRET=your_super_secret_jwt_key_here
     ML_SERVICE_URL=http://localhost:5001
     ```

5. **Seed the 56 Sri Lankan Meal Templates:**
   ```bash
   npm run seed:meals
   ```

6. **Start All 3 Services Concurrently:**
   ```bash
   npm run dev
   ```
   * **Frontend Client:** [http://localhost:5173](http://localhost:5173)
   * **Express API Gateway:** [http://localhost:5000](http://localhost:5000)
   * **Swagger OpenAPI Docs:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
   * **Flask ML Microservice:** [http://localhost:5001](http://localhost:5001)

---

### 🐳 Option 2: Running via Docker Compose

To launch the complete containerized three-tier system in an isolated network:

```bash
docker compose up --build
```

* **Frontend Web Application (Nginx):** [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173)
* **Backend Express Server:** [http://localhost:5000](http://localhost:5000)
* **Swagger API Documentation:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
* **Python ML Service:** [http://localhost:5001](http://localhost:5001)

---

## 📖 API Documentation

Interactive OpenAPI 3.0 documentation is fully generated and accessible at:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

Raw JSON specification is available at `GET /api-docs.json`.

---

## 🧪 Testing & Validation

Execute scripted validation utilities:

* **Validate BMR / TDEE & Caloric Math:**
  ```bash
  node backend/scripts/verifyMath.js
  ```
* **Validate Mongoose Schema Constraints:**
  ```bash
  node backend/scripts/testSchema.js
  ```
* **Frontend Code Quality & Linting:**
  ```bash
  cd frontend && npm run lint
  ```

---

## 📄 License & Attribution

This software was designed and engineered by **Kavindu Weerasinghe** as a final-year software engineering degree dissertation project for **Cardiff Metropolitan University**. All rights reserved.
