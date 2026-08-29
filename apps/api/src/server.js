import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { calculateIdealCost } from "../../../packages/core/src/calculateIdealCost.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    application: "KERPTA API",
  });
});

app.post("/analysis/calculate", (req, res) => {
  try {
    const {
      referencePrice,
      marketplaceCosts = 0,
      freightCost = 0,
      taxPercent = 0,
      otherCosts = 0,
    } = req.body;

    const result = calculateIdealCost({
      referencePrice,
      marketplaceCosts,
      freightCost,
      taxPercent,
      otherCosts,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`KERPTA API rodando na porta ${PORT}`);
});