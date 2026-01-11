import midtransClient from "midtrans-client";

export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "fasle",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
});
