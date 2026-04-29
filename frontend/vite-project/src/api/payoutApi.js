import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/v1",
});

const M_ID = "11111111-1111-1111-1111-111111111111";

export const createPayout = (amount) => {
  return API.post(
    "/payouts",
    { amount: Math.floor(amount * 100) },
    {
      headers: {
        "x-merchant-id": M_ID,
        "idempotency-key": `key_${Date.now()}`,
      },
    }
  );
};

export const fetchPayouts = () => {
  return API.get("/payouts", {
    headers: {
      "x-merchant-id": M_ID,
    },
  });
};