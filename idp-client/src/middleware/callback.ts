import type { RequestHandler } from "express";
import type { ResolvedIdpClientConfig } from "../types";
import { exchangeAuthorizationCode, IdpTokenError } from "../httpClient";
import { renderErrorPage } from "../errorPage";

// Mensagens amigaveis por codigo `error` devolvido pelo /authorize do IdP
// (OS 17) - o texto tecnico (`error_description`) fica so de apoio/log, nunca
// e o que o usuario ve. Codigo nao mapeado cai no fallback generico abaixo.
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Sua conta nao tem permissao para acessar este sistema. Peca a um administrador para liberar o acesso.",
};

// GET /auth/callback (OS 07, secao 3.3): recebe o code, valida o state
// (CSRF), troca por access_token/refresh_token no /token do IdP e guarda
// na sessao local do PROPRIO sistema (nunca no front - OS 07, secao 3.4).
export function createCallbackHandler(config: ResolvedIdpClientConfig): RequestHandler {
  return async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (typeof error === "string") {
      // O usuario continua logado no IdP (o /authorize so recusou ESTE
      // sistema) - "voltar aos sistemas" e a acao que faz sentido aqui, nao
      // "tentar login de novo" (OS 17, secao 3.3).
      console.warn(`[idp-client] callback error=${error} description=${errorDescription ?? ""}`);
      res.status(400).send(
        renderErrorPage(
          "Nao foi possivel entrar",
          ERROR_MESSAGES[error] ?? (typeof errorDescription === "string" ? errorDescription : "O IdP recusou este login."),
          [{ label: "Voltar aos sistemas", href: config.homeUrl }]
        )
      );
      return;
    }

    const expectedState = req.session.idpAuthState;
    delete req.session.idpAuthState;
    if (!expectedState || typeof state !== "string" || state !== expectedState) {
      res.status(400).send(
        renderErrorPage(
          "Login expirado",
          "Esse link de login nao e mais valido. Inicie o login novamente.",
          [{ label: "Tentar login novamente", href: config.loginPath }]
        )
      );
      return;
    }

    if (typeof code !== "string") {
      res.status(400).send(
        renderErrorPage(
          "Login incompleto",
          "Nao recebemos as informacoes de login do IdP. Tente novamente.",
          [{ label: "Tentar login novamente", href: config.loginPath }]
        )
      );
      return;
    }

    let tokens;
    try {
      tokens = await exchangeAuthorizationCode(config, code);
    } catch (err) {
      const message = err instanceof IdpTokenError ? err.message : "Falha ao comunicar com o IdP.";
      console.warn(`[idp-client] falha ao trocar code por token: ${message}`);
      res.status(502).send(
        renderErrorPage(
          "Nao foi possivel completar o login",
          "Nao conseguimos concluir seu login agora. Tente novamente em instantes.",
          [{ label: "Tentar login novamente", href: config.loginPath }]
        )
      );
      return;
    }

    const returnTo = req.session.idpAuthReturnTo;
    delete req.session.idpAuthReturnTo;

    // Regenera o id de sessao no login (mitiga session fixation), igual ao
    // que o proprio IdP faz no /login (OS 02).
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).send(
          renderErrorPage(
            "Nao foi possivel completar o login",
            "Nao conseguimos iniciar sua sessao agora. Tente novamente.",
            [{ label: "Tentar login novamente", href: config.loginPath }]
          )
        );
        return;
      }

      req.session.idpAuth = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
      };

      res.redirect(returnTo || config.postLoginRedirect);
    });
  };
}
