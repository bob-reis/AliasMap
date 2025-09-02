# UX Policy — Disclaimers & Consent

## Objetivo
Garantir exibição clara de aviso legal e uso ético em toda a UI, antes e durante o uso do AliasMap.

## Padrões de Exibição
- Consentimento (bloqueante): modal na primeira execução da sessão com checkbox “Li e concordo com o Aviso e Uso Ético”. Sem persistência no servidor; armazenar somente em `sessionStorage`.
- Banner na página de varredura: aviso resumido e link para o texto completo.
- Rodapé persistente: link para “Aviso e Uso Ético”.
- Export: incluir nota no cabeçalho do JSON/CSV (“Dados coletados de fontes públicas… uso responsável…”).

## Conteúdo (fonte única)
- Manter o texto em `docs/ui-copy/disclaimer.pt.md` (PT-BR) e `docs/ui-copy/disclaimer.en.md` (EN).
- A UI deve consumir esse conteúdo estático (build-time) para manter consistência.

## Regras de Operação
- 1 tentativa por fluxo; sem seguir links de reset; não realizar login; apenas parsing estático de conteúdo público.
- Não registrar PII em logs; sem persistência de resultados; export somente no cliente.
- Respeitar limites: concorrência moderada e timeouts.

## Acessibilidade
- Modal com foco gerenciável, `aria-labelledby`/`aria-describedby`, e navegação por teclado.
- Banner com contraste suficiente e link claramente identificável.

## Internacionalização (i18n)
- Padrão PT-BR com fallback EN; detectar idioma do navegador quando aplicável.

## Testes
- E2E: bloquear a varredura sem aceitar o modal; verificar banner e rodapé visíveis; export contém a nota.
