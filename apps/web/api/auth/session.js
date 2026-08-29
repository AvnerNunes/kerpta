import {
  supabase,
} from "../_lib/supabase.js";

import {
  getSessionFromRequest,
} from "../_lib/session.js";

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      ["GET"]
    );

    return res.status(405).json({
      success: false,
      error:
        "Método não permitido.",
    });
  }

  try {
    const session =
      getSessionFromRequest(req);

    if (!session?.userId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
      });
    }

    const {
      data: user,
      error: userError,
    } = await supabase
      .from("kerpta_users")
      .select(
        `
          id,
          status,
          plan
        `
      )
      .eq(
        "id",
        session.userId
      )
      .maybeSingle();

    if (
      userError ||
      !user ||
      user.status !== "active"
    ) {
      return res.status(401).json({
        success: false,
        authenticated: false,
      });
    }

    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from(
        "marketplace_connections"
      )
      .select(
        `
          marketplace_user_id,
          account_name,
          status
        `
      )
      .eq(
        "kerpta_user_id",
        user.id
      )
      .eq(
        "marketplace",
        "mercadolivre"
      )
      .eq(
        "status",
        "active"
      )
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Erro ao consultar conexão:",
        connectionError
      );

      return res.status(500).json({
        success: false,
        authenticated: false,
        error:
          "Não foi possível consultar a conexão.",
      });
    }

    if (!connection) {
      return res.status(401).json({
        success: false,
        authenticated: false,
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,

      user: {
        id: user.id,
        plan: user.plan,
      },

      marketplace: {
        name:
          "Mercado Livre",

        userId:
          connection
            .marketplace_user_id,

        accountName:
          connection.account_name,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao validar sessão KERPTA:",
      error
    );

    return res.status(401).json({
      success: false,
      authenticated: false,
    });
  }
}