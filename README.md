Library Management System - Backend (MERN)
This is the backend API for the Library Management System built using Node.js, Express, and MongoDB. It handles authentication, book management, borrowing, reservations, reviews, and admin operations.

Live API
Base URL:
https://library-management-system-backend-jkpg.onrender.com/api/v1


Authentication
- JWT-based authentication
- Role-based access (User / Admin)


How to Test API
Use Postman or frontend UI.
Steps:
1. Login using API:
   
   POST /auth/login

2. Copy token from response

3. Use token in headers:
   
   Authorization: Bearer <token>


API Endpoints
Auth
- POST "/auth/register" → Register user
- POST "/auth/login" → Login

Books
- GET "/books" → Get all books
- GET "/books/:id" → Get single book
- POST "/admin/books" → Add book (Admin)
- PUT "/admin/books/:id" → Update book
- DELETE "/admin/books/:id" → Delete book

Borrow
- POST "/borrow/:bookId" → Borrow book
- PUT "/borrow/:borrowId/return" → Return book
- GET "/borrow/me" → My borrow history

Reviews
- POST "/reviews/:bookId" → Add review
- GET "/reviews/:bookId" → Get approved reviews
- GET "/reviews/:bookId/average" → Average rating

Admin:
- GET "/reviews/pending" → Pending reviews
- PATCH "/reviews/:id/approve"
- PATCH "/reviews/:id/reject"

Reservation
- POST "/reservation/:bookId" → Reserve book

Notifications
- GET "/notifications" → Get user notifications

🧱 Project Structure

/backend
  ├── controllers
  ├── models
  ├── routes
  ├── middlewares
  ├── utils
  ├── app.js
  └── server.js

Core Features
- JWT Authentication & Authorization
- Role-based Access Control
- Book CRUD (Admin)
- Borrow / Return system
- Reservation queue system
- Review system (Admin approval)
- Email notifications (Nodemailer)
- Payment integration (Razorpay)

⚠️ Known Issues

- Review requires admin approval before display
- Reservation logic triggers only when book unavailable
- Payment flow is basic

🛠 Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT
- Nodemailer
- Razorpay


API Documentation

https://documenter.getpostman.com/view/11270312/2sBXqDuPWg

---

👨‍💻 Author

Raguram KC
