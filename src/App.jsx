import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const styles = {
  sidebar: {
    width: 220,
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    minHeight: "100vh",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #334155",
  },
  logo: {
    color: "#38bdf8",
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: 1,
  },
  logoSub: {
    color: "#475569",
    fontSize: 11,
    marginBottom: 32,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  navItem: (active) => ({
    color: active ? "#ffffff" : "#64748b",
    padding: "10px 14px",
    cursor: "pointer",
    borderRadius: 8,
    marginBottom: 4,
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    background: active ? "#1d4ed8" : "transparent",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 10,
  }),
  main: {
    flex: 1,
    padding: "32px 36px",
    background: "#0f172a",
    minHeight: "100vh",
    overflowY: "auto",
  },
  pageTitle: {
    color: "#f1f5f9",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: "#475569",
    fontSize: 13,
    marginBottom: 28,
  },
  card: {
    background: "#1e293b",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #334155",
  },
  kpiCard: (color) => ({
    background: "#1e293b",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #334155",
    borderLeft: `4px solid ${color}`,
    minWidth: 160,
    flex: 1,
  }),
  kpiValue: (color) => ({
    color: color,
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 8,
  }),
  kpiLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 500,
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
    minWidth: 130,
  },
  // Styled the same as input so the dropdown blends naturally
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
    minWidth: 220,
    cursor: "pointer",
  },
  btn: (color = "#2563eb") => ({
    padding: "9px 20px",
    background: color,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    color: "white",
    transition: "opacity 0.15s",
  }),
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    color: "#475569",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottom: "1px solid #334155",
  },
  td: {
    padding: "13px 16px",
    color: "#cbd5e1",
    borderBottom: "1px solid #1e293b",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: color + "22",
    color: color,
  }),
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 0,
  },
  errorMsg: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 0,
  },
};

const navLinks = [
  { name: "Dashboard",   icon: "▦" },
  { name: "Products",    icon: "⊞" },
  { name: "Receipts",    icon: "↓" },
  { name: "Deliveries",  icon: "↑" },
  { name: "Adjustments", icon: "⇄" },
  { name: "Ledger",      icon: "≡" },
];

