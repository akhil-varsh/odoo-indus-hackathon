# CoreInventory Backend API (Plug-and-Play)

Base URL: `http://localhost:5000/api`

## 1) Local Setup (PostgreSQL)

1. Create DB: `coreinventory` in local PostgreSQL.
2. Configure env in `backend/.env`.
3. Run:
   - `npm install`
   - `npm run prisma:migrate`
   - `npm run prisma:generate`
   - `npm run dev`

Health check: `GET /api/health`

## 2) Auth

### Signup
`POST /api/auth/signup`
```json
{
  "name": "Akhil",
  "email": "akhil@example.com",
  "password": "StrongPass123",
  "role": "INVENTORY_MANAGER"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "akhil@example.com",
  "password": "StrongPass123"
}
```
Response includes `token` and `user`.

### My Profile
`GET /api/auth/me`
Header: `Authorization: Bearer <token>`

### OTP Password Reset (Demo)
1. `POST /api/auth/password-reset/request-otp`
```json
{ "email": "akhil@example.com" }
```
2. `POST /api/auth/password-reset/verify-otp`
```json
{
  "email": "akhil@example.com",
  "otp": "123456",
  "newPassword": "NewStrongPass123"
}
```

## 3) Products
All routes below require bearer token.

### List/Search Products
`GET /api/products?search=steel&category=Raw%20Material&sku=ST-001`

### Create Product
`POST /api/products`
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

### Update Product
`PUT /api/products/:id`

### Product Availability per Location
`GET /api/products/:id/availability`

## 4) Inventory
All routes below require bearer token.

### Locations (Warehouse/Rack/Virtual)
- `GET /api/inventory/locations?type=INTERNAL`
- `POST /api/inventory/locations`
```json
{ "name": "Main Warehouse", "type": "INTERNAL" }
```

### Stock Levels
`GET /api/inventory/levels?locationId=<id>&category=Raw%20Material&search=steel`

### Stock Ledger / Move History
`GET /api/inventory/ledger?type=TRANSFER&status=DONE&locationId=<id>`

### Low Stock Alerts
`GET /api/inventory/alerts/low-stock`

## 5) Operations
All routes below require bearer token.

### List Operations (dynamic filters)
`GET /api/operations?type=RECEIPT&status=READY&locationId=<id>&category=Raw%20Material&search=PO-001`

### Get Operation
`GET /api/operations/:id`

### Create Receipt (incoming)
`POST /api/operations/receipts`
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

### Create Delivery (outgoing)
`POST /api/operations/deliveries`
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

### Create Internal Transfer
`POST /api/operations/transfers`
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

### Create Stock Adjustment
`POST /api/operations/adjustments`
```json
{
  "reference": "ADJ-001",
  "locationId": "<location-id>",
  "items": [
    { "productId": "<product-id>", "countedQuantity": 97 }
  ]
}
```

### Update Operation Status
`PATCH /api/operations/:id/status`
```json
{ "status": "READY" }
```

### Validate Operation (applies stock mutation)
`POST /api/operations/:id/validate`

## 6) Dashboard
All routes below require bearer token.

### KPI Snapshot
`GET /api/dashboard/kpis?type=RECEIPT&status=READY&locationId=<id>&category=Raw%20Material`

Returns:
- `totalProductsInStock`
- `lowStockItems`
- `outOfStockItems`
- `pendingReceipts`
- `pendingDeliveries`
- `internalTransfersScheduled`

### Recent Activity
`GET /api/dashboard/activity?limit=20`

## 7) Frontend Integration Quick Notes

1. Login first and store JWT token.
2. Send header for protected routes:
   - `Authorization: Bearer <token>`
3. Dashboard page:
   - KPIs: `/api/dashboard/kpis`
   - recent list: `/api/dashboard/activity`
4. Operations list with filters:
   - `/api/operations` query params map directly to your filter UI.
