# API Documentation

This document outlines the core REST API endpoints for the B2B ERP System. 

## Base URL
`http://localhost:5000/api`

---

## 1. Authentication

### Log In
*   **Endpoint:** `POST /auth/login`
*   **Description:** Authenticates a user and returns a JWT token.
*   **Request Body:**
    ```json
    {
      "email": "admin@erp.com",
      "password": "password123"
    }
    ```
*   **Success Response:** `200 OK`
    ```json
    {
      "token": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": 1,
        "name": "Admin",
        "role": "Admin"
      }
    }
    ```

---

## 2. Enquiries

### Create Enquiry
*   **Endpoint:** `POST /enquiries`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Creates a new customer enquiry and auto-resolves missing products/customers.
*   **Request Body:**
    ```json
    {
      "company_name": "Tech Industries Pvt Ltd",
      "contact_person": "John Doe",
      "email": "john@techindustries.com",
      "required_date": "2026-10-31",
      "items": [
        { "product_id": 1, "quantity": 150 }
      ]
    }
    ```
*   **Success Response:** `201 Created`

### Get All Enquiries
*   **Endpoint:** `GET /enquiries`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Fetches all enquiries in descending order.
*   **Success Response:** `200 OK` (Returns array of enquiry objects)

---

## 3. Quotations

### Create Quotation
*   **Endpoint:** `POST /quotations`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Generates a quotation for a specific enquiry.
*   **Request Body:**
    ```json
    {
      "enquiry_id": 12
    }
    ```
*   **Success Response:** `201 Created`

### Accept Quotation
*   **Endpoint:** `PUT /quotations/:id/accept`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Updates quotation status to ACCEPTED.
*   **Success Response:** `200 OK`

---

## 4. Sales Orders & Dispatch (Admin Only)

### Create Sales Order
*   **Endpoint:** `POST /sales-orders`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Converts an accepted quotation into a new sales order.
*   **Success Response:** `201 Created`

### Confirm Order (Stock Reservation)
*   **Endpoint:** `PUT /sales-orders/:id/confirm`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Uses PostgreSQL `FOR UPDATE` transaction locks to securely reserve physical inventory.
*   **Success Response:** `200 OK`

### Dispatch Order
*   **Endpoint:** `PUT /sales-orders/:id/dispatch`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Deducts reserved and physical stock permanently, marking the order as DISPATCHED.
*   **Success Response:** `200 OK`
