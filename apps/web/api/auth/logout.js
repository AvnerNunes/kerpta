import {
  clearSessionCookie,
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

  res.setHeader(
    "Set-Cookie",
    clearSessionCookie()
  );

  return res.status(200).json({
    success: true,
  });
}