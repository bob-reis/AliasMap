# Threat Model (Neo)

## Contexto e Ativos
- App web na Vercel, API SSE que consulta perfis públicos e telas iniciais de recuperação (1 tentativa), sem persistência.
- Ativos: disponibilidade da API, manifesto `sites.core.yaml`, código cliente, integridade dos resultados, limites de recurso.

## Ameaças (STRIDE)
- Spoofing: usuários forjam instância/host para SSRF.
- Tampering: alteração indevida do manifesto/padrões de sites.
- Repudiation: ações sem correlação; logs insuficientes (sem PII).
- Information Disclosure: vazamento de PII em logs/export; coleta além do público.
- DoS: abuso por mass scan, timeouts altos, concorrência excessiva.
- Elevation: execução de código via dependências comprometidas ou payloads HTML (XSS no viewer).

## Vetores
- Parâmetros `username`/`instance` (Mastodon) maliciosos → SSRF/host injection.
- Respostas HTML externas com conteúdo inesperado → parsers frágeis, XSS em renderização.
- Dependências NPM vulneráveis; alterações em `docs/sites.core.yaml` sem revisão.
- Longas execuções em serverless (limites Vercel) → quedas.

## Mitigações
- Input: validar por regex por site; allowlist de hosts; bloquear IPs internos e esquemas não‑HTTP/HTTPS; normalização estrita.
- Execução: limite de concorrência (6–10), timeout 3–4s, 1 tentativa/fluxo, cancelamento SSE suportado.
- Saída/Render: escapar sempre; nunca renderizar HTML bruto de evidências (somente snippets textuais).
- Logs: sem PII; `X-Request-ID`; amostragem de erros somente com hash dos sinais.
- Processo: CODEOWNERS para `docs/sites.core.yaml`; Semgrep/OSV; Gitleaks.
- Headers: CSP rígido (default-src 'self'); Referrer‑Policy; HSTS; no sniff.
- Rate limit: por IP/sessão; captcha leve opcional se abuso recorrente.

## Decisões
- LinkedIn/Facebook marcados como “inconclusive” frequente (login‑wall).
- Recuperação: nunca seguir links; somente página inicial e parsing estático.
- Sem Tor no MVP; sem persistência de resultados.

## Risco Residual/Monitoramento
- Sites mudam HTML; falsos positivos/negativos. Mitigar com fixtures e revisão semanal.
- Possível bloqueio por anti‑bot. Responder com backoff e reportar “inconclusive”.
- Abuso de varredura. Afinar limites e bloquear por IP.
