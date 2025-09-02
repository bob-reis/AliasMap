# Test Plan (Architect)

## Scope
- Engine de varredura (heurísticas, concorrência, timeouts).
- API SSE (`/api/scan`) e contrato de eventos.
- Normalização/validação por plataforma (username patterns).
- Visualização mindmap (nós/arestas, export JSON/CSV).

## Tipos de Teste
- Unidade: parsers/regex por site; normalização; classificadores (found/not_found/inconclusive); gerador de payloads de recuperação.
- Contrato (API): stream SSE com ordem/coerência (`site_start`, `site_result`, `progress`, `done`); erros bem formados.
- Integração: motor + manifesto curado com servidores falsos (fixtures HTTP); limites de concorrência e timeouts.
- E2E (sem rede externa): UI → API (mocks) → mindmap render; export e acessibilidade básica.
- Não‑funcionais: performance (latência por lote) e resiliência (cancelamentos e timeouts).

## Estratégia
- Mocks determinísticos para cada site via servidor local/fixtures (golden pages: perfil existente, inexistente, login‑wall).
- Testes offline por padrão; “online” marcados e opt‑in (ex.: `@slow`, `@online`).
- Snapshot seletivo para mindmap (estrutura de nós/arestas, sem acoplar estilo).

## Ferramentas
- Node/Next: Vitest/Jest + Supertest para rotas, Playwright para E2E.
- Lint/format: ESLint + Prettier; tipos com TypeScript estritos.
- Cobertura: meta ≥ 85% linhas/branches no core (parsers, contrato SSE, normalização).

## Casos‑chave
- Padrões: 200 + `successPatterns` e ausência de `notFoundPatterns` → found.
- Login‑wall: status/HTML de bloqueio → inconclusive.
- Recuperação: respostas mascaradas reconhecidas (email/phone) em 1 tentativa; nunca seguir links.
- Concurrency: N sites com limite M → nunca exceder M.
- SSE: fluxo completo, cancelamento pelo cliente e erro controlado.

## Execução
- CI: `lint` → `test:unit` → `test:contract` → `test:e2e` (mocks) → cobertura.
- Local (exemplos):
  - `pnpm test` (unit/contract)
  - `pnpm e2e` (Playwright offline)
  - `pnpm coverage` (relatório)
