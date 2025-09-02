## Descrição
- [ ] Explique claramente o objetivo da mudança e o impacto no usuário.

## Escopo da Mudança
- [ ] Código da API/Engine
- [ ] UI/UX (inclua screenshots/gifs)
- [ ] Manifesto de sites (`docs/sites.core.yaml`)
- [ ] Documentação (`docs/*`)

## Checklist de Qualidade (Architect)
- [ ] Lint e typecheck passam (`pnpm lint`, `pnpm typecheck`)
- [ ] Testes unit/contract/e2e passam e cobertura mantida (≥ 85% no core)
- [ ] Contrato SSE estável (`site_start`, `site_result`, `progress`, `done`)

## Segurança (Agent Smith / Neo / Trinity)
- [ ] Entrada validada (regex/allowlist por site), sem SSRF
- [ ] Sem persistência de dados; logs sem PII
- [ ] Semgrep e audit sem achados alto/crit
- [ ] Nenhum segredo no código (Gitleaks)
- [ ] Threat model revisado se superfícies mudaram

## Notas de Implementação
- [ ] Para telas de recuperação: 1 tentativa, sem seguir links, apenas parsing da página inicial
- [ ] Identificadores mascarados rotulados corretamente

## Outras Observações
- Issues relacionadas: #
- Screenshots/Anexos:
