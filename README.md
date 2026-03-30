# Grand Stays | Luxury Hotel Management

Grand Stays is a premium, full-stack hotel management system with integrated AI features and full INR (₹) localization.

## 🚀 Getting Started

To run this project on your local machine, follow these steps exactly.

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: A local instance or a MongoDB Atlas URI
- **Supabase**: A Supabase project for Authentication

### 2. Setup & Installation

```bash
# Install Frontend dependencies
npm install

# Install Backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

You need to create two `.env` files.

#### **Backend Environment** (`backend/.env`)
Create a file at `backend/.env` and add:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### **Frontend Environment** (`.env`)
Create a file at the root `.env` and add:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 4. Running the Project

You will need two separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

The application will be available at **http://localhost:5173**.

---

## 💎 Premium Features

- **AI Workflow Orchestrator**: High-intelligence task prioritization for staff.
- **AI Yield Maximizer**: Dynamic pricing insights and revenue forecasting for admins.
- **Full INR Localization**: Every price and calculation is in Indian Rupees (₹).
- **Smart Room Controls**: Interactive IoT simulation for guest rooms.
- **Audit System**: Complete transparency with an activity trail for every staff action.

## 🎨 Design System
- **Theme**: Premium Dark/Gold "Glassmorphism" aesthetic.
- **Responsiveness**: Fully optimized for Mobile, Tablet, and Laptop.
- **Typography**: Professional font pairings (Inter & Serif headers).

---

