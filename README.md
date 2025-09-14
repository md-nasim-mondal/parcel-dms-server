# Parcel Delivery API

## 🎯 Project Overview

A **secure, modular, and role-based backend API** for a parcel delivery system (inspired by Pathao Courier or Sundarban) built with **Express.js**, **TypeScript**, and **Mongoose**. This system allows users to register as senders or receivers and perform parcel delivery operations such as **create parcel**, **track status**, and **cancel or receive parcels**.

## ✨ Features Implemented

### 🔐 Authentication & Authorization

- JWT-based authentication system
- Secure password hashing with bcrypt
- Role-based access control (admin, sender, receiver, super_admin)
- Google OAuth integration with Passport.js
- OTP verification system
- Refresh token mechanism

### 👥 User Management

- User registration and login
- Profile management
- User blocking/unblocking (Admin)
- Email verification system

### 📦 Parcel Management

- **Sender Features:**

  - Create parcel delivery requests
  - Cancel parcels (if not dispatched)
  - View all their parcels with status logs
  - Delete parcels (with restrictions)

- **Receiver Features:**

  - View incoming parcels
  - Confirm parcel delivery
  - View delivery history

- **Admin Features:**
  - View and manage all users and parcels
  - Block or unblock users/parcels
  - Update delivery statuses
  - Assign delivery personnel
  - Create parcels on behalf of users

### 🔍 Tracking System

- Unique tracking ID generation (Format: `TRK-YYYYMMDD-XXXXXX`)
- Public parcel tracking by tracking ID
- Embedded status logs within parcel documents
- Complete status transition validation

### 💰 Additional Features

- Dynamic fee calculation based on weight, type, and shipping method
- Coupon system for discounts
- Statistics and analytics
- Advanced search and filtering
- Pagination support

## 🏗️ Project Structure

```
├── .git/ 🚫 (auto-hidden)
├── dist/ 🚫 (auto-hidden)
├── node_modules/ 🚫 (auto-hidden)
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   ├── cloudinary.config.ts
│   │   │   ├── env.ts
│   │   │   ├── multer.config.ts
│   │   │   ├── passport.ts
│   │   │   └── redis.config.ts
│   │   ├── errorHelpers/
│   │   │   ├── AppError.ts
│   │   │   ├── handleCastError.ts
│   │   │   ├── handleDuplicate.ts
│   │   │   ├── handleDuplicateError.ts
│   │   │   ├── handleValidationError.ts
│   │   │   ├── handleZodError.ts
│   │   │   ├── handlerValidationError.ts
│   │   │   └── handlerZodError.ts
│   │   ├── interfaces/
│   │   │   ├── error.types.ts
│   │   │   └── index.d.ts
│   │   ├── middlewares/
│   │   │   ├── checkAuth.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   └── validateRequest.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.route.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── coupon/
│   │   │   │   ├── coupon.controller.ts
│   │   │   │   ├── coupon.interface.ts
│   │   │   │   ├── coupon.model.ts
│   │   │   │   ├── coupon.route.ts
│   │   │   │   ├── coupon.service.ts
│   │   │   │   ├── coupon.utils.ts
│   │   │   │   └── coupon.validation.ts
│   │   │   ├── otp/
│   │   │   │   ├── otp.controller.ts
│   │   │   │   ├── otp.route.ts
│   │   │   │   ├── otp.service.ts
│   │   │   │   └── otp.validation.ts
│   │   │   ├── parcel/
│   │   │   │   ├── parcel.controller.ts
│   │   │   │   ├── parcel.interface.ts
│   │   │   │   ├── parcel.model.ts
│   │   │   │   ├── parcel.route.ts
│   │   │   │   ├── parcel.service.ts
│   │   │   │   ├── parcel.utils.ts
│   │   │   │   └── parcel.validation.ts
│   │   │   ├── stats/
│   │   │   │   ├── stats.controller.ts
│   │   │   │   ├── stats.route.ts
│   │   │   │   └── stats.service.ts
│   │   │   └── user/
│   │   │       ├── user.constant.ts
│   │   │       ├── user.controller.ts
│   │   │       ├── user.interface.ts
│   │   │       ├── user.model.ts
│   │   │       ├── user.route.ts
│   │   │       ├── user.service.ts
│   │   │       └── user.validation.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── templates/
│   │   │   │   ├── forgetPassword.ejs
│   │   │   │   ├── invoice.ejs
│   │   │   │   └── otp.ejs
│   │   │   ├── QueryBuilder.ts
│   │   │   ├── catchAsync.ts
│   │   │   ├── generateTrackingId.ts
│   │   │   ├── getTransactionId.ts
│   │   │   ├── invoice.ts
│   │   │   ├── jwt.ts
│   │   │   ├── seedSuperAdmin.ts
│   │   │   ├── sendEmail.ts
│   │   │   ├── sendResponse.ts
│   │   │   ├── setCookie.ts
│   │   │   └── userTokens.ts
│   │   └── constants.ts
│   ├── app.ts
│   └── server.ts
├── .env 🚫 (auto-hidden)
├── .gitignore
├── README.md
├── eslint.config.mjs
├── package-lock.json
├── package.json
└── tsconfig.json
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (for session management)
- npm or yarn

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/md-nasim-mondal/parcel-dms-server
cd parcel-dms-server
```

