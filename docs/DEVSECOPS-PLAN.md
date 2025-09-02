# DevSecOps Plan (Agent Smith)

## Objetivos
- Segurança e qualidade por padrão; sem persistência de dados; deploy estável na Vercel.

## Pipeline
- Jobs: `lint` → `typecheck` → `test:unit` → `test:contract` → `test:e2e` (mocks) → `coverage` → `sast` → `deps-audit` → `secrets-scan` → `sonarcloud` → `build`.
- Gates: cobertura ≥ 85% no core (via SonarCloud), `sast`/Sonar sem achados alto/crit, audit sem vulnerabilidade alta sem exceção aprovada.

## Controles
- Lint/Format: ESLint (regras de segurança) + Prettier.
- SAST: Semgrep (ecosystem `p/tsc`, `p/nodejs`, regras de SSRF, injeção de regex, XSS) e `eslint-plugin-security`.
- Dependências: `pnpm audit` + OSV scanner.
- Segredos: Gitleaks.
- E2E: Playwright com mocks (sem rede externa no CI).
- Artefatos: relatório de cobertura e Semgrep.
 - SonarCloud: qualidade contínua (bugs, code smells, coverage, duplicação). `sonar-project.properties` na raiz.

## Políticas de Branch/PR
- PRs exigem: descrição, escopo, mudanças no manifesto (`docs/sites.core.yaml`) destacadas, print da UI quando aplicável.
- Checks obrigatórios: todos os jobs acima + revisão de 1 pair; CODEOWNERS para `docs/sites.core.yaml`.

## Runtime/Infra (Vercel)
- Headers: `Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`.
- Rate limit por IP/sessão; limites de concorrência (6–10); timeout 3–4s por site.
- Sem logs de PII; sanitização de eventos; `X-Request-ID` para troubleshooting.
- Dependências mínimas (evitar libs pesadas). Sem Tor no MVP.

## Proteções de Entrada
- Validação de username por site (regex `allowed` do manifesto).
- Allowlist de hosts: somente URLs templadas do manifesto; negar instâncias arbitrárias, exceto Mastodon com validação de domínio.
- Bloquear redirects para login/signup em classificadores.

## Auditoria Contínua
- Semanal: atualização de deps, re‑run SAST, revisão de padrões do manifesto.
- Mensal: tabletop de abuso/DoS; revisão de headers e limites.

## Agentes
- `architect`: cobertura e qualidade de testes.
- `agent-smith`: CI/CD e gates.
- `trinity`: SAST/auditoria de deps e correções guiadas.
- `blue-team`: monitoramento de abusos e afinamento de limites.
- `red-team`: testes de abuso (mass scan, payloads malformados).
