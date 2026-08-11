// Configuracao que cada sistema cliente fornece ao instanciar a lib (OS 07,
// secao 3.2) - normalmente lida de variaveis de ambiente pelo proprio
// sistema (IDP_URL, IDP_CLIENT_ID, IDP_CLIENT_SECRET, IDP_REDIRECT_URI).
export interface IdpClientConfig {
  /** URL base do IdP, sem barra final (ex.: "http://192.168.x.x:4000"). */
  idpUrl: string;
  /**
   * URL base do IdP como o NAVEGADOR do usuario a enxerga - so precisa ser
   * definida quando difere de `idpUrl` (ex.: backend containerizado falando
   * com o IdP via host.docker.internal/nome-de-servico, mas o navegador do
   * usuario, fora do container, precisa de localhost). Usada apenas no
   * redirect browser-facing de /auth/login; chamadas server-to-server
   * (/token, JWKS, /revoke) sempre usam `idpUrl`. @default idpUrl
   */
  authorizeUrl?: string;
  /**
   * Menu central do IdP (OS 13) - usado como destino do botao "Voltar aos
   * sistemas" nas telas de erro de login (OS 17). @default `${idpUrl}/home`
   */
  homeUrl?: string;
  clientId: string;
  /** Nunca deve chegar ao front do sistema cliente (OS 07, secao 4). */
  clientSecret: string;
  redirectUri: string;

  /** @default "/auth/login" */
  loginPath?: string;
  /** @default "/auth/callback" */
  callbackPath?: string;
  /** @default "/auth/logout" */
  logoutPath?: string;
  /** Pra onde mandar o usuario depois de logar, se nao houver returnTo salvo. @default "/" */
  postLoginRedirect?: string;
  /** @default "/" */
  postLogoutRedirect?: string;
  /** Cache do JWKS (OS 07, secao 3.5). @default 3600000 (1h) */
  jwksCacheTtlMs?: number;
  /** Se definido, o `iss` do token tambem e validado contra este valor. */
  issuer?: string;
}

export interface ResolvedIdpClientConfig extends Required<Omit<IdpClientConfig, "issuer">> {
  issuer?: string;
}

// Claims que o front-facing `req.user` expoe pro resto da aplicacao cliente
// (OS 07, secao 3.3) - nunca o token cru, so os dados ja decodificados/validados.
export interface IdpUser {
  sub: string;
  email: string;
  name: string;
  role: string | null;
  system: string;
}

// O que fica guardado na sessao local do sistema cliente - nunca exposto
// ao front (OS 07, secao 3.4: sempre cookie httpOnly gerido pelo backend).
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch ms - quando o access_token expira, calculado a partir de `expires_in`. */
  accessTokenExpiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
