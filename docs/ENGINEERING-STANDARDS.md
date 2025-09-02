# Engineering Standards (Morpheus)

## Princípios
- Clean Code: código legível, coeso e com responsabilidades claras; funções curtas e nomes descritivos.
- DRY: nenhuma duplicação intencional; extrair utilitários/heurísticas compartilhadas; manifesto como fonte única de verdade para sites.
- Segurança por padrão: validação de entrada, escape de saída, limites de concorrência/tempo.

## Estilo e Organização
- TypeScript estrito; ESLint + Prettier; `.editorconfig` vigente (2 espaços; Python 4 espaços, aspas duplas).
- Estrutura sugerida: `apps/api` (SSE/engine), `apps/web` (UI), `lib/` (parsers/norm), `docs/`.
- Convenções: `kebab-case` para arquivos, `camelCase` para símbolos, `UPPER_SNAKE` para constantes.

## Testes e Qualidade
- Cobertura mínima 85% no core (SonarCloud); testes unit/contract/e2e offline.
- Não acoplar testes ao HTML completo: focar em seletores/padrões e casos‑ouro.
- Sem logs com PII; export local somente.

## Revisão e PRs
- Siga o template de PR; descreva decisões e trade‑offs.
- Se alterar `docs/sites.core.yaml`, explique impacto e atualize casos‑ouro.
- CI deve passar em todos os jobs, incluindo SonarCloud.
