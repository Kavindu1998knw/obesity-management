<p align="center">
  <h1 align="center">🏥 Smart Obesity AI</h1>
  <p align="center">
    <strong>Hospital Dietary & Obesity Management System with ML-Powered Prediction</strong>
  </p>
  <p align="center">
    A full-stack web application for clinical obesity management, featuring machine learning-based obesity risk classification, personalized meal plan generation, patient progress tracking, and comprehensive multi-role dashboards.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/scikit--learn-1.6-F7931E?logo=scikit-learn&logoColor=white" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-Academic-blue" alt="License" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [Use Cases](#-use-cases)
- [Database Design](#-database-design)
- [API Reference](#-api-reference)
- [System Workflows](#-system-workflows)
  - [Authentication Flow](#1-authentication-sequence)
  - [Obesity Prediction Flow](#2-obesity-prediction-sequence)
  - [Appointment Workflow](#3-appointment-workflow-sequence)
  - [Health Record Flow](#4-health-record--progress-tracking-sequence)
  - [Meal Plan Generation Flow](#5-meal-plan-generation-sequence)
- [Machine Learning Module](#-machine-learning-module)
- [Health Calculation Engine](#-health-calculation-engine)
- [Meal Plan Generation System](#-meal-plan-generation-system)
- [Software Components](#-software-components)
- [Data Flow](#-data-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Project Structure](#-project-structure)
- [Feature Workflow](#-feature-workflow)
- [Diagram Verification](#-diagram-verification)

---

## 🔍 Overview

**Smart Obesity AI** is a web-based hospital dietary and obesity management system designed as a clinical decision-support tool. The platform connects three user roles — **Administrators**, **Doctors**, and **Patients** — through a unified interface for obesity assessment, prediction, dietary planning, and health monitoring.

### Key Capabilities

- **ML-Powered Obesity Classification** — 7-class prediction using a pre-trained Random Forest pipeline with 17 clinical/lifestyle features
- **Personalized Meal Plan Generation** — Rule-based engine calculating BMR/TDEE with dietary preference, allergy, and obesity-class-aware meal selection
- **Patient Progress Tracking** — Weight and BMI logging with historical trend visualization
- **Appointment Management** — Full lifecycle workflow with state-transition validation
- **Multi-Role Dashboards** — Real-time analytics with charts and summary metrics for each role
- **Report Generation** — Multiple report types per role with client-side PDF export
- **API Documentation** — Swagger UI with OpenAPI 3.0.3 specification

---

## 🏗 System Architecture

### System Architecture Diagram

> Source: `docker-compose.yml`, `backend/index.js`, `ml-service/app.py`, `frontend/src/services/apiClient.js`, `frontend/src/router/AppRouter.jsx`

```mermaid
flowchart TD
    subgraph Client["User Browser"]
        User["User (Admin / Doctor / Patient)"]
    end

    subgraph Frontend["Frontend Container - Port 3000/5173"]
        ReactApp["React 19 SPA (Vite 8)"]
        AppRouter["AppRouter (24 Routes)"]
        ProtectedRoute["ProtectedRoute (Role Guard)"]
        ApiClient["Axios apiClient (JWT Interceptor)"]
        PdfExport["html2pdf.js (PDF Export)"]
    end

    subgraph Backend["Backend Container - Port 5000"]
        ExpressServer["Express 5 Server (index.js)"]
        AuthMiddleware["authMiddleware (protect + authorize)"]
        SwaggerUI["Swagger UI (/api-docs)"]

        subgraph Controllers["Controllers (13 files)"]
            AuthCtrl["authController"]
            AdminCtrl["adminController"]
            DashboardCtrl["dashboardController"]
            AssessmentCtrl["assessmentController"]
            MealPlanCtrl["mealPlanController"]
            DoctorPatientCtrl["doctorPatientController"]
            DoctorApptCtrl["doctorAppointmentController"]
            PatientApptCtrl["patientAppointmentController"]
            PatientProgressCtrl["patientProgressController"]
            ReportCtrl["reportController"]
            PatientReportCtrl["patientReportController"]
            PatientAssessCtrl["patientAssessmentController"]
            PatientMealCtrl["patientMealPlanController"]
        end

        subgraph Services["Services"]
            EmailService["emailService (Nodemailer)"]
        end

        subgraph Models["Mongoose Models (9 schemas)"]
            UserModel["User"]
            PatientModel["Patient"]
            DoctorModel["Doctor"]
            AppointmentModel["Appointment"]
            AssessmentModel["Assessment"]
            MealPlanModel["MealPlan"]
            MealTemplateModel["MealTemplate"]
            ProgressModel["ProgressRecord"]
            DoctorNoteModel["DoctorNote"]
        end
    end

    subgraph MLService["ML Service Container - Port 5001"]
        FlaskApp["Flask App (app.py)"]
        RFPipeline["Random Forest Pipeline (joblib, 19.5 MB)"]
    end

    subgraph Database["Cloud Database"]
        MongoDB["MongoDB Atlas"]
    end

    subgraph External["External Services"]
        SMTP["SMTP Server (Nodemailer)"]
    end

    User --> ReactApp
    ReactApp --> AppRouter
    AppRouter --> ProtectedRoute
    ProtectedRoute --> ApiClient
    ApiClient -- "HTTP + Bearer JWT" --> ExpressServer
    ExpressServer --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> Models
    Models -- "Mongoose ODM" --> MongoDB
    AssessmentCtrl -- "HTTP POST /predict" --> FlaskApp
    FlaskApp --> RFPipeline
    RFPipeline -- "predicted_class + confidence + probabilities" --> FlaskApp
    FlaskApp -- "JSON response" --> AssessmentCtrl
    AdminCtrl --> EmailService
    EmailService -- "SMTP" --> SMTP
    ReactApp --> PdfExport
```

### Architecture Pattern

**Modular Monolith + Separate ML Microservice** — The backend follows a Model-View-Controller (MVC) pattern with Express middleware chains for authentication and authorization. The ML inference service is decoupled as a separate Flask microservice communicating via HTTP/JSON.

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.7 | Component-based UI framework |
| Vite | 8.1.0 | Build tool and development server |
| React Router DOM | 7.18.0 | Client-side SPA routing |
| TailwindCSS | 4.3.1 | Utility-first CSS framework |
| Axios | 1.18.1 | HTTP client with interceptors |
| Recharts | 3.10.1 | Data visualization and charting |
| Framer Motion | 12.41.0 | Animation library |
| Lucide React | 1.33.0 | Icon library |
| html2pdf.js | 0.14.0 | Client-side PDF generation |
| Oxlint | 1.69.0 | Fast JavaScript/TypeScript linter |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x (LTS) | JavaScript runtime |
| Express | 5.2.1 | Web application framework |
| Mongoose | 9.7.2 | MongoDB object data modeling |
| bcryptjs | 3.0.3 | Password hashing (salt rounds: 12) |
| jsonwebtoken | 9.0.3 | JWT authentication tokens |
| Nodemailer | 9.0.5 | Transactional email service |
| swagger-ui-express | 5.0.1 | Interactive API documentation |
| cors | 2.8.6 | Cross-Origin Resource Sharing |

### Machine Learning
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | ML runtime |
| Flask | 3.1.1 | Lightweight web framework |
| scikit-learn | 1.6.1 | ML model framework |
| pandas | 2.2.3 | Data manipulation |
| joblib | 1.4.2 | Model serialization |
| NumPy | 2.2.6 | Numerical computing |

### Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Docker + Docker Compose | Multi-container orchestration |
| Nginx 1.27 | Production static file server |
| GitHub Actions | CI/CD pipeline |

---

## ✨ Features

### 👨‍💼 Administrator
- **Doctor Management** — Create, update, activate/deactivate, and delete doctor accounts with welcome email notifications
- **Patient Management** — View, activate/deactivate, delete patients and assign doctors
- **Appointment Management** — Approve, reject, cancel, and reschedule appointments with state-transition validation and conflict detection
- **System Reports** — Generate patient, doctor, appointment, obesity classification, and patient progress reports with date filters
- **Dashboard Analytics** — Real-time metrics: user counts, appointment trends, obesity distribution, registration trends

### 👨‍⚕️ Doctor
- **Patient Overview** — View assigned patients with latest assessment, BMI, and obesity classification
- **Comprehensive Patient Details** — Full health profile, assessment history, meal plans, progress records, and doctor notes
- **Obesity Assessment** — 17-feature clinical assessment form with real-time ML prediction (confidence score + top 3 probabilities)
- **Meal Plan Generation** — BMR/TDEE-based calorie calculation with obesity-class-specific adjustment, dietary preference filtering, allergen exclusion, and meal swapping
- **Appointment Completion** — Mark appointments as completed with consultation notes and follow-up scheduling
- **Health Details Management** — Update patient lifestyle and dietary information with validated allowlists
- **Doctor Notes** — Create and edit clinical notes with ownership enforcement
- **Patient Reports** — Generate health, assessment, meal plan, and progress reports with PDF export

### 🧑‍🤝‍🧑 Patient
- **Self-Registration** — Create account with email, password, profile information
- **Appointment Requests** — Book appointments with active doctors, view status, and cancel with reason
- **Assessment History** — View all obesity assessments with predicted class, confidence score, and probabilities
- **Meal Plans** — View approved meal plans with nutritional details and alternative meal options
- **Progress Tracking** — Log daily weight with auto-calculated BMI, meal adherence, and physical activity
- **Personal Reports** — Generate health, assessment, meal plan, and progress reports with PDF export
- **Dashboard** — Health overview with BMI trends, weight changes, upcoming appointments, and notifications

### 🔐 Security
- JWT-based authentication with configurable expiry
- bcrypt password hashing (salt rounds: 12)
- Role-based access control (RBAC) with middleware enforcement
- Client-side route protection with role validation
- Account status enforcement (active/inactive)
- Server-side input validation and sanitization
- Automatic session expiry handling with redirect

---

## 🎭 Use Cases

### Use Case Diagram

> Source: `backend/routes/*.js`, `backend/controllers/*.js`, `frontend/src/router/AppRouter.jsx`, `backend/middleware/authMiddleware.js`

```mermaid
flowchart LR
    subgraph Actors
        Patient["🧑 Patient"]
        Doctor["👨‍⚕️ Doctor"]
        Admin["👨‍💼 Admin"]
        MLService["🤖 ML Service"]
        SMTPServer["📧 SMTP Server"]
    end

    subgraph AuthModule["Authentication"]
        Register["Register (Patient Only)"]
        Login["Login (All Roles)"]
        ResetPassword["Reset Password"]
    end

    subgraph PatientUseCases["Patient Use Cases"]
        RequestAppt["Request Appointment"]
        CancelAppt["Cancel Appointment"]
        ViewAssessments["View Assessments"]
        ViewMealPlans["View Approved Meal Plans"]
        LogProgress["Log Weight / Progress"]
        ViewPatientDashboard["View Patient Dashboard"]
        GenPatientReport["Generate Personal Report"]
        ExportPDF_P["Export Report as PDF"]
    end

    subgraph DoctorUseCases["Doctor Use Cases"]
        ViewPatients["View Assigned Patients"]
        ViewPatientDetail["View Patient Details"]
        UpdateHealthDetails["Update Health Details"]
        CreateAssessment["Create Obesity Assessment"]
        PredictObesity["Predict Obesity Class (ML)"]
        GenerateMealPlan["Generate Meal Plan"]
        ApproveMealPlan["Approve Meal Plan"]
        CompleteAppt["Complete Appointment"]
        AddDoctorNote["Add / Edit Doctor Note"]
        ViewDoctorDashboard["View Doctor Dashboard"]
        GenDoctorReport["Generate Patient Report"]
        ExportPDF_D["Export Report as PDF"]
    end

    subgraph AdminUseCases["Admin Use Cases"]
        ManageDoctors["Manage Doctors (CRUD)"]
        ManagePatients["Manage Patients"]
        AssignDoctor["Assign Doctor to Patient"]
        ToggleStatus["Toggle User Status"]
        ManageAppts["Manage Appointments"]
        ApproveRejectAppt["Approve / Reject / Reschedule"]
        ViewAdminDashboard["View Admin Dashboard"]
        GenAdminReport["Generate System Reports"]
    end

    Patient --> Register
    Patient --> Login
    Patient --> ResetPassword
    Patient --> RequestAppt
    Patient --> CancelAppt
    Patient --> ViewAssessments
    Patient --> ViewMealPlans
    Patient --> LogProgress
    Patient --> ViewPatientDashboard
    Patient --> GenPatientReport
    Patient --> ExportPDF_P

    Doctor --> Login
    Doctor --> ResetPassword
    Doctor --> ViewPatients
    Doctor --> ViewPatientDetail
    Doctor --> UpdateHealthDetails
    Doctor --> CreateAssessment
    CreateAssessment --> PredictObesity
    PredictObesity --> MLService
    Doctor --> GenerateMealPlan
    Doctor --> ApproveMealPlan
    Doctor --> CompleteAppt
    Doctor --> AddDoctorNote
    Doctor --> ViewDoctorDashboard
    Doctor --> GenDoctorReport
    Doctor --> ExportPDF_D

    Admin --> Login
    Admin --> ManageDoctors
    ManageDoctors --> SMTPServer
    Admin --> ManagePatients
    Admin --> AssignDoctor
    Admin --> ToggleStatus
    Admin --> ManageAppts
    Admin --> ApproveRejectAppt
    Admin --> ViewAdminDashboard
    Admin --> GenAdminReport
```

---

## 🗄 Database Design

### ER Diagram

> Source: `backend/models/User.js`, `Patient.js`, `Doctor.js`, `Appointment.js`, `Assessment.js`, `MealPlan.js`, `MealTemplate.js`, `ProgressRecord.js`, `DoctorNote.js`

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String fullName
        String email UK
        String password
        String role "patient | doctor | admin"
        String status "active | inactive"
        String resetPasswordToken
        Date resetPasswordExpires
        Date createdAt
    }

    PATIENT {
        ObjectId _id PK
        ObjectId userId FK "ref: User (unique)"
        ObjectId assignedDoctor FK "ref: User"
        Number height "cm"
        Number weight "kg"
        Number currentBmi
        Date dob
        String gender "Male | Female | Other"
        Object healthDetails "17 sub-fields"
        Boolean profileCompleted
        String onboardingStatus
        Date assignedDoctorAt
    }

    DOCTOR {
        ObjectId _id PK
        ObjectId userId FK "ref: User (unique)"
        String phoneNumber
        String specialisation
        String qualification
    }

    APPOINTMENT {
        ObjectId _id PK
        ObjectId patientId FK "ref: User"
        ObjectId doctorId FK "ref: User"
        Date date
        String time "HH:mm"
        String reason "max 500"
        String patientNote "max 1000"
        String status "pending | approved | rejected | completed | cancelled"
        String rejectionReason
        String cancellationReason
        String rescheduleNote
        String adminNote
        String consultationNote
        Boolean followUpRequired
        Date suggestedFollowUpDate
    }

    ASSESSMENT {
        ObjectId _id PK
        ObjectId patientId FK "ref: User"
        ObjectId doctorId FK "ref: User"
        Number height "metres"
        Number weight "kg"
        Number bmi
        Object inputs "17 ML features"
        String obesityClass "7 classes"
        Number confidenceScore "percentage"
        Array topProbabilities "top 3"
        String doctorNote
        Boolean isApproved
    }

    MEALPLAN {
        ObjectId _id PK
        ObjectId patientId FK "ref: User"
        ObjectId doctorId FK "ref: User"
        ObjectId assessmentId FK "ref: Assessment"
        String obesityClass
        Number bmi
        Number bmr
        Number activityFactor
        Number tdee
        Number calorieAdjustment
        Number dailyCalorieTarget
        Array meals "MealSnapshot[]"
        String status "Draft | Approved"
        String waterTarget
        String exerciseRecommendation
        String doctorInstructions
    }

    MEALTEMPLATE {
        ObjectId _id PK
        String name UK
        String mealType "Breakfast | Lunch | Dinner | Snack"
        Number calories
        Number protein
        Number carbohydrates
        Number fat
        Number fiber
        Array ingredients
        Array dietaryTypes "Vegetarian | Vegan | Non-Vegetarian"
        Array allergens
        Array suitableFor "7 obesity classes"
        Boolean isActive
    }

    PROGRESSRECORD {
        ObjectId _id PK
        ObjectId patientId FK "ref: User"
        Number weight
        Number bmi
        String mealAdherence
        String physicalActivity
        String note
        Date date
    }

    DOCTORNOTE {
        ObjectId _id PK
        ObjectId patientId FK "ref: User"
        ObjectId doctorId FK "ref: User"
        String note
        Date createdAt
    }

    USER ||--o| PATIENT : "has profile"
    USER ||--o| DOCTOR : "has profile"
    USER ||--o{ APPOINTMENT : "books (as patient)"
    USER ||--o{ APPOINTMENT : "assigned (as doctor)"
    USER ||--o{ ASSESSMENT : "assessed (as patient)"
    USER ||--o{ ASSESSMENT : "created by (as doctor)"
    PATIENT }o--|| USER : "assignedDoctor"
    ASSESSMENT ||--o{ MEALPLAN : "linked via assessmentId"
    USER ||--o{ MEALPLAN : "for patient"
    USER ||--o{ MEALPLAN : "by doctor"
    MEALPLAN }o--o{ MEALTEMPLATE : "meals[] snapshots reference"
    USER ||--o{ PROGRESSRECORD : "logged by patient"
    USER ||--o{ DOCTORNOTE : "about patient"
    USER ||--o{ DOCTORNOTE : "written by doctor"
```

---

## 📡 API Reference

> Full interactive API documentation is available at `/api-docs` when the backend is running (Swagger UI with OpenAPI 3.0.3).

### Authentication (Public)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Patient self-registration |
| `POST` | `/api/auth/login` | JWT authentication |
| `POST` | `/api/auth/reset-password` | Token-based password reset |

### Admin Routes (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/admin/doctors` | List / Create doctors |
| `GET/PUT/DELETE` | `/api/admin/doctors/:id` | Get / Update / Delete doctor |
| `PATCH` | `/api/admin/doctors/:id/status` | Toggle doctor active/inactive |
| `GET` | `/api/admin/patients` | List all patients |
| `GET/DELETE` | `/api/admin/patients/:id` | Get / Delete patient |
| `PATCH` | `/api/admin/patients/:id/status` | Toggle patient status |
| `PATCH` | `/api/admin/patients/:id/assign-doctor` | Assign doctor to patient |
| `GET` | `/api/admin/appointments` | List all appointments |
| `PATCH` | `/api/admin/appointments/:id/status` | Approve / Reject / Cancel |
| `PUT` | `/api/admin/appointments/:id/reschedule` | Reschedule appointment |
| `POST` | `/api/admin/reports/generate` | Generate system reports |

### Doctor Routes (Doctor only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/doctor/patients` | List assigned patients |
| `GET` | `/api/doctor/patients/:id` | Full patient details |
| `PUT` | `/api/doctor/patients/:id/health-details` | Update health details |
| `POST` | `/api/doctor/patients/:id/notes` | Add doctor note |
| `PUT` | `/api/doctor/patients/:id/notes/:noteId` | Update doctor note |
| `GET` | `/api/doctor/appointments` | Doctor's appointments |
| `PUT` | `/api/doctor/appointments/:id/complete` | Complete appointment |
| `GET` | `/api/doctor/assessments` | List assessments |
| `GET` | `/api/doctor/assessments/:id` | Get assessment details |
| `POST` | `/api/doctor/assessments/predict` | ML obesity prediction |
| `POST` | `/api/doctor/assessments/save` | Save assessment result |
| `GET` | `/api/doctor/meal-plans` | List meal plans |
| `GET` | `/api/doctor/meal-plans/:id` | Get meal plan details |
| `POST` | `/api/doctor/meal-plans` | Save draft meal plan |
| `POST` | `/api/doctor/meal-plans/generate` | Generate suggested meals |
| `POST` | `/api/doctor/meal-plans/alternatives` | Get alternative meals |
| `PUT` | `/api/doctor/meal-plans/:id` | Update draft |
| `POST` | `/api/doctor/meal-plans/:id/approve` | Approve meal plan |
| `GET` | `/api/doctor/reports/patients` | List assignable patients |
| `GET` | `/api/doctor/reports/generate` | Generate patient report |

### Patient Routes (Patient only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patient/appointments` | Patient's appointments |
| `GET` | `/api/patient/appointments/doctors` | List active doctors |
| `POST` | `/api/patient/appointments` | Request appointment |
| `PUT` | `/api/patient/appointments/:id/cancel` | Cancel appointment |
| `GET` | `/api/patient/assessments` | View assessments |
| `GET` | `/api/patient/meal-plans` | View approved meal plans |
| `GET` | `/api/patient/progress` | Get progress records |
| `POST` | `/api/patient/progress` | Log progress entry |
| `PUT` | `/api/patient/progress/:id` | Update progress entry |
| `GET` | `/api/patient/reports/generate` | Generate personal report |

### Dashboard & Documentation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/admin` | Admin dashboard metrics |
| `GET` | `/api/dashboard/doctor` | Doctor dashboard metrics |
| `GET` | `/api/dashboard/patient` | Patient dashboard metrics |
| `GET` | `/api-docs` | Swagger UI documentation |
| `GET` | `/api-docs.json` | OpenAPI 3.0.3 JSON spec |

**Total: 42+ API endpoints**

---

## 🔄 System Workflows

### 1. Authentication Sequence

> Source: `backend/controllers/authController.js`, `backend/middleware/authMiddleware.js`, `frontend/src/services/apiClient.js`, `frontend/src/components/ProtectedRoute.jsx`, `backend/models/User.js`

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant ApiClient as apiClient.js (Axios)
    participant Express as Express Server
    participant AuthMW as authMiddleware (protect)
    participant AuthCtrl as authController
    participant UserModel as User Model
    participant MongoDB as MongoDB Atlas

    Note over User, MongoDB: Registration Flow (Patient Only)
    User->>Frontend: Fill registration form (fullName, email, password, DOB, gender)
    Frontend->>ApiClient: POST /api/auth/register
    ApiClient->>Express: HTTP POST (JSON body)
    Express->>AuthCtrl: registerUser()
    AuthCtrl->>AuthCtrl: Validate email regex + password >= 8 chars
    AuthCtrl->>MongoDB: User.findOne({ email })
    MongoDB-->>AuthCtrl: null (no duplicate)
    AuthCtrl->>UserModel: User.create({ role: 'patient', password })
    UserModel->>UserModel: Pre-save hook: bcrypt.hash(password, 12)
    UserModel->>MongoDB: Insert User document
    MongoDB-->>AuthCtrl: User created
    AuthCtrl->>MongoDB: Patient.create({ userId, dob, gender })
    AuthCtrl->>AuthCtrl: jwt.sign({ userId, role }, JWT_SECRET, { expiresIn })
    AuthCtrl-->>Express: { success: true, token, user }
    Express-->>ApiClient: 201 JSON response
    ApiClient-->>Frontend: Response data
    Frontend->>Frontend: localStorage.setItem('token', token)
    Frontend->>Frontend: localStorage.setItem('user', JSON.stringify(user))
    Frontend-->>User: Redirect to /patient/dashboard

    Note over User, MongoDB: Login Flow (All Roles)
    User->>Frontend: Enter email + password
    Frontend->>ApiClient: POST /api/auth/login
    ApiClient->>Express: HTTP POST
    Express->>AuthCtrl: loginUser()
    AuthCtrl->>MongoDB: User.findOne({ email }).select('+password')
    MongoDB-->>AuthCtrl: User document (with hashed password)
    AuthCtrl->>AuthCtrl: Check user.status !== 'inactive'
    AuthCtrl->>AuthCtrl: bcrypt.compare(password, user.password)
    AuthCtrl->>AuthCtrl: jwt.sign({ userId, role }, JWT_SECRET)
    AuthCtrl-->>Express: { success: true, token, user }
    Express-->>Frontend: 200 JSON response
    Frontend->>Frontend: Store token + user in localStorage
    Frontend-->>User: Redirect to /{role}/dashboard

    Note over User, MongoDB: Protected Route Access
    User->>Frontend: Navigate to protected page
    Frontend->>Frontend: ProtectedRoute checks localStorage token + role
    Frontend->>ApiClient: API request
    ApiClient->>ApiClient: Interceptor attaches Authorization: Bearer {token}
    ApiClient->>Express: HTTP request with JWT header
    Express->>AuthMW: protect() middleware
    AuthMW->>AuthMW: Extract token from Authorization header
    AuthMW->>AuthMW: jwt.verify(token, JWT_SECRET)
    AuthMW->>MongoDB: User.findById(decoded.userId)
    MongoDB-->>AuthMW: User document
    AuthMW->>AuthMW: Check user.status === 'active'
    AuthMW->>AuthMW: authorize(allowedRoles) check
    AuthMW-->>Express: req.user = user (proceed)
```

---

### 2. Obesity Prediction Sequence

> Source: `backend/controllers/assessmentController.js`, `ml-service/app.py`, `frontend/src/pages/doctor/NewAssessment.jsx`

```mermaid
sequenceDiagram
    actor Doctor
    participant Frontend as NewAssessment.jsx
    participant ApiClient as apiClient.js
    participant Express as Express Server
    participant AssessCtrl as assessmentController
    participant FlaskML as Flask ML Service (port 5001)
    participant Pipeline as Random Forest Pipeline
    participant MongoDB as MongoDB Atlas

    Note over Doctor, MongoDB: Step 1 - Predict Obesity Class
    Doctor->>Frontend: Fill 17-feature assessment form
    Frontend->>ApiClient: POST /api/doctor/assessments/predict
    ApiClient->>Express: HTTP POST { patientId, height, weight, age, gender, ...features }
    Express->>AssessCtrl: predictObesity()
    AssessCtrl->>AssessCtrl: Calculate BMI = weight / (height_m)^2
    AssessCtrl->>AssessCtrl: Calculate Physical_Activity_Score = FAF - TUE
    AssessCtrl->>AssessCtrl: Build 17-feature payload in exact order
    AssessCtrl->>FlaskML: HTTP POST /predict { Age, Gender, Height, Weight, CALC, FAVC, FCVC, NCP, SCC, SMOKE, CH2O, family_history, FAF, TUE, CAEC, MTRANS, Physical_Activity_Score }
    FlaskML->>FlaskML: Validate all 17 features present
    FlaskML->>FlaskML: Create pandas DataFrame in exact feature order
    FlaskML->>FlaskML: Cast numeric columns
    FlaskML->>Pipeline: pipeline.predict(df)
    Pipeline-->>FlaskML: predicted_class
    FlaskML->>Pipeline: pipeline.predict_proba(df)
    Pipeline-->>FlaskML: probabilities_array
    FlaskML->>FlaskML: Sort probabilities descending, take top 3
    FlaskML->>FlaskML: confidence = max(probabilities) * 100
    FlaskML-->>AssessCtrl: { predicted_class, confidence, probabilities: [top3] }
    AssessCtrl-->>Express: { success, bmi, obesityClass, confidenceScore, topProbabilities }
    Express-->>Frontend: 200 JSON
    Frontend-->>Doctor: Display prediction result with confidence chart

    Note over Doctor, MongoDB: Step 2 - Save Assessment
    Doctor->>Frontend: Add doctor note, click Save
    Frontend->>ApiClient: POST /api/doctor/assessments/save
    ApiClient->>Express: HTTP POST { patientId, prediction data, doctorNote }
    Express->>AssessCtrl: saveAssessment()
    AssessCtrl->>AssessCtrl: Server-side re-prediction (anti-spoofing)
    AssessCtrl->>FlaskML: POST /predict (re-validate)
    FlaskML-->>AssessCtrl: Fresh prediction result
    AssessCtrl->>MongoDB: Assessment.create({ patientId, doctorId, bmi, obesityClass, inputs, confidenceScore, topProbabilities })
    MongoDB-->>AssessCtrl: Assessment saved
    AssessCtrl->>MongoDB: Patient.updateOne({ currentBmi, weight })
    AssessCtrl-->>Express: { success, assessment }
    Express-->>Frontend: 201 Created
    Frontend-->>Doctor: Redirect to assessment result page

    Note over AssessCtrl: Fallback: If ML service unavailable, uses BMI-threshold mock prediction
```

---

### 3. Appointment Workflow Sequence

> Source: `backend/controllers/patientAppointmentController.js`, `backend/controllers/adminController.js`, `backend/controllers/doctorAppointmentController.js`, `backend/models/Appointment.js`

```mermaid
sequenceDiagram
    actor Patient
    actor Admin
    actor Doctor
    participant Frontend as React Frontend
    participant Express as Express Server
    participant PatientApptCtrl as patientAppointmentController
    participant AdminCtrl as adminController
    participant DoctorApptCtrl as doctorAppointmentController
    participant MongoDB as MongoDB Atlas

    Note over Patient, MongoDB: Step 1 - Patient Requests Appointment
    Patient->>Frontend: Select doctor, date, time, reason
    Frontend->>Express: POST /api/patient/appointments
    Express->>PatientApptCtrl: requestAppointment()
    PatientApptCtrl->>PatientApptCtrl: Validate date (future, YYYY-MM-DD), time (HH:mm)
    PatientApptCtrl->>MongoDB: User.findOne({ _id: doctorId, role: 'doctor', status: 'active' })
    PatientApptCtrl->>MongoDB: Doctor.findOne({ userId: doctorId })
    PatientApptCtrl->>MongoDB: Appointment.findOne({ patientId, date, time, status: pending/approved })
    MongoDB-->>PatientApptCtrl: null (no duplicate)
    PatientApptCtrl->>MongoDB: Appointment.create({ status: 'pending' })
    PatientApptCtrl-->>Patient: 201 Appointment created

    Note over Admin, MongoDB: Step 2 - Admin Approves/Rejects
    Admin->>Frontend: Review pending appointment
    Frontend->>Express: PATCH /api/admin/appointments/:id/status { status: 'approved' }
    Express->>AdminCtrl: updateAppointmentStatus()
    AdminCtrl->>AdminCtrl: Validate state transition (pending to approved allowed)
    AdminCtrl->>MongoDB: Check doctor double-booking (same doctor, date, time, approved)
    AdminCtrl->>MongoDB: Check patient slot conflict (same patient, date, time)
    AdminCtrl->>MongoDB: Update appointment status to 'approved' and save
    AdminCtrl->>MongoDB: Auto-assign doctor to patient (if first approval)
    AdminCtrl-->>Admin: 200 Appointment approved

    Note over Admin, MongoDB: Alternative - Admin Rejects
    Admin->>Express: PATCH /api/admin/appointments/:id/status { status: 'rejected', rejectionReason }
    AdminCtrl->>AdminCtrl: Validate rejectionReason required
    AdminCtrl->>MongoDB: Update appointment status to 'rejected' with reason and save
    AdminCtrl-->>Admin: 200 Appointment rejected

    Note over Admin, MongoDB: Alternative - Admin Reschedules
    Admin->>Express: PUT /api/admin/appointments/:id/reschedule { date, time, doctorId, rescheduleNote }
    Express->>AdminCtrl: rescheduleAppointment()
    AdminCtrl->>AdminCtrl: Validate future date, doctor active, no conflicts
    AdminCtrl->>MongoDB: Update date, time, doctorId, set status to 'approved' and save
    AdminCtrl-->>Admin: 200 Rescheduled

    Note over Doctor, MongoDB: Step 3 - Doctor Completes
    Doctor->>Frontend: Add consultation note
    Frontend->>Express: PUT /api/doctor/appointments/:id/complete
    Express->>DoctorApptCtrl: completeAppointment()
    DoctorApptCtrl->>DoctorApptCtrl: Validate status is 'approved'
    DoctorApptCtrl->>DoctorApptCtrl: Validate consultationNote required (max 2000 chars)
    DoctorApptCtrl->>MongoDB: Update appointment status to 'completed' and save
    DoctorApptCtrl-->>Doctor: 200 Appointment completed

    Note over Patient, MongoDB: Alternative - Patient Cancels
    Patient->>Express: PUT /api/patient/appointments/:id/cancel { cancellationReason }
    Express->>PatientApptCtrl: cancelAppointment()
    PatientApptCtrl->>PatientApptCtrl: Validate status is pending or approved
    PatientApptCtrl->>MongoDB: Update appointment status to 'cancelled' with reason and save
    PatientApptCtrl-->>Patient: 200 Cancelled
```

---

### 4. Health Record / Progress Tracking Sequence

> Source: `backend/controllers/patientProgressController.js`, `backend/controllers/doctorPatientController.js`, `backend/models/ProgressRecord.js`, `backend/models/Patient.js`

```mermaid
sequenceDiagram
    actor Patient
    actor Doctor
    participant Frontend as React Frontend
    participant Express as Express Server
    participant ProgressCtrl as patientProgressController
    participant DoctorPatCtrl as doctorPatientController
    participant PatientModel as Patient Model
    participant MongoDB as MongoDB Atlas

    Note over Patient, MongoDB: Patient Logs Progress
    Patient->>Frontend: Enter weight, date, meal adherence, physical activity
    Frontend->>Express: POST /api/patient/progress
    Express->>ProgressCtrl: addProgressRecord()
    ProgressCtrl->>ProgressCtrl: Validate weight (20-400 kg), date (not future)
    ProgressCtrl->>MongoDB: Patient.findOne({ userId: patientId })
    MongoDB-->>ProgressCtrl: Patient profile (with height)
    ProgressCtrl->>ProgressCtrl: Calculate BMI = weight / (height_cm / 100)^2
    ProgressCtrl->>MongoDB: ProgressRecord.findOne({ patientId, date })
    MongoDB-->>ProgressCtrl: null or existing (409 if duplicate)
    ProgressCtrl->>MongoDB: ProgressRecord.create({ patientId, weight, bmi, mealAdherence, physicalActivity })
    ProgressCtrl->>MongoDB: Check if this is latest record
    ProgressCtrl->>MongoDB: Update patient current weight and currentBmi if latest
    ProgressCtrl-->>Patient: 201 Progress recorded

    Note over Patient, MongoDB: Patient Views Progress History
    Patient->>Frontend: Navigate to Progress page
    Frontend->>Express: GET /api/patient/progress
    Express->>ProgressCtrl: getMyProgress()
    ProgressCtrl->>MongoDB: ProgressRecord.find({ patientId }).sort({ date: -1 })
    ProgressCtrl->>MongoDB: MealPlan.findOne({ patientId, status: 'Approved' })
    ProgressCtrl-->>Patient: { records, hasApprovedMealPlan, patientHeight }

    Note over Doctor, MongoDB: Doctor Updates Patient Health Details
    Doctor->>Frontend: Edit health details form (17 fields)
    Frontend->>Express: PUT /api/doctor/patients/:id/health-details
    Express->>DoctorPatCtrl: updateHealthDetails()
    DoctorPatCtrl->>DoctorPatCtrl: Verify doctor is assigned or has appointment
    DoctorPatCtrl->>DoctorPatCtrl: validateAndSanitizeHealthDetails (allowlist, enum, range validation)
    DoctorPatCtrl->>MongoDB: Save sanitized healthDetails to patient document
    DoctorPatCtrl-->>Doctor: 200 Health details updated

    Note over Doctor, MongoDB: Doctor Adds Clinical Note
    Doctor->>Frontend: Write note (max 5000 chars)
    Frontend->>Express: POST /api/doctor/patients/:id/notes
    Express->>DoctorPatCtrl: addPatientNote()
    DoctorPatCtrl->>DoctorPatCtrl: Verify authorization (assigned or has appointment)
    DoctorPatCtrl->>MongoDB: DoctorNote.create({ patientId, doctorId, note })
    DoctorPatCtrl-->>Doctor: 201 Note added
```

---

### 5. Meal Plan Generation Sequence

> Source: `backend/controllers/mealPlanController.js`, `backend/models/MealPlan.js`, `backend/models/MealTemplate.js`, `frontend/src/pages/doctor/MealPlanGenerator.jsx`

```mermaid
sequenceDiagram
    actor Doctor
    participant Frontend as MealPlanGenerator.jsx
    participant Express as Express Server
    participant MealCtrl as mealPlanController
    participant MongoDB as MongoDB Atlas

    Note over Doctor, MongoDB: Step 1 - Generate Suggested Meal Plan
    Doctor->>Frontend: Select patient and assessment, click Generate
    Frontend->>Express: POST /api/doctor/meal-plans/generate { assessmentId }
    Express->>MealCtrl: generateSuggestedPayload()
    MealCtrl->>MongoDB: Assessment.findById(assessmentId)
    MealCtrl->>MongoDB: Patient.findOne({ userId: patientId })
    MealCtrl->>MealCtrl: Extract age from patient DOB
    MealCtrl->>MealCtrl: BMR = Mifflin-St Jeor (10*weight + 6.25*height_cm - 5*age +/- gender offset)
    MealCtrl->>MealCtrl: Activity Factor from FAF (0: 1.20, 1: 1.375, 2: 1.55, 3: 1.725)
    MealCtrl->>MealCtrl: TDEE = BMR * Activity Factor
    MealCtrl->>MealCtrl: Calorie Adjustment by obesity class (-500 to +300)
    MealCtrl->>MealCtrl: Safety floor: if target < 1000, clamp to 1200
    MealCtrl->>MealCtrl: Allocate: Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%
    MealCtrl->>MongoDB: MealTemplate.find({ isActive: true, suitableFor: obesityClass, dietaryTypes match })
    MongoDB-->>MealCtrl: Filtered templates
    MealCtrl->>MealCtrl: Exclude allergen conflicts (template.allergens vs patient.foodAllergies)
    MealCtrl->>MealCtrl: Exclude dislike conflicts (template.ingredients vs patient.dislikedFoods)
    MealCtrl->>MealCtrl: For each meal type: select template closest to calorie allocation
    MealCtrl->>MealCtrl: Sum total meal calories, protein, carbs, fat, fiber
    MealCtrl-->>Express: { bmr, tdee, dailyCalorieTarget, meals[], alternatives, totals }
    Express-->>Frontend: 200 Suggested payload
    Frontend-->>Doctor: Display meal plan with swap options

    Note over Doctor, MongoDB: Step 2 - Doctor Swaps Meals (Optional)
    Doctor->>Frontend: Click swap on a meal slot
    Frontend->>Express: POST /api/doctor/meal-plans/alternatives { mealType, obesityClass, dietaryPreference, allergies, dislikes }
    Express->>MealCtrl: getAlternativeMeals()
    MealCtrl->>MongoDB: MealTemplate.find(filtered query)
    MealCtrl-->>Frontend: Alternative meal options
    Doctor->>Frontend: Select replacement meal

    Note over Doctor, MongoDB: Step 3 - Save as Draft
    Doctor->>Frontend: Add water target, exercise recommendation, instructions
    Frontend->>Express: POST /api/doctor/meal-plans { full plan payload }
    Express->>MealCtrl: saveDraft()
    MealCtrl->>MongoDB: MealPlan.create({ status: 'Draft', meals, bmr, tdee, ... })
    MealCtrl-->>Doctor: 201 Draft saved

    Note over Doctor, MongoDB: Step 4 - Approve Meal Plan
    Doctor->>Frontend: Click Approve
    Frontend->>Express: POST /api/doctor/meal-plans/:id/approve
    Express->>MealCtrl: approveMealPlan()
    MealCtrl->>MongoDB: MealPlan.findById(id)
    MealCtrl->>MealCtrl: Validate status is 'Draft' and doctorId matches
    MealCtrl->>MongoDB: Set status to 'Approved' and save approvedAt timestamp
    MealCtrl-->>Doctor: 200 Meal plan approved (now visible to patient)
```

---

## 🤖 Machine Learning Module

### Model Specification
| Attribute | Value |
|---|---|
| **Algorithm** | Random Forest (sklearn Pipeline) |
| **Model File** | `final_obesity_random_forest_pipeline.joblib` (19.5 MB) |
| **Framework** | scikit-learn 1.6.1 |
| **Deployment** | Flask microservice (port 5001) |
| **Classification** | 7-class multi-class |

### Obesity Classes
| Class | Description |
|---|---|
| `Insufficient_Weight` | Underweight |
| `Normal_Weight` | Normal BMI range |
| `Overweight_Level_I` | Mild overweight |
| `Overweight_Level_II` | Moderate overweight |
| `Obesity_Type_I` | Obesity class I |
| `Obesity_Type_II` | Obesity class II |
| `Obesity_Type_III` | Obesity class III (severe) |

### 17 Input Features
| # | Feature | Description | Type |
|---|---|---|---|
| 1 | Age | Patient age | Numeric |
| 2 | Gender | Male / Female | Categorical |
| 3 | Height | Height in metres | Numeric |
| 4 | Weight | Weight in kilograms | Numeric |
| 5 | CALC | Alcohol consumption frequency | Categorical |
| 6 | FAVC | High-calorie food consumption | Binary |
| 7 | FCVC | Vegetable consumption frequency (1–3) | Numeric |
| 8 | NCP | Main meals per day (1–4) | Numeric |
| 9 | SCC | Calorie monitoring | Binary |
| 10 | SMOKE | Smoking status | Binary |
| 11 | CH2O | Daily water intake (1–3 litres) | Numeric |
| 12 | family_history_with_overweight | Family history of overweight | Binary |
| 13 | FAF | Physical activity frequency (0–3 days) | Numeric |
| 14 | TUE | Technology usage time (0–24 hours) | Numeric |
| 15 | CAEC | Food between meals frequency | Categorical |
| 16 | MTRANS | Primary transportation method | Categorical |
| 17 | Physical_Activity_Score | Derived: FAF – TUE | Computed |

### Prediction Pipeline
```
Doctor Form → Backend Validation → Feature Engineering (Physical_Activity_Score)
  → HTTP POST to Flask /predict → sklearn Pipeline.predict() + predict_proba()
  → Returns: predicted_class + confidence% + top 3 probabilities
  → Stored in Assessment collection
```

The backend includes a **fallback mock predictor** for when the ML service is unavailable, using BMI-threshold-based classification.

---

## 🧮 Health Calculation Engine

### Body Mass Index (BMI)
```
BMI = weight(kg) / height(m)²
```

### Basal Metabolic Rate (Mifflin-St Jeor Equation)
```
Male:   BMR = (10 × weight) + (6.25 × height_cm) − (5 × age) + 5
Female: BMR = (10 × weight) + (6.25 × height_cm) − (5 × age) − 161
```

### Total Daily Energy Expenditure (TDEE)
```
TDEE = BMR × Activity Factor
```

| Physical Activity (FAF) | Activity Factor | Level |
|---|---|---|
| 0 days/week | 1.20 | Sedentary |
| 1 day/week | 1.375 | Lightly Active |
| 2 days/week | 1.55 | Moderately Active |
| 3 days/week | 1.725 | Very Active |

### Calorie Adjustment by Obesity Classification
| Classification | Daily Calorie Adjustment |
|---|---|
| Insufficient Weight | TDEE + 300 kcal (surplus) |
| Normal Weight | TDEE (maintenance) |
| Overweight Level I | TDEE − 300 kcal (deficit) |
| Overweight Level II | TDEE − 400 kcal (deficit) |
| Obesity Type I–III | TDEE − 500 kcal (deficit) |

> Safety floor: if calculated target drops below 1000 kcal, it is clamped to 1200 kcal.

---

## 🍽 Meal Plan Generation System

The meal plan engine is a **database-driven, rule-based recommendation system** (not ML-driven):

1. **Calculate** BMR → TDEE → adjusted daily calorie target based on obesity class
2. **Allocate** calories per meal type: Breakfast (25%), Lunch (35%), Dinner (30%), Snack (10%)
3. **Query** `MealTemplate` collection with filters:
   - `isActive: true`
   - `suitableFor` includes patient's obesity class
   - `dietaryTypes` matches preference (Vegan / Vegetarian / No Special Preference)
4. **Exclude** meals containing patient's allergens or disliked food ingredients
5. **Select** closest calorie match per meal slot
6. **Allow** doctor to swap individual meals from filtered alternatives
7. **Save** as Draft → Doctor reviews → **Approve** to make visible to patient

---

## 🧩 Software Components

### Component Diagram

> Source: `backend/index.js`, `backend/middleware/authMiddleware.js`, all route files, all controller files, `frontend/src/router/AppRouter.jsx`, `frontend/src/layouts/`, `ml-service/app.py`

```mermaid
flowchart TB
    subgraph FrontendLayer["Frontend Layer (React 19 + Vite 8)"]
        subgraph Pages["Page Components (24)"]
            AdminPages["Admin Pages (5): Dashboard, Doctors, Patients, Appointments, Reports"]
            DoctorPages["Doctor Pages (10): Dashboard, Patients, PatientDetail, Appointments, Assessments, NewAssessment, AssessmentResult, MealPlanList, MealPlanGenerator, Reports"]
            PatientPages["Patient Pages (6): Dashboard, Appointments, Assessments, MealPlans, Progress, Reports"]
            AuthPages["Auth Pages (3): Login, Register, ResetPassword"]
        end
        subgraph FEComponents["Shared Components"]
            ProtectedRoute["ProtectedRoute (Role Guard)"]
            DashboardLayout["DashboardLayout (Sidebar + Header)"]
            AuthLayout["AuthLayout"]
            Modals["Admin Modals (8): Approve, Reject, Cancel, Reschedule, View, Doctor, Patient modals"]
            DashboardWidgets["Dashboard Widgets: SummaryCard, ChartPanel, EmptyState, LoadingDashboard, DashboardError"]
        end
        subgraph FEServices["Frontend Services"]
            ApiClient["apiClient.js (Axios + JWT Interceptor)"]
            PdfExport["pdfExport.js (html2pdf.js + oklch converter)"]
        end
        Router["AppRouter.jsx (React Router DOM v7)"]
    end

    subgraph BackendLayer["Backend Layer (Express 5 + Node.js 20)"]
        subgraph Middleware["Middleware"]
            CORS["cors()"]
            JSONParser["express.json()"]
            AuthMW["authMiddleware: protect() + authorize()"]
        end
        subgraph Routes["Route Layer (13 route files)"]
            AuthRoutes["authRoutes: /api/auth"]
            AdminRoutes["adminRoutes: /api/admin"]
            DashboardRoutes["dashboardRoutes: /api/dashboard"]
            DoctorPatientRoutes["doctorPatientRoutes: /api/doctor/patients"]
            DoctorApptRoutes["doctorAppointmentRoutes: /api/doctor/appointments"]
            AssessmentRoutes["assessmentRoutes: /api/doctor/assessments"]
            MealPlanRoutes["mealPlanRoutes: /api/doctor/meal-plans"]
            ReportRoutes["reportRoutes: /api/doctor/reports"]
            PatientApptRoutes["patientAppointmentRoutes: /api/patient/appointments"]
            PatientAssessRoutes["patientAssessmentRoutes: /api/patient/assessments"]
            PatientMealRoutes["patientMealPlanRoutes: /api/patient/meal-plans"]
            PatientProgressRoutes["patientProgressRoutes: /api/patient/progress"]
            PatientReportRoutes["patientReportRoutes: /api/patient/reports"]
        end
        subgraph ControllerLayer["Controller Layer (13 files)"]
            Controllers["authController, adminController, dashboardController, assessmentController, mealPlanController, doctorPatientController, doctorAppointmentController, patientAppointmentController, patientProgressController, reportController, patientReportController, patientAssessmentController, patientMealPlanController"]
        end
        subgraph ServiceLayer["Service Layer"]
            EmailSvc["emailService.js (Nodemailer)"]
        end
        subgraph ModelLayer["Data Model Layer (9 Mongoose Schemas)"]
            ModelsAll["User, Patient, Doctor, Appointment, Assessment, MealPlan, MealTemplate, ProgressRecord, DoctorNote"]
        end
        SwaggerDocs["swagger.js (OpenAPI 3.0.3 Spec)"]
    end

    subgraph MLLayer["ML Service Layer (Flask + Python 3.11)"]
        FlaskApp["Flask App (app.py)"]
        HealthEndpoint["/health (GET)"]
        PredictEndpoint["/predict (POST)"]
        RFModel["Random Forest Pipeline (joblib)"]
    end

    subgraph DataLayer["Data Layer"]
        MongoDB["MongoDB Atlas (Cloud)"]
        SMTP["SMTP Server"]
    end

    Router --> Pages
    Pages --> FEComponents
    FEComponents --> ApiClient
    ApiClient -- "HTTP/JWT" --> Middleware
    Middleware --> Routes
    Routes --> ControllerLayer
    ControllerLayer --> ModelLayer
    ControllerLayer --> ServiceLayer
    ModelLayer -- "Mongoose ODM" --> MongoDB
    ServiceLayer -- "SMTP" --> SMTP
    ControllerLayer -- "HTTP POST" --> PredictEndpoint
    PredictEndpoint --> RFModel
```

---

## 📊 Data Flow

### Data Flow Diagram

> Source: All controllers, `apiClient.js`, `app.py`, `authMiddleware.js`

```mermaid
flowchart LR
    subgraph UserInput["User Input"]
        Browser["User Browser"]
    end

    subgraph FE["React Frontend"]
        UI["UI Components (Pages + Layouts)"]
        StateLogic["useState / useEffect"]
        AxiosClient["apiClient.js"]
    end

    subgraph BE["Express Backend"]
        AuthLayer["JWT Auth + RBAC Middleware"]
        BusinessLogic["Controllers (Business Logic)"]
        DataAccess["Mongoose Models"]
        CalcEngine["Calculation Engine (BMI/BMR/TDEE)"]
        EmailDispatch["Email Service"]
    end

    subgraph ML["ML Microservice"]
        MLPredict["Flask /predict"]
        RFPipe["Random Forest Pipeline"]
    end

    subgraph DB["Persistence"]
        MongoAtlas["MongoDB Atlas"]
    end

    subgraph ExtSvc["External"]
        SMTPSrv["SMTP Server"]
    end

    Browser -- "User Actions" --> UI
    UI --> StateLogic
    StateLogic --> AxiosClient
    AxiosClient -- "HTTP + Bearer JWT" --> AuthLayer
    AuthLayer -- "Authenticated Request" --> BusinessLogic
    BusinessLogic --> DataAccess
    BusinessLogic --> CalcEngine
    BusinessLogic -- "Assessment Data" --> MLPredict
    MLPredict --> RFPipe
    RFPipe -- "Prediction Result" --> MLPredict
    MLPredict -- "predicted_class + confidence" --> BusinessLogic
    CalcEngine -- "BMR/TDEE/Calories" --> BusinessLogic
    DataAccess -- "CRUD Operations" --> MongoAtlas
    MongoAtlas -- "Query Results" --> DataAccess
    DataAccess --> BusinessLogic
    BusinessLogic -- "JSON Response" --> AuthLayer
    AuthLayer --> AxiosClient
    AxiosClient --> StateLogic
    StateLogic --> UI
    UI -- "Rendered View" --> Browser
    BusinessLogic -- "Welcome Email" --> EmailDispatch
    EmailDispatch --> SMTPSrv
    UI -- "html2pdf.js" --> Browser
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **Python** ≥ 3.11
- **MongoDB Atlas** account (or local MongoDB)
- **Docker** + **Docker Compose** (for containerized deployment)

### Local Development Setup

**1. Clone the repository**
```bash
git clone https://github.com/<your-username>/obesity-management.git
cd obesity-management
```

**2. Configure environment variables**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

**3. Install all dependencies**
```bash
npm run install-all
```
This installs root, backend, frontend, and ML service dependencies concurrently.

**4. Seed the meal template database**
```bash
cd backend
node scripts/seedMealTemplates.js
```

**5. Start all services in development mode**
```bash
# From root directory
npm run dev
```
This runs the backend (port 5000), frontend (port 5173), and ML service (port 5001) concurrently.

**6. Access the application**
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Swagger Docs | http://localhost:5000/api-docs |
| ML Service Health | http://localhost:5001/health |

---

## ⚙ Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Backend server port |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | **Yes** | – | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | – | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `ML_SERVICE_URL` | No | `http://localhost:5001` | ML microservice URL |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL (for email links) |
| `SMTP_HOST` | No | – | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | – | SMTP username |
| `SMTP_PASS` | No | – | SMTP password |
| `EMAIL_FROM` | No | `noreply@obesitycare.hospital.lk` | Sender email address |

### Frontend (`frontend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Backend API base URL |

### ML Service
| Variable | Required | Default | Description |
|---|---|---|---|
| `ML_PORT` | No | `5001` | Flask server port |

---

## 🐳 Deployment

### Deployment Diagram

> Source: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `ml-service/Dockerfile`, `frontend/nginx.conf`

```mermaid
flowchart TB
    subgraph DockerHost["Docker Host (docker-compose.yml)"]
        subgraph MLContainer["obesity-ml-service (python:3.11-slim)"]
            FlaskServer["Flask Server :5001"]
            MLModel["Random Forest Pipeline (joblib)"]
            MLHealth["HEALTHCHECK: /health every 30s"]
        end

        subgraph BackendContainer["obesity-backend (node:20-alpine)"]
            ExpressApp["Express 5 Server :5000"]
            NodeEnv["NODE_ENV=production"]
            BackendHealth["HEALTHCHECK: fetch localhost:5000 every 30s"]
        end

        subgraph FrontendContainer["obesity-frontend (nginx:1.27-alpine)"]
            NginxServer["Nginx :80"]
            ViteBuild["Vite Production Bundle (dist/)"]
            NginxConf["nginx.conf (SPA routing)"]
            FrontendHealth["HEALTHCHECK: wget localhost:80 every 30s"]
        end
    end

    subgraph CloudDB["Cloud Services"]
        MongoAtlas["MongoDB Atlas"]
    end

    subgraph ClientDevice["Client"]
        Browser["User Browser :3000/5173"]
    end

    Browser -- "HTTP :3000" --> NginxServer
    NginxServer -- "Serves SPA static files" --> ViteBuild
    Browser -- "API calls via SPA" --> ExpressApp
    ExpressApp -- "Mongoose" --> MongoAtlas
    ExpressApp -- "HTTP POST /predict" --> FlaskServer
    FlaskServer --> MLModel
    BackendContainer -- "depends_on" --> MLContainer
    FrontendContainer -- "depends_on" --> BackendContainer

    style MLContainer fill:#e8f5e9
    style BackendContainer fill:#e3f2fd
    style FrontendContainer fill:#fff3e0
```

### Docker Compose (Recommended)

```bash
# Build and start all 3 services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

| Container | Port Mapping | Base Image |
|---|---|---|
| `obesity-ml-service` | 5001:5001 | python:3.11-slim |
| `obesity-backend` | 5000:5000 | node:20-alpine |
| `obesity-frontend` | 3000:80 | nginx:1.27-alpine |

**Dependency chain**: `frontend` → `backend` → `ml-service`

All containers include health checks with 30s intervals.

### Production Frontend
The frontend Dockerfile uses a **multi-stage build**:
1. **Builder stage** — Node.js 20 installs dependencies and builds the Vite production bundle
2. **Runner stage** — Nginx 1.27-alpine serves the compiled SPA with custom routing configuration

---

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions CI pipeline (`.github/workflows/ci.yml`) with 5 parallel verification stages:

| Stage | Actions |
|---|---|
| **Frontend CI** | Oxlint linting → Vite production build → Artifact upload |
| **Backend CI** | JavaScript syntax validation (all files) → Swagger OpenAPI spec verification (40+ paths) |
| **ML Service CI** | Python compilation → Model deserialization and integrity check |
| **Docker Validation** | Docker Compose configuration syntax validation |
| **Quality Gate** | All 4 stages must pass before merge |

Triggers: push to `main`/`master`, pull requests, manual dispatch. Concurrent runs on the same branch/PR cancel older runs.

---

## 📁 Project Structure

### Project Structure Diagram

```
obesity-management/
├── .github/
│   └── workflows/
│       └── ci.yml                           # GitHub Actions CI pipeline (5 stages)
├── .gitignore
├── .env.example                             # Root environment template
├── docker-compose.yml                       # 3-service Docker orchestration
├── package.json                             # Root monorepo scripts (concurrently)
│
├── backend/                                 # Node.js / Express 5 REST API
│   ├── index.js                             # Server entry point + middleware + route mounting
│   ├── package.json                         # Backend dependencies
│   ├── Dockerfile                           # node:20-alpine production image
│   ├── .env.example                         # Backend environment template
│   ├── config/
│   │   └── dbConnection.js                  # Mongoose MongoDB Atlas connection
│   ├── middleware/
│   │   └── authMiddleware.js                # JWT protect() + authorize(roles) middleware
│   ├── models/                              # 9 Mongoose schemas
│   │   ├── User.js                          # Auth identity (bcrypt pre-save hook)
│   │   ├── Patient.js                       # Patient profile + 17 healthDetails sub-fields
│   │   ├── Doctor.js                        # Doctor profile (specialisation, qualification)
│   │   ├── Appointment.js                   # 5-status lifecycle (pending→approved→completed)
│   │   ├── Assessment.js                    # ML prediction storage (7 obesity classes)
│   │   ├── MealPlan.js                      # Personalized nutrition plan (Draft→Approved)
│   │   ├── MealTemplate.js                  # Meal database (dietary types, allergens, suitableFor)
│   │   ├── ProgressRecord.js                # Patient weight/BMI tracking
│   │   └── DoctorNote.js                    # Clinical notes
│   ├── controllers/                         # 13 controller files (business logic)
│   │   ├── authController.js                # Register, login, resetPassword
│   │   ├── adminController.js               # Doctor/Patient/Appointment/Report management (1192 lines)
│   │   ├── dashboardController.js           # Admin/Doctor/Patient dashboard metrics
│   │   ├── assessmentController.js          # ML prediction + save (with anti-spoofing re-prediction)
│   │   ├── mealPlanController.js            # BMR/TDEE calculation + meal generation engine
│   │   ├── doctorPatientController.js       # Patient details, health details, doctor notes
│   │   ├── doctorAppointmentController.js   # Appointment completion with consultation notes
│   │   ├── patientAppointmentController.js  # Request, cancel, list doctors
│   │   ├── patientProgressController.js     # Log/update weight with auto BMI calculation
│   │   ├── reportController.js              # Doctor-scoped patient reports (4 types)
│   │   ├── patientReportController.js       # Patient self-service reports (4 types)
│   │   ├── patientAssessmentController.js   # View own assessments
│   │   └── patientMealPlanController.js     # View approved meal plans + alternatives
│   ├── routes/                              # 13 route files (Express Router)
│   ├── services/
│   │   └── emailService.js                  # Nodemailer doctor welcome email (HTML template)
│   ├── scripts/
│   │   ├── seedMealTemplates.js             # Meal template database seeder
│   │   ├── verifyMath.js                    # Math verification utility
│   │   ├── testSchema.js                    # Schema validation utility
│   │   └── dryRunRecovery.js                # Recovery dry-run utility
│   └── docs/
│       └── swagger.js                       # OpenAPI 3.0.3 specification (106 KB)
│
├── frontend/                                # React 19 SPA (Vite 8)
│   ├── index.html                           # HTML entry point
│   ├── package.json                         # Frontend dependencies
│   ├── Dockerfile                           # Multi-stage: Vite build → Nginx 1.27
│   ├── nginx.conf                           # SPA routing configuration
│   ├── vite.config.js                       # Vite + React + TailwindCSS v4 plugins
│   └── src/
│       ├── main.jsx                         # React 19 createRoot entry
│       ├── App.jsx                          # Root component → AppRouter
│       ├── index.css                        # Global styles (TailwindCSS v4)
│       ├── router/
│       │   └── AppRouter.jsx                # 24 route definitions + RootRedirect
│       ├── services/
│       │   └── apiClient.js                 # Axios instance + JWT interceptor + 401/403 handler
│       ├── utils/
│       │   └── pdfExport.js                 # html2pdf.js with oklch/oklab color conversion (363 lines)
│       ├── components/
│       │   ├── ProtectedRoute.jsx           # Role-based route guard
│       │   ├── admin/                       # 8 modal components (Approve, Reject, Cancel, Reschedule, View, Doctor, Patient modals)
│       │   └── dashboard/                   # 7 shared widgets (SummaryCard, ChartPanel, EmptyState, etc.)
│       ├── layouts/
│       │   ├── AuthLayout.jsx               # Login/Register layout
│       │   └── DashboardLayout.jsx          # Sidebar + Header layout
│       └── pages/
│           ├── LoginPage.jsx                # JWT login form
│           ├── RegisterPage.jsx             # Patient registration form
│           ├── ResetPasswordPage.jsx        # Token-based password reset
│           ├── admin/                       # 5 admin pages
│           ├── doctor/                      # 10 doctor pages
│           └── patient/                     # 6 patient pages
│
├── ml-service/                              # Python Flask ML microservice
│   ├── app.py                               # Flask server: /health + /predict endpoints
│   ├── requirements.txt                     # Python dependencies (6 packages)
│   ├── Dockerfile                           # python:3.11-slim production image
│   └── models/
│       └── final_obesity_random_forest_pipeline.joblib  # Pre-trained RF model (19.5 MB)
│
└── database-recovery/                       # Recovery directory (empty)
```

---

## 🔀 Feature Workflow

### Feature Workflow Diagram

> Source: `frontend/src/router/AppRouter.jsx`, all controllers

```mermaid
flowchart TD
    Start["User Opens App"] --> RootRedirect{"Authenticated?"}
    RootRedirect -- "No" --> LoginPage["Login / Register / Reset Password"]
    RootRedirect -- "Yes" --> RoleCheck{"User Role?"}

    LoginPage -- "POST /api/auth/login" --> AuthController["authController.loginUser()"]
    AuthController -- "JWT Token" --> RoleCheck

    RoleCheck -- "admin" --> AdminDashboard["Admin Dashboard"]
    RoleCheck -- "doctor" --> DoctorDashboard["Doctor Dashboard"]
    RoleCheck -- "patient" --> PatientDashboard["Patient Dashboard"]

    subgraph AdminFlow["Admin Workflows"]
        AdminDashboard --> ManageDoctors["Doctor Management (CRUD)"]
        AdminDashboard --> ManagePatients["Patient Management"]
        AdminDashboard --> ManageAppointments["Appointment Management"]
        AdminDashboard --> AdminReports["System Reports"]
        ManageDoctors -- "createDoctor()" --> EmailService["Send Welcome Email (Nodemailer)"]
        ManagePatients --> AssignDoctor["Assign Doctor to Patient"]
        ManageAppointments --> ApproveReject["Approve / Reject / Reschedule"]
    end

    subgraph DoctorFlow["Doctor Workflows"]
        DoctorDashboard --> ViewPatients["Patient List"]
        ViewPatients --> PatientDetail["Patient Detail View"]
        PatientDetail --> HealthDetailsUpdate["Update Health Details"]
        PatientDetail --> DoctorNotes["Add / Edit Doctor Notes"]
        DoctorDashboard --> NewAssessment["New Obesity Assessment"]
        NewAssessment -- "POST /predict" --> MLService["Flask ML Service"]
        MLService -- "Random Forest Pipeline" --> PredictionResult["Prediction Result (7-class + confidence)"]
        PredictionResult --> SaveAssessment["Save Assessment"]
        SaveAssessment --> GenerateMealPlan["Generate Meal Plan"]
        GenerateMealPlan -- "BMR → TDEE → Calorie Target" --> CalcEngine["Calculation Engine"]
        CalcEngine -- "Query MealTemplate" --> MealSelection["Filter + Select Meals"]
        MealSelection --> DraftMealPlan["Save Draft"]
        DraftMealPlan --> ApproveMealPlan["Approve Meal Plan"]
        DoctorDashboard --> DoctorAppointments["View Appointments"]
        DoctorAppointments --> CompleteAppt["Complete with Consultation Note"]
        DoctorDashboard --> DoctorReports["Generate Patient Reports"]
        DoctorReports --> PDFExport_D["Export as PDF"]
    end

    subgraph PatientFlow["Patient Workflows"]
        PatientDashboard --> RequestAppt["Request Appointment"]
        RequestAppt -- "POST /api/patient/appointments" --> PendingAppt["Pending → Admin Review"]
        PatientDashboard --> ViewAssessments["View Assessments"]
        PatientDashboard --> ViewMealPlans["View Approved Meal Plans"]
        ViewMealPlans --> AlternativeMeals["Browse Alternative Meals"]
        PatientDashboard --> LogProgress["Log Weight / Progress"]
        LogProgress -- "Auto-calculate BMI" --> ProgressHistory["Progress History + Charts"]
        PatientDashboard --> PatientReports["Generate Personal Reports"]
        PatientReports --> PDFExport_P["Export as PDF"]
    end

    subgraph DataStore["Data Persistence"]
        MongoDB["MongoDB Atlas"]
    end

    SaveAssessment --> MongoDB
    DraftMealPlan --> MongoDB
    ApproveMealPlan --> MongoDB
    LogProgress --> MongoDB
    CompleteAppt --> MongoDB
    ManageDoctors --> MongoDB
    ManagePatients --> MongoDB
    ApproveReject --> MongoDB
```

---

## 📊 Key Metrics

| Metric | Count |
|---|---|
| API Endpoints | 42+ |
| Database Models | 9 |
| Frontend Pages | 24 |
| Frontend Components | 15+ |
| ML Input Features | 17 |
| Obesity Classes | 7 |
| User Roles | 3 |
| Docker Containers | 3 |
| CI Pipeline Stages | 5 |
| Report Types | 9 (across all roles) |

---

## ✅ Diagram Verification

| Diagram | Required | Generated | Source Evidence | Status |
|---|---|---|---|---|
| System Architecture | Yes | ✅ Yes | `docker-compose.yml`, `index.js`, `app.py`, `apiClient.js`, `AppRouter.jsx` | ✅ Verified |
| ER Diagram | Yes | ✅ Yes | All 9 model files in `backend/models/` | ✅ Verified |
| Use Case Diagram | Yes | ✅ Yes | All route files, all controllers, `AppRouter.jsx`, `authMiddleware.js` | ✅ Verified |
| Authentication Sequence | Yes (JWT implemented) | ✅ Yes | `authController.js`, `authMiddleware.js`, `apiClient.js`, `ProtectedRoute.jsx`, `User.js` | ✅ Verified |
| ML Prediction Sequence | Yes (ML implemented) | ✅ Yes | `assessmentController.js`, `app.py`, `NewAssessment.jsx` | ✅ Verified |
| Appointment Sequence | Yes (implemented) | ✅ Yes | `patientAppointmentController.js`, `adminController.js`, `doctorAppointmentController.js`, `Appointment.js` | ✅ Verified |
| Health Record Sequence | Yes (implemented) | ✅ Yes | `patientProgressController.js`, `doctorPatientController.js`, `ProgressRecord.js`, `Patient.js` | ✅ Verified |
| Meal Recommendation Sequence | Yes (implemented) | ✅ Yes | `mealPlanController.js`, `MealPlan.js`, `MealTemplate.js`, `MealPlanGenerator.jsx` | ✅ Verified |
| Component Diagram | Yes | ✅ Yes | `index.js`, `authMiddleware.js`, all routes, all controllers, `AppRouter.jsx`, layouts, `app.py` | ✅ Verified |
| Data Flow Diagram | Yes | ✅ Yes | All controllers, `apiClient.js`, `app.py`, `authMiddleware.js` | ✅ Verified |
| Deployment Diagram | Yes (Docker verified) | ✅ Yes | `docker-compose.yml`, 3 Dockerfiles, `nginx.conf` | ✅ Verified |
| Project Structure | Yes | ✅ Yes | Full repository tree inspection | ✅ Verified |
| Feature Workflow | Yes | ✅ Yes | `AppRouter.jsx`, all controllers, all page components | ✅ Verified |

> **All 13 diagrams generated. All verified against source code. No invented components, relationships, or flows.**

---

<p align="center">
  <strong>Built with ❤️ as a Software Engineering Final-Year Project</strong>
</p>
