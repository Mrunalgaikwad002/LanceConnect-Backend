# LanceConnect Backend

A robust Node.js backend API for LanceConnect, a freelance marketplace platform that connects clients with skilled freelancers.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Gig Management** - Create, update, and manage freelance gigs with categories, pricing, and delivery settings
- **Order System** - Complete order lifecycle from creation to completion
- **Payment Processing** - Stripe integration for secure payment processing
- **Review System** - Rating and review system for freelancers and clients
- **Withdrawal Management** - Freelancer earnings and withdrawal tracking

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe
- **Password Hashing**: bcryptjs
- **CORS**: Cross-origin resource sharing enabled

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controllers/
│   ├── authController.js     # User authentication logic
│   ├── gigController.js      # Gig management logic
│   ├── orderController.js    # Order processing logic
│   ├── paymentController.js  # Payment processing logic
│   └── reviewController.js   # Review system logic
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
├── models/
│   ├── User.js              # User model with roles (client/freelancer)
│   ├── Gig.js               # Gig/service model
│   ├── Order.js             # Order model
│   ├── Payment.js           # Payment model
│   ├── Review.js            # Review model
│   ├── Message.js           # Messaging model
│   └── Withdrawal.js        # Withdrawal model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── gig.js               # Gig management routes
│   ├── order.js             # Order routes
│   ├── payment.js           # Payment routes
│   └── review.js            # Review routes
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Stripe account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT= your port number
   NODE_ENV=development
   
   # Database Configuration
   MONGO_URI= your database url
   # or for MongoDB Atlas: mongodb+srv://your username and password
   
   # JWT Configuration
   JWT_SECRET= your jwt secret key
   
   # Stripe Configuration
   STRIPE_SECRET_KEY= your stripe secret key
   STRIPE_WEBHOOK_SECRET= your stripe webhook secret 
   
   # Optional: For production
   # CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on  the port specified in your .env file

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Gigs
- `GET /api/gigs` - Get all gigs
- `GET /api/gigs/:id` - Get specific gig
- `POST /api/gigs` - Create new gig (freelancer only)
- `PUT /api/gigs/:id` - Update gig (owner only)
- `DELETE /api/gigs/:id` - Delete gig (owner only)

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/history` - Get payment history

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **client**: Can browse gigs, place orders, make payments, and leave reviews
- **freelancer**: Can create gigs, accept orders, receive payments, and manage their services

## 💳 Payment Integration

The backend integrates with Stripe for payment processing:

- Secure payment processing with Stripe
- Webhook handling for payment status updates
- Support for both one-time payments and subscriptions
- Automatic payment verification and order status updates

## 🗄 Database Models

### User Model
- Basic info: name, email, password, role
- Profile: bio, skills, hourly rate, experience
- Statistics: total earnings, orders, ratings
- Social links: portfolio, LinkedIn, GitHub

### Gig Model
- Service details: title, description, category
- Pricing: fixed or hourly rates
- Delivery: time, revisions
- Statistics: views, orders, ratings

### Order Model
- Order details: gig, client, freelancer
- Status tracking: pending, in-progress, completed
- Payment integration with Stripe

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (not implemented yet)

### Code Style

- Follow standard JavaScript/Node.js conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Use meaningful variable and function names

## 🚀 Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
NODE_ENV=production
PORT=port number
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
STRIPE_SECRET_KEY=your_stripe_live_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Deployment Platforms

This backend can be deployed on:
- Heroku
- Vercel
- Railway
- DigitalOcean
- AWS
- Google Cloud Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Gig management system
  - Order processing
  - Payment integration with Stripe
  - Review system
  - Messaging system

---

**LanceConnect Backend** - Powering the future of freelance marketplaces! 🚀
