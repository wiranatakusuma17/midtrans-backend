import { db } from "../lib/firebase";
import crypto from "crypto";

export default async function handler(req, res) {
  const {
    order_id,
    transaction_status,
    status_code,
    gross_amount,
    signature_key,
  } = req.body;

  const expectedSignature = crypto
    .createHash("sha512")
    .update(
      order_id +
        status_code +
        gross_amount +
        process.env.MIDTRANS_SERVER_KEY
    )
    .digest("hex");

  if (signature_key !== expectedSignature) {
    return res.status(403).json({ message: "Invalid signature" });
  }

  let status = "pending";
  if (transaction_status === "settlement") status = "paid";
  if (transaction_status === "expire") status = "expired";
  if (transaction_status === "cancel") status = "cancelled";

  await db.ref(`orders/${order_id}`).update({
    status,
    updated_at: Date.now(),
  });

  res.json({ received: true });
}
