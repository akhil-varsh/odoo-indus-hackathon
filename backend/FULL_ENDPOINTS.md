# CoreInventory Backend - Full Endpoint Reference

## Base URL

Production Tunnel:
https://fe3f-2409-40f0-fc-fd1e-c512-fbd4-a0d9-ce11.ngrok-free.app/api

Local:
http://localhost:5000/api

## Authentication

Protected routes require header:
Authorization: Bearer <token>

---

## Health

### 1) Health Check
- Method: GET
- Path: /health
- Auth: No
- Description: Service heartbeat

---

## Auth

### 1) Signup
- Method: POST
- Path: /auth/signup
- Auth: No
- Description: Create user account
- Body:
```json
{
  "name": "Akhil",
  "email": "akhil@example.com",
  "password": "StrongPass123",
  "role": "INVENTORY_MANAGER"
}
```

### 1b) Register (alias)
- Method: POST
- Path: /auth/register
- Auth: No
- Description: Alias of signup for frontend compatibility

### 2) Login
- Method: POST
- Path: /auth/login
- Auth: No
- Description: Returns JWT token and profile
- Body:
```json
{
  "email": "akhil@example.com",
  "password": "StrongPass123"
}
```

### 3) My Profile
- Method: GET
- Path: /auth/me
- Auth: Yes
- Description: Get currently logged-in user

### 3b) Logout
- Method: POST
- Path: /auth/logout
- Auth: Yes
- Description: Logout acknowledgment endpoint

### 4) Request Password Reset OTP
- Method: POST
- Path: /auth/password-reset/request-otp
- Auth: No
- Description: Generate OTP for password reset
- Body:
```json
{
  "email": "akhil@example.com"
}
```

### 5) Verify OTP and Reset Password
- Method: POST
- Path: /auth/password-reset/verify-otp
- Auth: No
- Description: Verify OTP and update password
- Body:
```json
{
  "email": "akhil@example.com",
  "otp": "123456",
  "newPassword": "NewStrongPass123"
}
```

---

## Products

### 1) List Products
- Method: GET
- Path: /products
- Auth: Yes
- Description: List products with stock summary
- Query Params:
  - search
  - category
  - sku

### 2) Create Product
- Method: POST
- Path: /products
- Auth: Yes
- Description: Create product with optional initial stock
- Body:
```json
{
  "sku": "ST-001",
  "name": "Steel Rod",
  "category": "Raw Material",
  "unitOfMeasure": "kg",
  "reorderRule": 20,
  "initialStock": 100,
  "initialLocationId": "<location-id>"
}
```

### 3) Update Product
- Method: PUT
- Path: /products/:id
- Auth: Yes
- Description: Update product fields

### 4) Product Availability by Location
- Method: GET
- Path: /products/:id/availability
- Auth: Yes
- Description: Returns stock levels by location for a product

---

## Inventory

### 1) List Locations
- Method: GET
- Path: /inventory/locations
- Auth: Yes
- Description: List all inventory locations
- Query Params:
  - type (INTERNAL, VENDOR, CUSTOMER, VIRTUAL_ADJUSTMENT)

### 2) Create Location
- Method: POST
- Path: /inventory/locations
- Auth: Yes
- Description: Create warehouse/rack/virtual location
- Body:
```json
{
  "name": "Main Warehouse",
  "type": "INTERNAL"
}
```

### 3) Inventory Levels
- Method: GET
- Path: /inventory/levels
- Auth: Yes
- Description: Stock per product/location with filters
- Query Params:
  - locationId
  - productId
  - category
  - search

### 4) Stock Ledger (Move History)
- Method: GET
- Path: /inventory/ledger
- Auth: Yes
- Description: Chronological movement history
- Query Params:
  - type
  - status
  - locationId
  - productId

### 5) Low Stock Alerts
- Method: GET
- Path: /inventory/alerts/low-stock
- Auth: Yes
- Description: Products that are low or out of stock

---

## Warehouses

### 1) List Warehouses
- Method: GET
- Path: /warehouses
- Auth: Yes

### 2) Create Warehouse
- Method: POST
- Path: /warehouses
- Auth: Yes
- Body:
```json
{
  "name": "Main Warehouse",
  "shortCode": "WH1",
  "address": "Industrial Area, Block A"
}
```

### 3) Get Warehouse
- Method: GET
- Path: /warehouses/:id
- Auth: Yes

### 4) Update Warehouse
- Method: PUT
- Path: /warehouses/:id
- Auth: Yes

### 5) Delete Warehouse
- Method: DELETE
- Path: /warehouses/:id
- Auth: Yes

---

## Locations

### 1) List Locations
- Method: GET
- Path: /locations
- Auth: Yes
- Query Params:
  - warehouseId
  - type

### 2) Create Location
- Method: POST
- Path: /locations
- Auth: Yes
- Body:
```json
{
  "name": "Rack A",
  "shortCode": "WH1-A",
  "warehouseId": "<warehouse-id>",
  "type": "INTERNAL"
}
```

### 3) Get Location
- Method: GET
- Path: /locations/:id
- Auth: Yes

### 4) Update Location
- Method: PUT
- Path: /locations/:id
- Auth: Yes

### 5) Delete Location
- Method: DELETE
- Path: /locations/:id
- Auth: Yes

---

## Stock

### 1) List Stock
- Method: GET
- Path: /stock
- Auth: Yes
- Query Params:
  - productId

