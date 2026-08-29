import {
  calculateIdealCost,
} from "@kerpta/core";

import {
  getSessionFromRequest,
} from "../_lib/session.js";

export default function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      ["POST"]
    );

    return res.status(405).json({
      success: false,
      error:
        "Método não permitido.",
    });
  }

  const session =
    getSessionFromRequest(req);

  if (!session?.userId) {
    return res.status(401).json({
      success: false,
      error:
        "Sessão inválida ou expirada.",
    });
  }

  try {
    const {
      referencePrice,
      marketplaceCosts = 0,
      freightCost = 0,
      taxPercent = 0,
      otherCosts = 0,
    } = req.body ?? {};

    const result =
      calculateIdealCost({
        referencePrice,
        marketplaceCosts,
        freightCost,
        taxPercent,
        otherCosts,
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,

      error:
        error.message ||
        "Não foi possível calcular o custo ideal.",
    });
  }
}