2. **Install dependencies:**

```bash
npm install
```

3. **Environment Setup:**
   Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123
```

4. **Start the development server:**

```bash
npm run dev
```

5. **Build for production:**

```bash
npm run build
npm start
```

## 📋 API Endpoints

### Authentication Routes (`/api/v1/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh-token` - Get new access token
- `POST /change-password` - Change password
- `POST /forgot-password` - Forgot password
- `POST /reset-password` - Reset password
- `GET /google` - Google OAuth login

### User Routes (`/api/v1/users`)

- `GET /` - Get all users (Admin only)
- `GET /me` - Get current user profile
- `GET /:id` - Get single user (Admin only)
- `PATCH /:id` - Update user profile

### Parcel Routes (`/api/v1/parcels`)

#### Sender Routes

- `POST /` - Create parcel (Sender only)
- `POST /cancel/:id` - Cancel parcel (Sender only)
- `POST /delete/:id` - Delete parcel (Sender only)
- `GET /me` - Get sender's parcels (Sender only)
- `GET /:id/status-log` - Get parcel with history (Sender only)

#### Receiver Routes

- `GET /me/incoming` - Get incoming parcels (Receiver only)
- `PATCH /confirm/:id` - Confirm delivery (Receiver only)
- `GET /me/history` - Get delivery history (Receiver only)

#### Admin Routes

- `GET /` - Get all parcels (Admin only)
- `POST /create-parcel` - Create parcel by admin (Admin only)
- `PATCH /:id/delivery-status` - Update parcel status (Admin only)
- `PATCH /:id/block-status` - Block/unblock parcel (Admin only)
- `GET /:id/details` - Get parcel details (Admin only)

#### Public Routes

- `GET /tracking/:trackingId` - Track parcel by tracking ID

### OTP Routes (`/api/v1/otp`)

- `POST /send` - Send OTP
- `POST /verify` - Verify OTP

### Coupon Routes (`/api/v1/coupons`)

- `POST /` - Create coupon (Admin only)
- `GET /` - Get all coupons
- `POST /apply` - Apply coupon

### Stats Routes (`/api/v1/stats`)

- `GET /` - Get system statistics (Admin only)

## 🔒 Authentication & Authorization

### Roles

- **SENDER**: Can create, cancel, and view their parcels
- **RECEIVER**: Can view incoming parcels and confirm deliveries
- **ADMIN**: Can manage users and parcels
- **SUPER_ADMIN**: Full system access

### JWT Token Structure

```json
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "SENDER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 📦 Parcel Status Flow

