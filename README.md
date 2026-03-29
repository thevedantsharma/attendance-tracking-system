# 🎓 Attendance Tracking System

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.3-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

A modern, role-based attendance management solution designed for educational institutions to streamline the tracking process for Admins, Teachers, and Students. Featuring a futuristic glassmorphism UI/UX, multi-factor attendance verification (QR & Face detection), and real-time analytics.

---

## 🚀 Overview

The **Attendance Tracking System** is a full-stack SaaS-style application built to replace traditional manual attendance marking. It provides a secure, scalable, and intuitive platform where:
- **Admins** maintain total oversight of the institution's data.
- **Teachers** manage their subjects and record attendance with ease.
- **Students** track their personal progress and attendance history in real-time.

---

## ✨ Features

### ✅ Implemented Features
- **🔑 Secure Authentication**: Role-based access control (RBAC) for Admin, Teacher, and Student roles using JWT and Bcrypt.
- **📊 Comprehensive Dashboards**: Personalized views for each role with at-a-glance statistics.
- **🛠️ Management Modules**:
  - Full CRUD for Students, Teachers, and Subjects (Admin only).
  - Subject assignment and class scheduling (Admin/Teacher).
- **📷 Smart Attendance**:
  - **QR Code Scanning**: Rapid attendance marking via unique session-based QR codes.
  - **Face Detection**: AI-powered face recognition for secure identity verification (using `face-api.js`).
- **👤 Profile Management**: User profiles with customizable details and profile picture uploads.
- **📱 Responsive Design**: A high-performance, mobile-first UI with dark/light mode support and smooth animations.

### 🗺️ Upcoming / Planned Features
- **📈 Advanced Analytics**: Interactive charts and trend analysis using Recharts.
- **📅 Task/Assignment System**: Teachers can post and track student tasks.
- **🔔 Notification System**: Automated alerts for low attendance or upcoming schedules.
- **📄 Export Reports**: Generate and download attendance records in PDF and Excel formats.
- **📍 Geolocation Guard**: Verify attendance only when students are within the designated campus area.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism)
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Security**: JWT (JSON Web Tokens), Bcryptjs, Helmet, Express-Rate-Limit
- **Middleware**: Multer (File Uploads), Morgan (Logging), Winston (Advanced Logging)

---

## 🛠️ Installation

Follow these steps to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance

### 1. Clone the repository
```bash
git clone https://github.com/your-username/attendance-tracking.git
cd attendance-tracking
```

### 2. Install dependencies
```bash
# Install frontend and backend dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
```

### 4. Download AI Models (For Face Recognition)
```bash
node download_models.js
```

### 5. Run the application
```bash
# Starts both Vite (Frontend) and Node (Backend) concurrently
npm run dev
```
Dashboard will be available at `http://localhost:5173`.

---

## 📖 Usage Guide

### 📂 Folder Structure
```text
Attendance_Tracking/
├── public/                 # Static assets & AI Models
├── server/                 # Backend Source
│   ├── controllers/        # Business Logic
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Endpoints
│   ├── middleware/         # Auth & Validation
│   └── server.js           # Server Entry Point
├── src/                    # Frontend Source
│   ├── components/         # Reusable UI Components
│   ├── pages/              # View/Page Components
│   ├── context/            # Auth & Global State
│   └── App.jsx             # Router Configuration
└── README.md
```

### 🔑 Test Credentials
The system comes seeded with the following default accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@school.com` | `admin123` |
| **Teacher** | `teacher@school.com` | `teacher123` |
| **Student** | `student@school.com` | `student123` |

### 🎭 User Workflows
- **Admin**: Log in to access the "Executive Suite". Manage the database of users and subjects. Monitor system-wide analytics.
- **Teacher**: Create a class session. Generate a QR code or initiate a Face-API scan to mark attendance for enrolled students.
- **Student**: Log in to view personal attendance percentages. Use the scanner to "check-in" to a live session.

---

## 🖼️ Screenshots

![Dashboard Mockup](assets/dashboard.png)
*Modern Dashboard with Real-time Statistics*

![System Roles](assets/admin_dashboard.png)
*Collaborative Environment for Students & Teachers*

---
/
## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

👨‍💻 Author

Vedant Sharma

GitHub: https://github.com/thevedantsharma
LinkedIn: https://www.linkedin.com/in/vedant-sharma-5ba23a271/

Developed with ❤️ by [Vedant Sharma]
