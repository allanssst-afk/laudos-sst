# Gerador de Laudos SST

App de uso no navegador (PWA, sem servidor e sem login) que gera cinco documentos a partir do mesmo cadastro:

| Documento | Base |
|---|---|
| PGR – inventário de riscos e plano de ação | NR-01, itens 1.5.3 a 1.5.8 (Portaria MTE 1.419/2024) |
| LTCAT | Lei 8.213/1991, art. 58; Decreto 3.048/1999; IN PRES/INSS 128/2022, art. 276 |
| Laudo de insalubridade | CLT, arts. 189 a 195; NR-15 |
| Laudo de periculosidade | CLT, art. 193; NR-16 |
| Laudo ergonômico (AEP) | NR-17 (Portaria MTP 423/2021) |

## Como abrir

- No Mac: dois cliques em `iniciar.command` (abre em `http://localhost:8766`).
- Ou abrir o `index.html` direto no navegador. Funciona, mas sem instalar como app.

## Como usar

1. **Empresa**: dados da empresa, do responsável técnico e dos documentos.
2. **Grupos**: os grupos homogêneos de exposição (GHE), com funções, ambiente e atividades.
3. **Riscos**: cada risco é cadastrado uma vez por grupo. O catálogo preenche limite, anexo da NR-15 e metodologia.
   O app sugere a conclusão de insalubridade e de aposentadoria especial; o profissional pode trocar.
4. **Periculosidade**, **Ergonomia** e **Plano de ação**: dados próprios desses documentos.
5. **Documentos**: escolha o documento, veja as pendências, imprima (PDF) ou baixe para o Word.

Os dados ficam só no aparelho. Use "Baixar backup" na tela inicial para guardar ou levar a outro aparelho.

## Arquivos

- `js/normas.js`: base normativa (anexos da NR-15 e NR-16, catálogo de agentes, matriz de risco, itens da NR-17, premissas).
- `js/store.js`: dados no aparelho e a empresa de exemplo.
- `js/docs.js`: regras de sugestão, pendências e o texto dos cinco documentos.
- `js/telas.js` e `js/app.js`: telas, navegação e exportação.

## Aviso

Os documentos são minutas. A conclusão técnica e a assinatura cabem ao engenheiro de segurança do trabalho ou
médico do trabalho, que deve conferir os dados e o texto vigente das normas.
