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

  try {
    const session =
      getSessionFromRequest(req);

    if (!session?.userId) {
      return res.status(401).json({
        success: false,
        error:
          "Sessão inválida ou expirada.",
      });
    }

    const {
      data: user,
      error,
    } = await supabase
      .from("kerpta_users")
      .update({
        onboarding_completed:
          true,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        session.userId
      )
      .eq(
        "status",
        "active"
      )
      .select(
        `
          id,
          plan,
          onboarding_completed
        `
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao concluir onboarding:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Não foi possível concluir o primeiro acesso.",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error:
          "Usuário não encontrado ou inativo.",
      });
    }

    return res.status(200).json({
      success: true,

      user: {
        id:
          user.id,

        plan:
          user.plan,

        onboardingCompleted:
          Boolean(
            user.onboarding_completed
          ),
      },
    });
  } catch (error) {
    console.error(
      "Erro no onboarding KERPTA:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Não foi possível concluir o primeiro acesso.",
    });
  }
}