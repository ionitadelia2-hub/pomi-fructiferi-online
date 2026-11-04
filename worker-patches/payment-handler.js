// Inserted into the complete Worker; no changes to checkout or customer notes.
async function handleAdminPaymentStatus(request, env, url, corsHeaders) {
  const reply = (data, status = 200) => jsonResponse(data, status, {
    ...corsHeaders, "Cache-Control": "no-store",
  });
  if (!env.ADMIN_TOKEN || request.headers.get("Authorization") !== `Bearer ${env.ADMIN_TOKEN}`) {
    return reply({ success: false, error: "Acces neautorizat." }, 401);
  }
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return reply({ success: false, error: "Origine nepermisă." }, 403);
  }
  const match = url.pathname.match(/^\/api\/admin\/orders\/(\d+)\/payment-status$/);
  const reading = url.pathname === "/api/admin/orders/payment-status" && request.method === "GET";
  const saving = Boolean(match) && request.method === "POST";
  if (!reading && !saving) return reply({ success: false, error: "Metodă nepermisă." }, 405);
  let ids, body, id;
  if (reading) {
    const values = (url.searchParams.get("ids") || "").split(",");
    if (values.length > 25 || values.some(v => !/^[1-9]\d*$/.test(v) || !Number.isSafeInteger(Number(v)))) {
      return reply({ success: false, error: "Lista comenzilor nu este validă." }, 400);
    }
    ids = [...new Set(values.map(Number))];
  } else {
    id = Number(match[1]);
    if (!Number.isSafeInteger(id) || id < 1) return reply({ success: false, error: "Comandă invalidă." }, 400);
    try { body = await request.json(); } catch { return reply({ success: false, error: "Date invalide." }, 400); }
    if (!body || typeof body.paid_in_account !== "boolean" ||
        !Number.isSafeInteger(body.expected_revision) || body.expected_revision < 0 ||
        (body.paid_in_account && (typeof body.confirmed_total !== "number" || !Number.isFinite(body.confirmed_total)))) {
      return reply({ success: false, error: "Confirmarea plății nu este validă." }, 400);
    }
  }
  try {
    // Additive migration: leaves all existing orders and customer notes untouched.
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS order_payment_status (
      order_id INTEGER PRIMARY KEY,
      paid_in_account INTEGER NOT NULL DEFAULT 0 CHECK (paid_in_account IN (0,1)),
      paid_total REAL NOT NULL DEFAULT 0,
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )`).run();
    if (saving) {
      const order = await env.DB.prepare("SELECT id, total FROM orders WHERE id = ?").bind(id).first();
      if (!order) return reply({ success: false, error: "Comanda nu există." }, 404);
      const total = Number(order.total);
      if (!Number.isFinite(total) || total < 0) return reply({ success: false, error: "Totalul comenzii nu este valid." }, 409);
      if (body.paid_in_account && Math.round(body.confirmed_total * 100) !== Math.round(total * 100)) {
        return reply({ success: false, error: "Totalul comenzii s-a modificat. Reîncarcă și verifică încasarea." }, 409);
      }
      const result = await env.DB.prepare(`INSERT INTO order_payment_status
        (order_id, paid_in_account, paid_total, revision, updated_at)
        SELECT ?, ?, ?, 1, ? WHERE ? = 0 OR EXISTS (
          SELECT 1 FROM order_payment_status WHERE order_id = ? AND revision = ?
        )
        ON CONFLICT(order_id) DO UPDATE SET
          paid_in_account = excluded.paid_in_account, paid_total = excluded.paid_total,
          revision = order_payment_status.revision + 1, updated_at = excluded.updated_at
        WHERE order_payment_status.revision = ?`).bind(
          id, body.paid_in_account ? 1 : 0, body.paid_in_account ? total : 0,
          new Date().toISOString(), body.expected_revision, id, body.expected_revision, body.expected_revision
        ).run();
      if (!result.meta?.changes) return reply({ success: false, error: "Plata a fost modificată între timp. Reîncarcă comenzile înainte de a salva." }, 409);
      ids = [id];
    }
    const result = await env.DB.prepare(`SELECT o.id AS order_id, o.total,
      COALESCE(p.paid_in_account, 0) AS paid_in_account, COALESCE(p.paid_total, 0) AS paid_total,
      COALESCE(p.revision, 0) AS revision, p.updated_at
      FROM orders o LEFT JOIN order_payment_status p ON p.order_id = o.id
      WHERE o.id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all();
    const payments = result.results.map(row => {
      const total = Number(row.total), paidTotal = Number(row.paid_total);
      const totalChanged = Boolean(row.paid_in_account) && Math.round(total * 100) !== Math.round(paidTotal * 100);
      const paid = Boolean(row.paid_in_account) && !totalChanged;
      return { order_id: Number(row.order_id), paid_in_account: paid, paid_total: paidTotal,
        total, total_changed: totalChanged, revision: Number(row.revision), updated_at: row.updated_at,
        cod_amount: totalChanged ? null : paid ? 0 : total };
    });
    return reply({ success: true, payment_api_version: 1, payments });
  } catch {
    return reply({ success: false, error: "Plata nu a putut fi citită sau salvată. Reîncearcă; nu seta ramburs 0 fără verificare." }, 500);
  }
}