The parcel lifecycle goes through multiple stages. At each stage, certain exceptions such as **Cancel**, **Return**, **Reschedule**, **Flag**, **On Hold**, or **Blocked** may occur.

### 🔄 Main Flow

REQUESTED → APPROVED → PICKED → DISPATCHED → IN_TRANSIT → DELIVERED

### ❌ Cancel / Return / Reschedule Paths

REQUESTED → CANCELLED
APPROVED → CANCELLED
PICKED → RETURNED
DISPATCHED → RETURNED
IN_TRANSIT → RESCHEDULED

### ⚠️ Special Cases

CANCELLED → FLAGGED → BLOCKED
RETURNED → FLAGGED → BLOCKED
RESCHEDULED → ON_HOLD → BLOCKED

---

### 📖 Status Explanation

- **REQUESTED** → When the customer places an order.
- **APPROVED** → When the order is verified and approved by the seller/admin.
- **PICKED** → When the courier picks up the parcel.
- **DISPATCHED** → When the parcel is dispatched toward its destination.
- **IN_TRANSIT** → While the parcel is on the way.
- **DELIVERED** → When the parcel is successfully delivered to the customer.
- **CANCELLED / RETURNED / RESCHEDULED** → Possible exception states depending on customer or delivery issues.
- **FLAGGED / ON_HOLD / BLOCKED** → Security or policy-related statuses for further investigation.

---

✅ This flow clearly illustrates how a parcel progresses step by step and what exceptional cases may occur during the delivery process.

## 🎯 Parcel Features

### Tracking ID Format

- Format: `TRK-YYYYMMDD-XXXXXX`
- Example: `TRK-20241201-A1B2C3`

### Fee Calculation

- Base fee: ৳50
- Weight-based pricing:
  - Up to 500g: +৳50
  - 500g-1kg: +৳100
  - 1kg-2kg: +৳150
  - 2kg-5kg: +৳250
  - 5kg-10kg: +৳400

### Parcel Types

- `DOCUMENT`: No surcharge
- `PACKAGE`: +৳10
- `FRAGILE`: +৳25
- `ELECTRONICS`: +৳40

### Shipping Types

- `STANDARD`: No surcharge (5 days)
- `EXPRESS`: +৳50 (2 days)
- `OVERNIGHT`: +৳75 (1 day)
- `SAME_DAY`: +৳100 (6 hours)

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt, Passport.js
- **Session Store**: Redis
- **Validation**: Zod
- **Development**: ts-node-dev, ESLint, Prettier

## 🧪 Testing

Use the provided Postman collection to test all endpoints. Import the collection and set up the environment variables:

- `baseURL`: `http://localhost:5000/api/v1`
- `accessToken`: JWT token from login response

## 📝 Sample API Requests

### User Registration

```json
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "SENDER",
  "phone": "+8801234567890",
  "address": "123 Main St, Dhaka"
}
```

### Create Parcel

```json
POST /api/v1/parcels
{
  "receiverName": "Jane Smith",
  "receiverPhone": "+8801987654321",
  "receiverEmail": "jane@example.com",
  "pickupAddress": "123 Sender St, Dhaka",
  "deliveryAddress": "456 Receiver Ave, Chittagong",
  "weight": 2.5,
  "type": "PACKAGE",
  "shippingType": "EXPRESS",
  "description": "Important documents"
}
```

### Track Parcel

```json
GET /api/v1/parcels/tracking/TRK-20241201-A1B2C3
```

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run prettier` - Format code with Prettier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Developed with ❤️ for the parcel delivery system.

---

**Note**: This API is fully functional and includes all the requirements specified in the project brief. All endpoints are protected with proper authentication and authorization, and the system supports complete parcel lifecycle management with embedded status tracking. Additionally, the system includes coupon management features, allowing for the creation, application, and management of discount codes for parcel deliveries.
