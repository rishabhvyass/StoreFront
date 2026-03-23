# ApparelDesk - E-commerce System

A complete web-based clothing e-commerce system with backend management and customer portal.

## Features

### Customer Portal (Frontend)
- Browse products with filters (category, type, search)
- Add items to shopping cart
- Apply coupon codes during checkout
- View orders and invoices
- Download invoices

### Backend Management
- **Products Management**: Create, edit, manage stock, publish/unpublish products
- **Contacts Management**: Manage customers and vendors
- **Sale Orders**: Create and manage customer orders
- **Purchase Orders**: Create and manage vendor purchase orders
- **Customer Invoices**: Generate invoices from sale orders
- **Vendor Bills**: Generate bills from purchase orders
- **Payments**: Record payments against invoices and bills
- **Payment Terms**: Configure payment terms with early payment discounts
- **Discount Offers**: Create discount programs and coupon codes
- **Reports**: Generate sales and purchase reports by products, customers, and vendors
- **Settings**: Configure automatic invoicing

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Bootstrap 5
- Material-UI
- Context API for state management

### Backend
- Node.js
- Express.js
- JWT for authentication
- bcryptjs for password hashing
- In-memory database (replace with actual database in production)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Default Data

The backend initializes with:
- Default payment term: "Immediate Payment" (no early payment discount)

## User Roles

### Portal Users (Customers)
- Can register and login
- Browse published products
- Add items to cart
- Apply coupon codes
- View their own orders and invoices
- Download invoices

### Internal Users (Backend)
- Can manage all backend features
- Access to all reports and settings
- Full CRUD operations on all modules

**Note**: To create an internal user, you'll need to use the backend API directly or add a registration endpoint for internal users.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new portal user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products (published only for portal users)
- `POST /api/products` - Create product (internal only)
- `PUT /api/products/:id` - Update product (internal only)

### Orders
- `GET /api/sale-orders` - Get sale orders
- `POST /api/sale-orders` - Create sale order
- `GET /api/customer-invoices` - Get customer invoices
- `POST /api/customer-invoices` - Create invoice from sale order

### Reports
- `GET /api/reports/sales-by-products?start_date=&end_date=`
- `GET /api/reports/purchase-by-products?start_date=&end_date=`
- `GET /api/reports/sales-by-customers?start_date=&end_date=`
- `GET /api/reports/purchase-by-vendors?start_date=&end_date=`

See `server/server.js` for complete API documentation.

## Key Features Implementation

### Automatic Stock Management
- Product stock is automatically updated when:
  - Purchase orders are converted to vendor bills (stock increases)
  - Sale orders are created (stock decreases)

### Automatic Invoicing
- When enabled in settings, customer invoices are automatically created after successful website checkout
- When disabled, invoices must be manually created from sale orders

### Payment Terms
- Support for early payment discounts
- Configurable discount percentage and days
- Example preview for PDF generation

### Coupon Codes
- Contact-based restrictions
- Expiration date validation
- Linked to discount offers
- Status tracking (used/unused)

## Production Considerations

1. **Database**: Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Use secure JWT secret in production
3. **Password Hashing**: Already using bcryptjs
4. **File Upload**: Implement proper image upload for products
5. **PDF Generation**: Implement proper PDF generation for invoices
6. **Payment Gateway**: Integrate actual payment gateway
7. **Email**: Send order confirmations and invoices via email
8. **Error Handling**: Add comprehensive error handling and logging
9. **Validation**: Add input validation on both frontend and backend
10. **Security**: Add rate limiting, CORS configuration, and security headers

## Project Structure

```
ApperalDesk/
├── server/                 # Backend API
│   ├── server.js          # Express server and routes
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/        # Reusable components
│   ├── context/           # React Context for state
│   ├── pages/             # Page components
│   ├── services/          # API service functions
│   ├── styles/            # CSS files
│   ├── App.js             # Main app component
│   └── index.js           # React entry point
└── package.json           # Frontend dependencies
```

## License

This project is for educational/demonstration purposes.
