import type { RequestHandler } from "express";
import type { ResolvedIdpClientConfig } from "../types";
import { revokeToken } from "../httpClient";

// GET /auth/logout (OS 07, secao 3.3): revoga o refresh_token no IdP
// (best-effort - se o IdP estiver fora, a sessao local e encerrada do
// mesmo jeito) e destroi a sessao local do sistema cliente.
export function createLogoutHandler(config: ResolvedIdpClientConfig): RequestHandler {
  return async (req, res) => {
    const stored = req.session.idpAuth;
    if (stored) {
      try {
        await revokeToken(config, stored.refreshToken);
      } catch {
        // Best-effort de proposito - nunca bloqueia o logout local.
      }
    }

    req.session.destroy(() => {
      res.redirect(config.postLogoutRedirect);
    });
  };
}