// ── Shared hook: loads products list once per page mount ─────────────────────
function useProducts() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API}/products`).then(r => setProducts(r.data));
  }, []);
  return products;
}

// ── Reusable product <select> ─────────────────────────────────────────────────
// value = MongoDB _id string (e.g. "69b4f1eb66c1703e482b2dba")
function ProductSelect({ value, onChange }) {
  const products = useProducts();
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={styles.select}>
      <option value="">— Select Product —</option>
      {products.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}  ({p.sku})  ·  stock: {p.stock} {p.unit}
        </option>
      ))}
    </select>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>CoreInventory</div>
      <div style={styles.logoSub}>IMS Platform</div>
      <p style={styles.sectionTitle}>Menu</p>
      {navLinks.map(l => (
        <div key={l.name} onClick={() => setPage(l.name)} style={styles.navItem(page === l.name)}>
          <span style={{ fontSize: 16 }}>{l.icon}</span>
          {l.name}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ color: "#334155", fontSize: 11, textAlign: "center", paddingTop: 16, borderTop: "1px solid #1e293b" }}>
        CoreInventory v1.0
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { axios.get(`${API}/dashboard`).then(r => setData(r.data)); }, []);
  if (!data) return <p style={{ color: "#475569" }}>Loading...</p>;

  const kpis = [
    { label: "Total Products",     value: data.total_products,     color: "#38bdf8" },
    { label: "Low Stock",          value: data.low_stock_count,    color: "#facc15" },
    { label: "Out of Stock",       value: data.out_of_stock_count, color: "#f87171" },
    { label: "Pending Receipts",   value: data.pending_receipts,   color: "#a78bfa" },
    { label: "Pending Deliveries", value: data.pending_deliveries, color: "#fb923c" },
  ];

  return (
    <div>
      <div style={styles.pageTitle}>Dashboard</div>
      <div style={styles.pageSubtitle}>Real-time overview of your inventory operations</div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={styles.kpiCard(k.color)}>
            <div style={styles.kpiValue(k.color)}>{k.value}</div>
            <div style={styles.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {data.low_stock_items.length > 0 ? (
        <div style={styles.card}>
          <p style={{ ...styles.sectionTitle, color: "#facc15" }}>⚠ Low Stock Alerts</p>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Product Name", "SKU", "Current Stock", "Reorder Level"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.low_stock_items.map(p => (
                <tr key={p.id}>
                  <td style={{ ...styles.td, fontWeight: 600, color: "#f1f5f9" }}>{p.name}</td>
                  <td style={styles.td}><span style={styles.badge("#38bdf8")}>{p.sku}</span></td>
                  <td style={styles.td}><span style={styles.badge("#facc15")}>{p.stock} {p.unit}</span></td>
                  <td style={styles.td}>{p.reorder_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <div style={{ color: "#4ade80", fontWeight: 600 }}>All stock levels are healthy</div>
          <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>No low stock alerts at this time</div>
        </div>
      )}
    </div>
  );
}

// ── Products ─────────────────────────────────────────────────────────────────
function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", sku: "", category: "", unit: "", stock: 0, reorder_level: 10 });

  const load = () => axios.get(`${API}/products`).then(r => setProducts(r.data));
  useEffect(() => { load(); }, []);

  const submit = () => {
    if (!form.name || !form.sku) return;
    axios.post(`${API}/products`, form).then(() => {
      load();
      setForm({ name: "", sku: "", category: "", unit: "", stock: 0, reorder_level: 10 });
    });
  };

  const del = (id) => {
    if (!window.confirm("Delete this product?")) return;
    axios.delete(`${API}/products/${id}`).then(load);
  };

  return (
    <div>
      <div style={styles.pageTitle}>Products</div>
      <div style={styles.pageSubtitle}>Manage your product catalog and stock levels</div>

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <p style={styles.sectionTitle}>Add New Product</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["name", "Product Name"], ["sku", "SKU / Code"], ["category", "Category"], ["unit", "Unit (kg, pcs...)"]].map(([f, ph]) => (
            <input key={f} placeholder={ph} value={form[f]}
              onChange={e => setForm({ ...form, [f]: e.target.value })}
              style={styles.input} />
          ))}
          <input type="number" placeholder="Initial Stock" value={form.stock}
            onChange={e => setForm({ ...form, stock: parseFloat(e.target.value) || 0 })}
            style={{ ...styles.input, width: 120 }} />
          <input type="number" placeholder="Reorder Level" value={form.reorder_level}
            onChange={e => setForm({ ...form, reorder_level: parseFloat(e.target.value) || 0 })}
            style={{ ...styles.input, width: 120 }} />
          <button onClick={submit} style={styles.btn("#2563eb")}>+ Add Product</button>
        </div>
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Product List ({products.length})</p>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Name", "SKU", "Category", "Unit", "Stock", "Reorder Level", "Action"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ ...styles.td, fontWeight: 600, color: "#f1f5f9" }}>{p.name}</td>
                <td style={styles.td}><span style={styles.badge("#38bdf8")}>{p.sku}</span></td>
                <td style={styles.td}>{p.category}</td>
                <td style={styles.td}>{p.unit}</td>
                <td style={styles.td}>
                  <span style={styles.badge(
                    p.stock === 0 ? "#f87171" :
                    p.stock <= p.reorder_level ? "#facc15" : "#4ade80"
                  )}>
                    {p.stock}
                  </span>
                </td>
                <td style={styles.td}>{p.reorder_level}</td>
                <td style={styles.td}>
                  <button onClick={() => del(p.id)} style={styles.btn("#dc2626")}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#475569", padding: 32 }}>
                  No products yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Receipts ─────────────────────────────────────────────────────────────────
function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [form, setForm]         = useState({ supplier: "", product_id: "", quantity: "" });
  const [error, setError]       = useState("");

  const load = () => axios.get(`${API}/receipts`).then(r => setReceipts(r.data));
  useEffect(() => { load(); }, []);

  const submit = () => {
    setError("");
    if (!form.supplier || !form.product_id || !form.quantity) {
      setError("Please fill in all fields and select a product.");
      return;
    }
    axios.post(`${API}/receipts`, {
      supplier:   form.supplier,
      product_id: form.product_id,          // MongoDB _id string, no conversion needed
      quantity:   parseFloat(form.quantity),
    })
      .then(() => { load(); setForm({ supplier: "", product_id: "", quantity: "" }); })
      .catch(e  => setError(e.response?.data?.detail || "Failed to create receipt."));
  };

  const validate = (id) =>
    axios.post(`${API}/receipts/${id}/validate`)
      .then(load)
      .catch(e => alert(e.response?.data?.detail || "Validation failed."));

  return (
    <div>
      <div style={styles.pageTitle}>Receipts</div>
      <div style={styles.pageSubtitle}>Incoming stock from vendors — validate to increase stock</div>

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <p style={styles.sectionTitle}>New Receipt</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Supplier Name" value={form.supplier}
            onChange={e => setForm({ ...form, supplier: e.target.value })}
            style={styles.input} />
          <ProductSelect value={form.product_id} onChange={v => setForm({ ...form, product_id: v })} />
          <input type="number" placeholder="Quantity" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            style={{ ...styles.input, width: 110 }} />
          <button onClick={submit} style={styles.btn("#2563eb")}>Create Receipt</button>
        </div>
        {error && <p style={styles.errorMsg}>⚠ {error}</p>}
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>All Receipts ({receipts.length})</p>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Supplier", "Product", "Quantity", "Status", "Action"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id}>
                <td style={{ ...styles.td, fontWeight: 500, color: "#f1f5f9" }}>{r.supplier}</td>
                <td style={styles.td}>{r.product_name || r.product_id}</td>
                <td style={styles.td}>{r.quantity}</td>
                <td style={styles.td}>
                  <span style={styles.badge(r.status === "Done" ? "#4ade80" : "#facc15")}>{r.status}</span>
                </td>
                <td style={styles.td}>
                  {r.status !== "Done" && (
                    <button onClick={() => validate(r.id)} style={styles.btn("#16a34a")}>✓ Validate</button>
                  )}
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#475569", padding: 32 }}>
                  No receipts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Deliveries ───────────────────────────────────────────────────────────────
function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm]             = useState({ customer: "", product_id: "", quantity: "" });
  const [error, setError]           = useState("");

  const load = () => axios.get(`${API}/deliveries`).then(r => setDeliveries(r.data));
  useEffect(() => { load(); }, []);

  const submit = () => {
    setError("");
    if (!form.customer || !form.product_id || !form.quantity) {
      setError("Please fill in all fields and select a product.");
      return;
    }
    axios.post(`${API}/deliveries`, {
      customer:   form.customer,
      product_id: form.product_id,          // MongoDB _id string, no conversion needed
      quantity:   parseFloat(form.quantity),
    })
      .then(() => { load(); setForm({ customer: "", product_id: "", quantity: "" }); })
      .catch(e  => setError(e.response?.data?.detail || "Failed to create delivery."));
  };

  const validate = (id) =>
    axios.post(`${API}/deliveries/${id}/validate`)
      .then(load)
      .catch(e => alert(e.response?.data?.detail || "Validation failed."));

  return (
    <div>
      <div style={styles.pageTitle}>Delivery Orders</div>
      <div style={styles.pageSubtitle}>Outgoing stock to customers — validate to decrease stock</div>

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <p style={styles.sectionTitle}>New Delivery Order</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Customer Name" value={form.customer}
            onChange={e => setForm({ ...form, customer: e.target.value })}
            style={styles.input} />
          <ProductSelect value={form.product_id} onChange={v => setForm({ ...form, product_id: v })} />
          <input type="number" placeholder="Quantity" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            style={{ ...styles.input, width: 110 }} />
          <button onClick={submit} style={styles.btn("#2563eb")}>Create Order</button>
        </div>
        {error && <p style={styles.errorMsg}>⚠ {error}</p>}
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>All Deliveries ({deliveries.length})</p>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Customer", "Product", "Quantity", "Status", "Action"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => (
              <tr key={d.id}>
                <td style={{ ...styles.td, fontWeight: 500, color: "#f1f5f9" }}>{d.customer}</td>
                <td style={styles.td}>{d.product_name || d.product_id}</td>
                <td style={styles.td}>{d.quantity}</td>
                <td style={styles.td}>
                  <span style={styles.badge(d.status === "Done" ? "#4ade80" : "#facc15")}>{d.status}</span>
                </td>
                <td style={styles.td}>
                  {d.status !== "Done" && (
                    <button onClick={() => validate(d.id)} style={styles.btn("#16a34a")}>✓ Validate</button>
                  )}
                </td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#475569", padding: 32 }}>
                  No delivery orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Adjustments ──────────────────────────────────────────────────────────────
function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm]               = useState({ product_id: "", new_qty: "", reason: "" });
  const [error, setError]             = useState("");

  const load = () => axios.get(`${API}/adjustments`).then(r => setAdjustments(r.data));
  useEffect(() => { load(); }, []);

  const submit = () => {
    setError("");
    if (!form.product_id || !form.new_qty || !form.reason) {
      setError("Please fill in all fields and select a product.");
      return;
    }
    axios.post(`${API}/adjustments`, {
      product_id: form.product_id,          // MongoDB _id string, no conversion needed
      new_qty:    parseFloat(form.new_qty),
      reason:     form.reason,
    })
      .then(() => { load(); setForm({ product_id: "", new_qty: "", reason: "" }); })
      .catch(e  => setError(e.response?.data?.detail || "Failed to apply adjustment."));
  };

  return (
    <div>
      <div style={styles.pageTitle}>Stock Adjustments</div>
      <div style={styles.pageSubtitle}>Fix discrepancies between recorded and physical stock</div>

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <p style={styles.sectionTitle}>New Adjustment</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <ProductSelect value={form.product_id} onChange={v => setForm({ ...form, product_id: v })} />
          <input type="number" placeholder="Actual Quantity" value={form.new_qty}
            onChange={e => setForm({ ...form, new_qty: e.target.value })}
            style={{ ...styles.input, width: 140 }} />
          <input placeholder="Reason (e.g. damaged, recount)" value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            style={{ ...styles.input, minWidth: 240 }} />
          <button onClick={submit} style={styles.btn("#d97706")}>Apply Adjustment</button>
        </div>
        {error && <p style={styles.errorMsg}>⚠ {error}</p>}
      </div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>Adjustment History ({adjustments.length})</p>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Product", "Old Qty", "New Qty", "Change", "Reason", "Date"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjustments.map(a => {
              const change = a.new_qty - a.old_qty;
              return (
                <tr key={a.id}>
                  <td style={{ ...styles.td, color: "#f1f5f9", fontWeight: 500 }}>
                    {a.product_name || a.product_id}
                  </td>
                  <td style={styles.td}>{a.old_qty}</td>
                  <td style={styles.td}>{a.new_qty}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(change >= 0 ? "#4ade80" : "#f87171")}>
                      {change > 0 ? "+" : ""}{change}
                    </span>
                  </td>
                  <td style={styles.td}>{a.reason}</td>
                  <td style={{ ...styles.td, color: "#475569", fontSize: 12 }}>
                    {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#475569", padding: 32 }}>
                  No adjustments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ledger ───────────────────────────────────────────────────────────────────
function Ledger() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { axios.get(`${API}/ledger`).then(r => setLogs(r.data)); }, []);

  const opColor = {
    receipt:    "#4ade80",
    delivery:   "#f87171",
    adjustment: "#facc15",
    transfer:   "#a78bfa",
  };

  return (
    <div>
      <div style={styles.pageTitle}>Stock Ledger</div>
      <div style={styles.pageSubtitle}>Complete history of all stock movements</div>

      <div style={styles.card}>
        <p style={styles.sectionTitle}>All Movements ({logs.length})</p>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Product", "Operation", "Qty Change", "Note", "Timestamp"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ ...styles.td, color: "#f1f5f9", fontWeight: 500 }}>
                  {l.product_name || l.product_id}
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(opColor[l.operation] || "#94a3b8")}>{l.operation}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: l.quantity_change >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                    {l.quantity_change > 0 ? "+" : ""}{l.quantity_change}
                  </span>
                </td>
                <td style={styles.td}>{l.note}</td>
                <td style={{ ...styles.td, color: "#475569", fontSize: 12 }}>
                  {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#475569", padding: 32 }}>
                  No movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Dashboard");
  const pages = { Dashboard, Products, Receipts, Deliveries, Adjustments, Ledger };
  const Page = pages[page];
  return (
    <div style={{
      display: "flex",
      background: "#0f172a",
      color: "white",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={styles.main}>
        <Page />
      </div>
    </div>
  );
}