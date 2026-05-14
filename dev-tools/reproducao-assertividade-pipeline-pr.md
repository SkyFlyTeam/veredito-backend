# Reproducao Curta para PR

## Objetivo

Reproduzir a avaliacao da assertividade da pipeline de sugestao de precedentes a partir do banco atualizado, chegando na tabela final de apresentacao.

## Escopo avaliado

- 21 PDFs processados em banco
- 20 temas unicos considerados na tabela final
- gabarito validado com base em `dev-tools/data/Precedentes relacionados a cada petição.docx`

Observacao:
- o arquivo `19_Inicial_Cobranca_Taxa_Matricula_Universidade_Publica_Tema_RG_40.pdf` nao entra na tabela final porque repete o mesmo tema do arquivo `5_inicial_cobranca_taxa_matricula_universidade_publica_tema_RG_40.pdf`

## Pre-requisitos

- `OPENAI_API_KEY` configurada no `.env`
- PostgreSQL rodando
- pelo menos um usuario existente na tabela `users`

Validacao minima:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_users FROM users;"
```

## Passos para reproduzir

### 1. Subir banco e aplicar migrations

```bash
docker compose up -d postgres
docker compose run --rm app npm run migration:run
```

Se quiser reproduzir do zero:

```bash
docker compose down -v
docker compose up -d postgres
docker compose run --rm app npm run migration:run
```

### 2. Popular base de precedentes

```bash
docker compose run --rm app npm run start:cli -- update:especies-tribunais
docker compose run --rm app npm run start:cli -- update:precedentes
docker compose run --rm app npm run start:cli -- embeddings:precedentes
```

Checkpoint esperado:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_precedentes, COUNT(*) FILTER (WHERE tese_vetor IS NOT NULL OR questao_vetor IS NOT NULL) AS precedentes_com_vetor FROM precedente;"
```

Resultado observado nesta avaliacao:
- `total_precedentes = 10001`
- `precedentes_com_vetor = 8238`

### 3. Persistir as 21 peticoes e executar a pipeline completa

```bash
docker compose run --rm app npm run start:cli -- run:pipeline:batch
```

Checkpoint esperado:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_peticoes, COUNT(*) FILTER (WHERE resumo IS NOT NULL) AS peticoes_com_resumo, COUNT(*) FILTER (WHERE tese_vetor IS NOT NULL OR questao_vetor IS NOT NULL) AS peticoes_com_vetor FROM peticao;"

docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_sugestoes, COUNT(DISTINCT peticao_id) AS peticoes_com_sugestoes FROM precedente_sugerido;"

docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS duplicated_paths FROM (SELECT caminho_arquivo FROM peticao GROUP BY caminho_arquivo HAVING COUNT(*) > 1) t;"
```

Resultado observado nesta avaliacao:
- `total_peticoes = 21`
- `peticoes_com_resumo = 21`
- `peticoes_com_vetor = 21`
- `total_sugestoes = 394`
- `peticoes_com_sugestoes = 21`
- `duplicated_paths = 0`

### 4. Gerar a tabela de assertividade

SQL versionado:
- `dev-tools/sql/assertividade_pipeline.sql`

Comando:

```bash
mkdir -p dev-tools/out

docker exec -i nest_postgres psql -U nestuser -d nestdb -At -F '|' \
  < dev-tools/sql/assertividade_pipeline.sql \
  > dev-tools/out/assertividade_pipeline_final.tsv
```

Validacao minima:

```bash
wc -l dev-tools/out/assertividade_pipeline_final.tsv
```

Resultado esperado:
- `20` linhas

### 5. Conferir a tabela final pronta para apresentacao

Arquivo consolidado:
- `dev-tools/assertividade-pipeline-precedentes.md`

## Resultado esperado

- 20 temas unicos avaliados
- 19/20 com precedente esperado no top-10
- 13 casos em rank `#1`
- 5 casos em rank `#2`
- 1 caso em rank `#3`
- 1 caso fora do top-10: `tjes-irdr-4`

## Checklist de review

- migrations aplicadas
- precedentes carregados
- embeddings dos precedentes gerados
- 21 peticoes persistidas
- 0 duplicidades em `peticao`
- SQL da assertividade executada com sucesso
- `dev-tools/out/assertividade_pipeline_final.tsv` com `20` linhas
- tabela final conferida em `dev-tools/assertividade-pipeline-precedentes.md`