### 2) Stock Summary
- Method: GET
- Path: /stock/summary
- Auth: Yes

### 3) Update Stock
- Method: PUT
- Path: /stock/:productId
- Auth: Yes
- Body:
```json
{
  "locationId": "<location-id>",
  "onHand": 100,
  "reserved": 10,
  "perUnitCost": 22.5
}
```

---

## Receipts

### 1) List Receipts
- Method: GET
- Path: /receipts
- Auth: Yes
- Query Params:
  - status
  - search
  - from
  - to
  - page
  - pageSize

### 2) Create Receipt
- Method: POST
- Path: /receipts
- Auth: Yes

### 3) Get Receipt
- Method: GET
- Path: /receipts/:id
- Auth: Yes

### 4) Update Receipt
- Method: PUT
- Path: /receipts/:id
- Auth: Yes

### 5) Validate Receipt
- Method: PUT
- Path: /receipts/:id/validate
- Auth: Yes

### 6) Cancel Receipt
- Method: PUT
- Path: /receipts/:id/cancel
- Auth: Yes

### 7) Delete Receipt
- Method: DELETE
- Path: /receipts/:id
- Auth: Yes

---

## Deliveries

### 1) List Deliveries
- Method: GET
- Path: /deliveries
- Auth: Yes

### 2) Create Delivery
- Method: POST
- Path: /deliveries
- Auth: Yes

### 3) Get Delivery
- Method: GET
- Path: /deliveries/:id
- Auth: Yes

### 4) Update Delivery
- Method: PUT
- Path: /deliveries/:id
- Auth: Yes

### 5) Validate Delivery
- Method: PUT
- Path: /deliveries/:id/validate
- Auth: Yes

### 6) Cancel Delivery
- Method: PUT
- Path: /deliveries/:id/cancel
- Auth: Yes

---

## Moves

### 1) Move History
- Method: GET
- Path: /moves
- Auth: Yes
- Query Params:
  - search
  - status
  - type
  - from
  - to
  - page
  - pageSize

---

## Operations

### 1) List Operations
- Method: GET
- Path: /operations
- Auth: Yes
- Description: List operations with dynamic filters
- Query Params:
  - type (RECEIPT, DELIVERY, TRANSFER, ADJUSTMENT)
  - status (DRAFT, WAITING, READY, DONE, CANCELED)
  - locationId
  - category
  - search

### 2) Get Operation by ID
- Method: GET
- Path: /operations/:id
- Auth: Yes
- Description: Full operation details with movements

### 3) Create Receipt (Incoming)
- Method: POST
- Path: /operations/receipts
- Auth: Yes
- Description: Receive goods from vendor (increases stock on validation)
- Body:
```json
{
  "reference": "PO-001",
  "supplier": "ABC Metals",
  "toLocationId": "<location-id>",
  "items": [
    { "productId": "<product-id>", "quantity": 50 }
  ]
}
```

### 4) Create Delivery (Outgoing)
- Method: POST
- Path: /operations/deliveries
- Auth: Yes
- Description: Deliver goods to customer (decreases stock on validation)
- Body:
```json
{
  "reference": "SO-1001",
  "customer": "XYZ Furnitures",
  "fromLocationId": "<location-id>",
  "items": [
    { "productId": "<product-id>", "quantity": 10 }
  ]
}
```

### 5) Create Internal Transfer
- Method: POST
- Path: /operations/transfers
- Auth: Yes
- Description: Move stock between internal locations
- Body:
```json
{
  "reference": "INT-2026-001",
  "fromLocationId": "<source-location-id>",
  "toLocationId": "<destination-location-id>",
  "items": [
    { "productId": "<product-id>", "quantity": 30 }
  ]
}
```

### 6) Create Stock Adjustment
- Method: POST
- Path: /operations/adjustments
- Auth: Yes
- Description: Reconcile counted vs recorded stock
- Body:
```json
{
  "reference": "ADJ-001",
  "locationId": "<location-id>",
  "items": [
    { "productId": "<product-id>", "countedQuantity": 97 }
  ]
}
```

### 7) Update Operation Status
- Method: PATCH
- Path: /operations/:id/status
- Auth: Yes
- Description: Change status manually
- Body:
```json
{
  "status": "READY"
}
```

### 8) Validate Operation
- Method: POST
- Path: /operations/:id/validate
- Auth: Yes
- Description: Finalize operation and apply stock movement

---

## Dashboard

### 1) KPI Snapshot
- Method: GET
- Path: /dashboard/kpis
- Auth: Yes
- Description: Returns all dashboard KPI counters
- Query Params:
  - type
  - status
  - locationId
  - category

### 2) Recent Activity
- Method: GET
- Path: /dashboard/activity
- Auth: Yes
- Description: Fetch recent stock activity
- Query Params:
  - limit

### 3) Dashboard Summary
- Method: GET
- Path: /dashboard/summary
- Auth: Yes
- Query Params:
  - date (today)

### 4) Dashboard Stats (date range)
- Method: GET
- Path: /dashboard/stats
- Auth: Yes
- Query Params:
  - from
  - to

---

## Quick Frontend Integration Notes

1. Call /auth/login and store token.
2. Add Authorization header to all protected endpoints.
3. Use /dashboard/kpis for cards and /dashboard/activity for feed.
4. Use /operations with filters for your operation list screen.
5. Use /inventory/ledger for move history screen.
