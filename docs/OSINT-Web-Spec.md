# AliasMap — Design Spec (v0)

## Objetivos
- Replicar o valor do Sherlock em uma app web sem persistência: 1 requisição por fluxo, apenas dados públicos, nada de login/códigos.
- Priorizar precisão sobre cobertura: lista fundamental e curada de plataformas.
- Visualização em mindmap conectando plataformas, identificadores e evidências.

## Plataformas (Fundamental v1)
- LinkedIn (soft-check), Discord (ID/handle), X/Twitter, Instagram, Facebook (soft-check), TikTok, YouTube, Reddit, Telegram, GitHub, GitLab, Stack Overflow, Hacker News, Keybase, Twitch, Steam, Mastodon (instância), Bluesky.
- Classificação de risco (recuperação): green (padrões mascarados típicos), amber (genérico/CAPTCHA), red (login-wall forte). Validar na prática antes do go‑live.

## Manifesto (resumo do esquema)
- `id`, `tier: fundamental|core|optional`, `norm` (case/charset), `profile` (url, successPatterns, notFoundPatterns, timeoutMs), `recovery` (enabled, risk, endpoint/method/payloadTemplate, parsePatterns, notes).
- Formato: YAML versionado em `docs/sites.core.yaml`.

## Resultados (modelo)
- `platform`: id, url, status: found|not_found|inconclusive, latencyMs.
- `identifiers[]`: { type: email|phone|handle|name|url, value|mask, masked: bool, source: profile|recovery, evidenceSnippet, confidence: low|medium|high }.
- `evidence[]`: { kind: canonical|title|regex|og|jsonld, snippet }.
- Exemplo:
```json
{
  "platform": {"id":"github","url":"https://github.com/alvo","status":"found","latencyMs":742},
  "identifiers": [
    {"type":"name","value":"Alvo da Silva","masked":false,"source":"profile","confidence":"high"},
    {"type":"email","value":"jo***@mail.com","masked":true,"source":"recovery","confidence":"low"}
  ],
  "evidence": [
    {"kind":"canonical","snippet":"rel=\"canonical\" href=\"https://github.com/alvo\""}
  ]
}
```

## API (SSE) contrato
- Endpoint: `GET /api/scan?username=...&tier=fundamental&instance=...`.
- Eventos: `site_start` {id}, `site_result` {platform, identifiers[], evidence[]}, `site_error` {id, reason}, `progress` {done,total}, `done` {summary}.
- Limites: concorrência 6–10; timeout 3–4s por site; 1 tentativa por fluxo.

## Mindmap (modelo)
- Nós: `Platform`, `Identifier`, `Evidence`.
- Arestas: `found_on(platform→identifier)`, `mentions(platform→identifier)`, `corroborates(identifier↔identifier)`.
- Render: raiz = username; ramos “Plataformas” e “Identificadores”. Painel lateral com snippets e URLs.

Exemplo (simplificado):
```json
{
  "nodes":[
    {"id":"platform:github","type":"Platform","label":"GitHub"},
    {"id":"id:email:jo***@mail.com","type":"Identifier","label":"jo***@mail.com","masked":true}
  ],
  "edges":[{"from":"platform:github","to":"id:email:jo***@mail.com","type":"found_on"}]
}
```

## Guardrails
- Apenas conteúdo público; não seguir links de reset; sem retries agressivos.
- Logs sem PII; nada persistido no servidor; export apenas no cliente (JSON/CSV).

## UI/UX — Disclaimers e Consentimento
- Modal bloqueante no primeiro uso da sessão com aceite explícito do "Aviso e Uso Ético"; armazenar somente em `sessionStorage`.
- Banner na tela de varredura com aviso resumido e link para o texto completo; link persistente no rodapé.
- Página dedicada (`/ethics`) renderizando markdown a partir de `docs/ui-copy/disclaimer.pt.md` (fallback `disclaimer.en.md`).
- Export (JSON/CSV) inclui nota cabeçalho: coleta pública, uso responsável, sem persistência.
- Acessibilidade: foco gerenciado no modal, `aria-labelledby`/`aria-describedby`, contraste adequado.
- i18n: PT-BR padrão, EN fallback por detecção do navegador.
- Testes E2E: impedir varredura sem aceite; verificar banner/rodapé; export contém a nota.
- Fonte única: ver `docs/UX-POLICY.md` e `docs/ui-copy/`.

## Pendências para validação
- Confirmar lista final e risco de recuperação por plataforma.
- Ajustar padrões de sucesso/erro por site e normalização de username.
