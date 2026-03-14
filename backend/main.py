"""
CoreInventory – FastAPI backend (main_v2.py)
MongoDB-native: all IDs are ObjectId strings throughout.

Run:
    uvicorn main_v2:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import os

# ── MongoDB connection ────────────────────────────────────────────────────────
# Set your real URI here or pass it as the MONGO_URI environment variable.
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://srighnanreddyvnr_db_user:Reddy1108@quizzercluster.tghumhl.mongodb.net/?retryWrites=true&w=majority&appName=QuizzerCluster",
)
client = MongoClient(MONGO_URI)
db = client["coreinventory"]

products_col    = db["products"]
receipts_col    = db["receipts"]
deliveries_col  = db["deliveries"]
adjustments_col = db["adjustments"]
ledger_col      = db["ledger"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def oid(id_str: str) -> ObjectId:
    """Convert a string to ObjectId, raise 422 if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=422, detail=f"Invalid id format: {id_str}")


def serialize(doc: dict) -> dict:
    """
    Replace every ObjectId field with its string representation
    and expose _id as 'id' so the frontend never sees raw ObjectIds.
    """
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out["id" if k == "_id" else k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    # Always ensure 'id' key is present
    if "id" not in out and "_id" in doc:
        out["id"] = str(doc["_id"])
    return out


# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="CoreInventory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ───────────────────────────────────────────────────────────

class ProductIn(BaseModel):
    name: str
    sku: str
    category: str = ""
    unit: str = "pcs"
    stock: float = 0
    reorder_level: float = 10


class ReceiptIn(BaseModel):
    supplier: str
    product_id: str          # MongoDB _id string
    quantity: float


class DeliveryIn(BaseModel):
    customer: str
    product_id: str          # MongoDB _id string
    quantity: float


class AdjustmentIn(BaseModel):
    product_id: str          # MongoDB _id string
    new_qty: float
    reason: str


# ── Ledger helper ─────────────────────────────────────────────────────────────

def log_movement(product_id: str, product_name: str, operation: str,
                 quantity_change: float, note: str = ""):
    ledger_col.insert_one({
        "product_id":       product_id,
        "product_name":     product_name,
        "operation":        operation,
        "quantity_change":  quantity_change,
        "note":             note,
        "created_at":       datetime.utcnow(),
    })


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def get_dashboard():
    all_products = list(products_col.find())
    low_stock    = [p for p in all_products if 0 < p["stock"] <= p["reorder_level"]]
    out_of_stock = [p for p in all_products if p["stock"] == 0]

    return {
        "total_products":     len(all_products),
        "low_stock_count":    len(low_stock),
        "out_of_stock_count": len(out_of_stock),
        "pending_receipts":   receipts_col.count_documents({"status": "Pending"}),
        "pending_deliveries": deliveries_col.count_documents({"status": "Pending"}),
        "low_stock_items": [
            {
                "id":            str(p["_id"]),
                "name":          p["name"],
                "sku":           p.get("sku", ""),
                "unit":          p.get("unit", "pcs"),
                "stock":         p["stock"],
                "reorder_level": p["reorder_level"],
            }
            for p in low_stock
        ],
    }


# ── Products ──────────────────────────────────────────────────────────────────

@app.get("/products")
def list_products():
    return [serialize(p) for p in products_col.find()]


@app.post("/products", status_code=201)
def create_product(data: ProductIn):
    doc = data.dict()
    doc["created_at"] = datetime.utcnow()
    result = products_col.insert_one(doc)
    return {"id": str(result.inserted_id)}


@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    result = products_col.delete_one({"_id": oid(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": product_id}


# ── Receipts ──────────────────────────────────────────────────────────────────

@app.get("/receipts")
def list_receipts():
    receipts = []
    for r in receipts_col.find():
        s = serialize(r)
        # Attach product name for display
        prod = products_col.find_one({"_id": oid(r["product_id"])})
        s["product_name"] = prod["name"] if prod else r["product_id"]
        receipts.append(s)
    return receipts


@app.post("/receipts", status_code=201)
def create_receipt(data: ReceiptIn):
    # Verify product exists
    prod = products_col.find_one({"_id": oid(data.product_id)})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    doc = {
        "supplier":   data.supplier,
        "product_id": data.product_id,   # store as plain string
        "quantity":   data.quantity,
        "status":     "Pending",
        "created_at": datetime.utcnow(),
    }
    result = receipts_col.insert_one(doc)
    return {"id": str(result.inserted_id)}


@app.post("/receipts/{receipt_id}/validate")
def validate_receipt(receipt_id: str):
    receipt = receipts_col.find_one({"_id": oid(receipt_id)})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    if receipt["status"] == "Done":
        raise HTTPException(status_code=400, detail="Receipt already validated")

    prod = products_col.find_one({"_id": oid(receipt["product_id"])})
    if not prod:
        raise HTTPException(status_code=404, detail="Associated product not found")

    # Increase stock
    products_col.update_one(
        {"_id": oid(receipt["product_id"])},
        {"$inc": {"stock": receipt["quantity"]}},
    )
    receipts_col.update_one(
        {"_id": oid(receipt_id)},
        {"$set": {"status": "Done", "validated_at": datetime.utcnow()}},
    )
    log_movement(
        receipt["product_id"], prod["name"],
        "receipt", receipt["quantity"],
        f"Receipt from {receipt['supplier']} validated",
    )
    return {"status": "Done"}


# ── Deliveries ────────────────────────────────────────────────────────────────

@app.get("/deliveries")
def list_deliveries():
    deliveries = []
    for d in deliveries_col.find():
        s = serialize(d)
        prod = products_col.find_one({"_id": oid(d["product_id"])})
        s["product_name"] = prod["name"] if prod else d["product_id"]
        deliveries.append(s)
    return deliveries


@app.post("/deliveries", status_code=201)
def create_delivery(data: DeliveryIn):
    prod = products_col.find_one({"_id": oid(data.product_id)})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    doc = {
        "customer":   data.customer,
        "product_id": data.product_id,
        "quantity":   data.quantity,
        "status":     "Pending",
        "created_at": datetime.utcnow(),
    }
    result = deliveries_col.insert_one(doc)
    return {"id": str(result.inserted_id)}


@app.post("/deliveries/{delivery_id}/validate")
def validate_delivery(delivery_id: str):
    delivery = deliveries_col.find_one({"_id": oid(delivery_id)})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    if delivery["status"] == "Done":
        raise HTTPException(status_code=400, detail="Delivery already validated")

    prod = products_col.find_one({"_id": oid(delivery["product_id"])})
    if not prod:
        raise HTTPException(status_code=404, detail="Associated product not found")
    if prod["stock"] < delivery["quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {prod['stock']}, required: {delivery['quantity']}",
        )

    # Decrease stock
    products_col.update_one(
        {"_id": oid(delivery["product_id"])},
        {"$inc": {"stock": -delivery["quantity"]}},
    )
    deliveries_col.update_one(
        {"_id": oid(delivery_id)},
        {"$set": {"status": "Done", "validated_at": datetime.utcnow()}},
    )
    log_movement(
        delivery["product_id"], prod["name"],
        "delivery", -delivery["quantity"],
        f"Delivery to {delivery['customer']} validated",
    )
    return {"status": "Done"}


# ── Adjustments ───────────────────────────────────────────────────────────────

@app.get("/adjustments")
def list_adjustments():
    result = []
    for a in adjustments_col.find():
        s = serialize(a)
        prod = products_col.find_one({"_id": oid(a["product_id"])})
        s["product_name"] = prod["name"] if prod else a["product_id"]
        result.append(s)
    return result


@app.post("/adjustments", status_code=201)
def create_adjustment(data: AdjustmentIn):
    prod = products_col.find_one({"_id": oid(data.product_id)})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    old_qty = prod["stock"]
    change  = data.new_qty - old_qty

    products_col.update_one(
        {"_id": oid(data.product_id)},
        {"$set": {"stock": data.new_qty}},
    )
    doc = {
        "product_id": data.product_id,
        "old_qty":    old_qty,
        "new_qty":    data.new_qty,
        "reason":     data.reason,
        "created_at": datetime.utcnow(),
    }
    result = adjustments_col.insert_one(doc)

    log_movement(
        data.product_id, prod["name"],
        "adjustment", change,
        f"Adjustment: {data.reason}",
    )
    return {"id": str(result.inserted_id)}


# ── Ledger ────────────────────────────────────────────────────────────────────

@app.get("/ledger")
def get_ledger():
    return [serialize(l) for l in ledger_col.find().sort("created_at", -1)]