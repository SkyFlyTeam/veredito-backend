# Assertividade da Pipeline de Sugestao de Precedentes

Base de referencia: banco atualizado em 14/05/2026, com precedentes populados e embeddings gerados.

Guia de reproducao desta analise: `dev-tools/reproducao-assertividade-pipeline.md`

Recorte considerado:
- 20 temas unicos de peticao
- O gabarito de precedentes esperados foi validado com base no arquivo `dev-tools/data/Precedentes relacionados a cada petição.docx`
- O arquivo `19_Inicial_Cobranca_Taxa_Matricula_Universidade_Publica_Tema_RG_40.pdf` nao entrou na tabela porque repete o mesmo tema/gabarito do arquivo `5_inicial_cobranca_taxa_matricula_universidade_publica_tema_RG_40.pdf`
- O rank abaixo considera a ordem retornada pela busca vetorial persistida no banco, ordenada por percentual de similaridade
- A coluna `Classificacao` reflete o valor salvo em `precedente_sugerido.classificacao`

Observacoes sobre o gabarito:
- No caso `Uso de imagem de jogador`, o documento referencia `SIRDR STJ 10`; no banco atualizado, o registro recuperado e persistido para esse tema foi `stj-ct-618`
- No caso `Fracionamento de precatorio`, o documento faz referencia ao Tema 28 do STF; no banco, o identificador encontrado para esse tema foi `stf-rg-28`

## Resumo executivo

- Taxa de acerto no top-10: 19/20 (95%)
- Casos com precedente esperado em rank `#1`: 13
- Casos com precedente esperado em rank `#2`: 5
- Casos com precedente esperado em rank `#3`: 1
- Casos em que o precedente esperado nao apareceu no top-10: 1

## Tabela para apresentacao

| # | Tema da peticao | Precedente esperado | Encontrado no top-10? | Rank | Classificacao | Similaridade (%) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Acao cobranca Lei 12.855 | `stj-rr-974` | Sim | #1 | 1 | 84.89 |
| 2 | Acao popular competencia originaria | `tjes-irdr-85` | Sim | #1 | 1 | 86.90 |
| 3 | Competencia juri foro privilegiado | `stf-sv-45` | Sim | #1 | 1 | 82.34 |
| 4 | Alimentos complementares avos | `stj-rr-1310` | Sim | #1 | 1 | 87.08 |
| 5 | Taxa matricula universidade publica | `stf-rg-40` | Sim | #2 | 2 | 87.04 |
| 6 | Competencia criminal violencia domestica | `tjes-irdr-77` | Sim | #2 | 2 | 85.31 |
| 7 | Correcao FGTS piso salario minimo | `stf-adi-5090` | Sim | #1 | 1 | 88.21 |
| 8 | Cotista lista ampla concorrencia | `tjes-irdr-106` | Sim | #1 | 1 | 85.84 |
| 9 | Deducao juros JCP CSLL | `stj-rr-1319` | Sim | #1 | 1 | 88.97 |
| 10 | Fracionamento de precatorio | `stf-rg-28` | Sim | #2 | 2 | 86.22 |
| 11 | Recusa de transfusao de sangue | `tjes-iac-15` | Sim | #1 | 1 | 88.50 |
| 12 | Uso de imagem de jogador | `stj-ct-618` | Sim | #2 | 2 | 80.88 |
| 13 | Natureza juridica gratificacao VV | `tjes-irdr-13` | Sim | #3 | 3 | 87.68 |
| 14 | Vale transporte e FGTS | `stj-rr-1334` | Sim | #1 | 1 | 87.35 |
| 15 | Prescricao anual seguro | `stj-iac-2` | Sim | #2 | 2 | 83.73 |
| 16 | Valor da causa em consorcio | `tjes-irdr-109` | Sim | #1 | 1 | 88.52 |
| 17 | Legitimidade de incapaz no Juizado | `tjes-irdr-4` | Nao | Nao apareceu no top-10 | - | - |
| 18 | Acidente de trabalho competencia JT | `stf-rg-242` | Sim | #1 | 1 | 85.40 |
| 19 | Livre concorrencia em lei municipal | `stf-sv-49` | Sim | #1 | 1 | 88.08 |
| 20 | Sociedade uniprofissional e ISS | `stj-rr-1323` | Sim | #1 | 1 | 88.55 |

## Leitura rapida

A base atualizada mostrou alta aderencia do pipeline: 95% dos temas tiveram o precedente esperado dentro do top-10, e 13 dos 20 casos apareceram ja na primeira posicao. O unico caso fora do top-10 foi `tjes-irdr-4`, referente ao tema de legitimidade de incapaz no Juizado.
