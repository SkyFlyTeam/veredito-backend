WITH expected(ord, tema, file_pattern, gabarito_documento, expected_numero_registro) AS (
  VALUES
    (1, 'Acao cobranca Lei 12.855', '^1_', 'Tema Repetitivo 974 / SIRDR 3 STJ', 'stj-rr-974'),
    (2, 'Acao popular competencia originaria', '^2_', 'IRDR 85 TJES', 'tjes-irdr-85'),
    (3, 'Competencia juri foro privilegiado', '^3_', 'Sumula Vinculante 45 STF', 'stf-sv-45'),
    (4, 'Alimentos complementares avos', '^4_', 'Tema Repetitivo 1310 STJ', 'stj-rr-1310'),
    (5, 'Taxa matricula universidade publica', '^5_', 'Tema RG 40 STF', 'stf-rg-40'),
    (6, 'Competencia criminal violencia domestica', '^6_', 'IRDR 77 TJES', 'tjes-irdr-77'),
    (7, 'Correcao FGTS piso salario minimo', '^7_', 'ADI 5090 STF', 'stf-adi-5090'),
    (8, 'Cotista lista ampla concorrencia', '^8_', 'IRDR 106 TJES', 'tjes-irdr-106'),
    (9, 'Deducao juros JCP CSLL', '^9_', 'Tema Repetitivo 1319 STJ', 'stj-rr-1319'),
    (10, 'Fracionamento de precatorio', '^10_', 'Tema 28 STF', 'stf-rg-28'),
    (11, 'Recusa de transfusao de sangue', '^11_', 'IAC 15 TJES', 'tjes-iac-15'),
    (12, 'Uso de imagem de jogador', '^12_', 'SIRDR STJ 10', 'stj-ct-618'),
    (13, 'Natureza juridica gratificacao VV', '^13_', 'IRDR 13 TJES', 'tjes-irdr-13'),
    (14, 'Vale transporte e FGTS', '^14_', 'TR 1334', 'stj-rr-1334'),
    (15, 'Prescricao anual seguro', '^15_', 'IAC 2 STJ', 'stj-iac-2'),
    (16, 'Valor da causa em consorcio', '^16_', 'IRDR 109 TJES', 'tjes-irdr-109'),
    (17, 'Legitimidade de incapaz no Juizado', '^17_', 'IRDR 4 TJES', 'tjes-irdr-4'),
    (18, 'Acidente de trabalho competencia JT', '^18_', 'Tema 242 RG', 'stf-rg-242'),
    (19, 'Livre concorrencia em lei municipal', '^20_', 'Sumula Vinculante 49 STF', 'stf-sv-49'),
    (20, 'Sociedade uniprofissional e ISS', '^21_', 'TR 1323', 'stj-rr-1323')
), matched_peticao AS (
  SELECT
    e.ord,
    e.tema,
    e.gabarito_documento,
    e.expected_numero_registro,
    p.id AS peticao_id,
    p.arquivo
  FROM expected e
  LEFT JOIN LATERAL (
    SELECT
      pet.id,
      regexp_replace(pet.caminho_arquivo, '^.*/', '') AS arquivo
    FROM peticao pet
    WHERE regexp_replace(pet.caminho_arquivo, '^.*/', '') ~ e.file_pattern
    ORDER BY pet.id
    LIMIT 1
  ) p ON TRUE
), aggregated_suggestions AS (
  SELECT
    ps.peticao_id,
    pr.numero_registro,
    MIN(CASE WHEN ps.classificacao > 0 THEN ps.classificacao END) AS melhor_rank,
    MAX(ps.percentual_similaridade) AS percentual_similaridade
  FROM precedente_sugerido ps
  JOIN precedente pr ON pr.id = ps.precedente_id
  GROUP BY ps.peticao_id, pr.numero_registro
)
SELECT
  mp.ord,
  mp.tema,
  mp.peticao_id,
  mp.arquivo,
  mp.gabarito_documento,
  mp.expected_numero_registro,
  CASE WHEN agg.melhor_rank IS NULL THEN 'NAO' ELSE 'SIM' END AS encontrado_no_top10,
  COALESCE('#' || agg.melhor_rank::text, 'Nao apareceu no top-10') AS rank_texto,
  COALESCE(agg.melhor_rank::text, '-') AS classificacao,
  COALESCE(TO_CHAR(agg.percentual_similaridade, 'FM999990.00'), '-') AS percentual_similaridade
FROM matched_peticao mp
LEFT JOIN aggregated_suggestions agg
  ON agg.peticao_id = mp.peticao_id
 AND agg.numero_registro = mp.expected_numero_registro
ORDER BY mp.ord;