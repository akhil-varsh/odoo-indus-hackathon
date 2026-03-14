# Postman Quickstart - CoreInventory Backend

## 1) Import Files

Import both files into Postman:
- CoreInventory.postman_collection.json
- CoreInventory.postman_environment.json

## 2) Select Environment

In Postman, select:
- CoreInventory Environment

Confirm `baseUrl` points to your current ngrok URL.

## 3) Run Order (Recommended)

1. Health -> Health Check
2. Auth -> Signup
3. Auth -> Login
   - This auto-saves `token` and `userId` in collection variables.
4. Inventory -> Create Location
   - This auto-saves `locationId`.
5. Products -> Create Product
   - This auto-saves `productId`.
6. Operations -> Create Receipt
   - This auto-saves `operationId`.
7. Operations -> Validate Operation
8. Dashboard -> KPI Snapshot
9. Dashboard -> Recent Activity
10. Inventory -> Stock Ledger

## 4) Protected Route Requirement

All protected endpoints require:
- Header: `Authorization: Bearer {{token}}`

The collection already includes this header where needed.

## 5) Common Issues

1. 401 Unauthorized
- Run Login again.
- Confirm `token` variable is populated.

2. 404 / Tunnel Error
- ngrok URL changed.
- Update `baseUrl` in the environment.

3. 500 Database Error
- Ensure backend is running.
- Ensure PostgreSQL is running.
- Confirm `DATABASE_URL` in backend `.env` is correct.

## 6) Shareable Setup for Frontend Team

Send these 3 files to your teammates:
- FULL_ENDPOINTS.md
- CoreInventory.postman_collection.json
- CoreInventory.postman_environment.json

They can import and start testing immediately.
