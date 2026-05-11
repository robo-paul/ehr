# EHR System - Electronic Health Record Management System

A comprehensive, secure, and modern Electronic Health Record (EHR) system designed for healthcare facilities to manage patient records, appointments, medical reports, prescriptions, lab results, and secure messaging between healthcare providers and patients.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - Role-based access control (Patient, Doctor, Nurse, Pharmacist, Radiologist, Lab Scientist, Admin, Master Admin)
  - JWT token-based authentication
  - Email verification and user approval workflow

### Patient Management
- Complete patient registration and profile management
- Medical history tracking
- Clinical notes, allergies, and chronic conditions
- Medication management
- Insurance information
- Primary care physician assignment

### Appointment Management
- Schedule, reschedule, and cancel appointments
- Appointment status tracking (Requested, Proposed, Confirmed, Completed, Cancelled)
- Provider availability management
- Email and in-app notifications for appointment updates

### Medical Records
- Digital medical reports with attachments
- Lab results management
- Prescription (e-Script) management
- Radiology images and reports
- Clinical documentation

### Messaging System
- Real-time messaging between patients and providers
- File attachments support
- Read receipts and message history
- Conversation threading

### Notifications
- In-app notifications for important events
- Email notifications (configurable preferences)
- Real-time badge counts for unread messages/notifications
- Appointment reminders

### Admin Dashboard
- User management (verify, activate/deactivate users)
- Role management
- System statistics and analytics
- Audit logs

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2.7 with Django REST Framework
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Authentication**: Knox Token Authentication
- **API Documentation**: DRF YASG
- **Email**: SMTP (SendGrid/Gmail integration ready)

### Frontend
- **Framework**: React 18.2.0
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Routing**: React Router DOM v6
- **Icons**: Font Awesome

### DevOps & Tools
- **Version Control**: Git
- **Environment Management**: Python venv, npm
- **Code Quality**: ESLint, Prettier

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js 18.x or higher
- npm or yarn
- Git

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ehr-system.git
cd ehr-system
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser

# Seed initial data (optional)
python manage.py loaddata initial_data.json

# Run the development server
python manage.py runserver
```

### 3. Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# Start the development server
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### Default Admin Credentials
- Username: `admin`
- Password: `Admin123!`

## 📁 Project Structure

```
ehr-system/
├── backend/
│   ├── authentication/     # User authentication & management
│   ├── patients/          # Patient management
│   ├── appointments/      # Appointment scheduling
│   ├── reports/           # Medical reports
│   ├── prescriptions/     # e-Script management
│   ├── lab_results/       # Lab results
│   ├── notifications/     # Notification system
│   ├── chat/              # Messaging system
│   ├── admin_app/         # Admin dashboard
│   └── ehr_project/       # Project settings
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   ├── public/            # Static files
│   └── package.json       # Dependencies
└── docs/                  # Documentation
```

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/register/patient/` | Patient registration |
| POST | `/api/auth/register/doctor/` | Doctor registration |
| POST | `/api/auth/logout/` | User logout |
| GET | `/api/auth/profile/` | Get user profile |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/patients/` | List all patients |
| GET | `/api/patients/patients/{id}/` | Get patient details |
| POST | `/api/patients/patients/` | Create new patient |
| PUT | `/api/patients/patients/{id}/` | Update patient |
| DELETE | `/api/patients/patients/{id}/` | Delete patient |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/appointments/` | List appointments |
| POST | `/api/appointments/appointments/` | Create appointment |
| POST | `/api/appointments/appointments/{id}/confirm/` | Confirm appointment |
| POST | `/api/appointments/appointments/{id}/cancel/` | Cancel appointment |

### And more endpoints for reports, prescriptions, lab results, messaging, notifications...

## 🎯 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Patient** | View own records, book appointments, view prescriptions, send messages |
| **Doctor** | Manage patients, write prescriptions, view lab results, manage appointments |
| **Nurse** | Assist with patient care, update vitals, schedule appointments |
| **Pharmacist** | Manage prescriptions, dispense medications |
| **Radiologist** | Upload/view radiology images, write radiology reports |
| **Lab Scientist** | Upload lab results, manage lab tests |
| **Admin** | User management, system configuration |
| **Master Admin** | Full system access, all permissions |

## 🔒 Security Features

- Password hashing using PBKDF2
- JWT token authentication with expiration
- CORS protection
- SQL injection prevention (Django ORM)
- XSS protection
- CSRF protection
- Rate limiting on API endpoints
- Secure password reset flow
- Email verification for new accounts

## 📧 Email Configuration

For email notifications, configure your `.env` file:

```env
# For Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# For SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors, ensure `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL.

### Database Issues
```bash
# Reset database
rm db.sqlite3
python manage.py migrate
```

### Port Already in Use
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📊 Database Schema

The system uses the following main models:
- **User** (Extended Django User model)
- **Patient** (Linked to User)
- **Appointment**
- **MedicalReport**
- **Prescription**
- **LabResult**
- **Message**
- **Notification**
- **ClinicalNote**
- **Allergy**
- **Medication**

## 🚦 Running Tests

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Deployment

### Deploy to Production

**Using Docker:**
```bash
docker-compose up --build
```

**Manual Deployment:**
1. Set `DEBUG=False` in `.env`
2. Configure production database (PostgreSQL recommended)
3. Collect static files: `python manage.py collectstatic`
4. Set up Gunicorn and Nginx
5. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **My Name** - *Initial work* - [Github](https://github.com/robo-paul)

## 🙏 Acknowledgments

- Django REST Framework community
- React team
- Tailwind CSS
- All contributors and testers

## 📞 Support

For support, email support@ehrsystem.com or create an issue in the GitHub repository.

## 🗺️ Roadmap

- [ ] Video consultation integration
- [ ] Mobile app (React Native)
- [ ] AI-powered diagnosis assistance
- [ ] Integration with third-party lab systems
- [ ] Electronic billing and insurance claims
- [ ] Patient portal mobile app
- [ ] Telemedicine features
- [ ] Analytics dashboard
- [ ] Export reports (PDF/CSV)
- [ ] Two-factor authentication

---

**Made with ❤️ for healthcare providers and patients**
