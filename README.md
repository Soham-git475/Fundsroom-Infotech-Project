# B2B ERP System: Enquiry-to-Dispatch

A full-stack Enterprise Resource Planning (ERP) case study demonstrating a complete B2B workflow from customer enquiry to final product dispatch. It features role-based access control, transaction safety, and complex database concurrency management.

## Tech Stack
* **Frontend:** React.js, Vite
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (pg)
* **Concurrency Control:** PostgreSQL `FOR UPDATE` row-level locks

## Project Setup

### Prerequisites
* Node.js (v16+)
* PostgreSQL (v12+)

### 1. Database Setup
1. Create a PostgreSQL database named `erp_db`.
2. Ensure you have a user with privileges to create tables.

### 2. Environment Variables
Create a `.env` file in the `/backend` directory with the following variables:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_db
JWT_SECRET=your_jwt_secret_key
