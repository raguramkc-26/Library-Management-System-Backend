⚙️ Library Management System – Backend (MERN)

A scalable RESTful backend API built with Node.js, Express, and MongoDB to manage a complete library workflow including authentication, book lifecycle, borrowing, reservations, reviews, and admin operations.

---

Live API
Base URL
https://library-management-system-backend-jkpg.onrender.com/api/v1

---

Key Highlights
- JWT Authentication with role-based authorization (User / Admin)
- Borrow & Return system with transactional safety
- Reservation queue (FIFO-based handling)
- Review system with admin moderation workflow
- Email notifications (Resend / Nodemailer)
- Razorpay integration for payments
- Modular architecture (Controller → Route → Middleware → Model)

---

Authentication Flow
1. User logs in via "/auth/login"
2. Server returns JWT token
3. Token must be included in headers:

Authorization: Bearer <token>

4. Middleware verifies token and attaches user context

---

API Endpoints

Auth
- "POST /auth/register" → Register user
- "POST /auth/login" → Login

---

Books
- "GET /books" → Get all books
- "GET /books/:id" → Get book details
- "POST /admin/books" → Add book (Admin)
- "PUT /admin/books/:id" → Update book
- "DELETE /admin/books/:id" → Delete book

---

Borrow System
- "POST /borrow/borrow/:bookId" → Borrow book
- "POST /borrow/reserve/:bookId" → Reserve book (queue)
- "PUT /borrow/return/:borrowId" → Return book
- "GET /borrow/me" → User borrow history

---

Reviews
- "POST /reviews/:bookId" → Add review
- "GET /reviews/:bookId" → Get approved reviews
- "GET /reviews/:bookId/average" → Get average rating

---

Admin (Moderation)
- "GET /reviews/pending" → Pending reviews
- "PATCH /reviews/:id/approve" → Approve review
- "PATCH /reviews/:id/reject" → Reject review

---

Reservation & Notifications
- "POST /reservation/:bookId" → Add to reservation queue
- "GET /notifications" → Get user notifications

---

System Workflow (Core Logic)

Borrow Flow

Available → Borrowed → Returned

Reservation Flow

Borrowed → Waiting Queue → Notified → Reserved → Borrowed

Review Flow

User submits → Admin approves → Visible publicly

---

Project Structure
/backend
  ├── controllers
  ├── models
  ├── routes
  ├── middlewares
  ├── utils
  ├── app.js
  └── server.js

---

Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Resend / Nodemailer (Email Service)
- Razorpay (Payments)

---

Known Limitations
- Reservation queue has no expiry handling
- Email system lacks retry mechanism
- Fine/payment system is basic
- No rate limiting (API abuse possible)

---

Future Improvements
- Real-time updates (Socket.io)
- Redis-based queue system
- Fine payment automation
- Advanced analytics dashboard
- Rate limiting & security hardening
- Retry system for email delivery

---

Environment Variables
Create ".env" in "/backend":
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=
RESEND_API_KEY=
CLOUDINARY_URL=
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=

---

API Documentation
https://documenter.getpostman.com/view/11270312/2sBXqDuPWg

---

Author
Raguram KC

---

Final Note
This backend demonstrates a transition from simple CRUD APIs to a structured system with authentication, role-based access control, transactional operations, and queue-based workflows. It reflects practical backend engineering patterns used in real-world applications.
