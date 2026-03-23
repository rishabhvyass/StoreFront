# Quick Setup Guide

## Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 2: Start Backend Server

```bash
npm start
```

The backend will run on `http://localhost:5000`

## Step 3: Install Frontend Dependencies

In a new terminal, navigate to the project root:

```bash
cd ..
npm install
```

## Step 4: Configure Environment

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 5: Start Frontend

```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Testing the Application

### 1. Register a Customer Account
- Go to `http://localhost:3000/register`
- Fill in the registration form
- You'll be automatically logged in

### 2. Create Products (Backend)
- First, you need to create an internal user via API or modify the backend to allow internal user registration
- Login as internal user
- Go to `/backend/products`
- Add products with `published: true` to make them visible on the website

### 3. Browse and Shop
- Go to `/shop` to see published products
- Add products to cart
- Go to `/cart` to review your order
- Apply a coupon code if you have one
- Proceed to checkout

### 4. View Orders
- After checkout, go to `/customer-portal`
- View your orders and invoices
- Download invoices

## Creating an Internal User (Backend Access)

You can create an internal user by making a POST request to the API:

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "mobile": "1234567890",
    "address": {
      "city": "City",
      "state": "State",
      "pincode": "123456"
    },
    "role": "internal"
  }'
```

Or modify the backend to add a default admin user in `server/server.js`.

## Default Payment Term

The system comes with a default "Immediate Payment" payment term that is used for website orders.

## Notes

- The backend uses in-memory storage. All data will be lost when the server restarts.
- For production, replace with a proper database.
- JWT secret should be changed in production.
- Add proper image upload functionality for product images.

