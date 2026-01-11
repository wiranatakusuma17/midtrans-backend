import { db } from "../lib/firebase";
import { snap } from "../lib/midtrans";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { user_id, order, payment_method } = req.body;

  const orderId = `ORDER-${uuidv4()}`;
  const expiredAt = Date.now() + 60 * 60 * 1000; // 1 jam

  // 1️⃣ Simpan order (pending)
  await db.ref(`orders/${orderId}`).set({
    user_id,
    status: "pending",
    expired_at: expiredAt,
    items: order.items,
    address: order.address,
    shipping: order.shipping,
    summary: order.summary,
    created_at: Date.now(),
  });

  // 2️⃣ Request SNAP
  const snapRes = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: order.summary.grand_total,
    },
    customer_details: {
      first_name: order.address.nama,
      phone: order.address.phone,
    },
    enabled_payments: [payment_method],
  });

  // 3️⃣ Update payment info
  await db.ref(`orders/${orderId}/payment`).set({
    token: snapRes.token,
    redirect_url: snapRes.redirect_url,
  });

  res.json({
    order_id: orderId,
    token: snapRes.token,
    redirect_url: snapRes.redirect_url,
  });
}
