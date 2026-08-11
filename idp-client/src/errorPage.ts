// OS 17: telas de erro de login legiveis, no lugar de texto cru (o que este
// backend Express manda pro navegador do usuario em navegacoes de pagina
// inteira, como /auth/callback - nao e um fetch de API consumido por JS).
export interface ErrorPageAction {
  label: string;
  href: string;
}

export function renderErrorPage(title: string, message: string, actions: ErrorPageAction[]): string {
  const actionsHtml = actions
    .map((a) => `<a class="btn" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0;
    min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 1.5rem; }
  .card { max-width: 420px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; text-align: center; }
  h1 { font-size: 1.15rem; margin: 0 0 0.75rem; }
  p { color: #94a3b8; margin: 0 0 1.5rem; line-height: 1.5; }
  .btn { display: inline-block; padding: 0.6rem 1.1rem; border-radius: 8px; background: #38bdf8;
    color: #0f172a; text-decoration: none; font-weight: 600; margin: 0 0.35rem; }
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${actionsHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
