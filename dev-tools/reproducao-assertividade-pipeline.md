# Reproducao da Task de Assertividade da Pipeline

Versao curta para descricao de PR: `dev-tools/reproducao-assertividade-pipeline-pr.md`

## Objetivo

Formalizar a assertividade da pipeline de sugestao de precedentes com base no banco atualizado, cobrindo:
- persistencia das 21 peticoes PDF em banco
- carga dos precedentes e geracao dos embeddings
- avaliacao do rank do precedente esperado para cada tema
- geracao da tabela final para apresentacao

## O que foi feito

- Foram processados os 21 PDFs numerados de `dev-tools/data`
- Os precedentes foram atualizados a partir da rotina existente do projeto
- Foram gerados embeddings para os precedentes antes de executar a busca vetorial das peticoes
- O gabarito dos precedentes esperados foi validado com base no arquivo `dev-tools/data/Precedentes relacionados a cada petição.docx`
- A tabela final de apresentacao considera 20 temas unicos

Observacao importante:
- O arquivo `19_Inicial_Cobranca_Taxa_Matricula_Universidade_Publica_Tema_RG_40.pdf` nao entra na tabela final porque repete o mesmo tema do arquivo `5_inicial_cobranca_taxa_matricula_universidade_publica_tema_RG_40.pdf`

## Pre-requisitos

- Docker e Docker Compose instalados
- Variavel `OPENAI_API_KEY` configurada no arquivo `.env`
- Acesso de rede para a API de precedentes e para a OpenAI
- Pelo menos um usuario existente na tabela `users`, porque o comando `run:pipeline:batch` precisa associar as peticoes a um usuario

Validacao minima antes de rodar a batch:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_users FROM users;"
```

Se `total_users = 0`, crie um usuario antes de seguir. Pode ser via Swagger/endpoint de criacao de usuario ou via insert manual compativel com o schema local.

## Passo a passo para testar

### 1. Subir o banco

Se a intencao for reproduzir do zero, comece limpando os volumes:

```bash
docker compose down -v
docker compose up -d postgres
docker compose run --rm app npm run migration:run
```

Se o banco local ja estiver no estado esperado da branch, basta garantir o PostgreSQL rodando:

```bash
docker compose up -d postgres
```

### 2. Atualizar especies e tribunais

```bash
docker compose run --rm app npm run start:cli -- update:especies-tribunais
```

### 3. Atualizar precedentes

```bash
docker compose run --rm app npm run start:cli -- update:precedentes
```

Observacoes:
- este comando pode levar varios minutos
- a rotina salva os precedentes ao final, entao a tabela `precedente` pode continuar zerada enquanto a paginacao ainda estiver rodando

Validacao apos a conclusao:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_precedentes FROM precedente;"
```

### 4. Gerar embeddings dos precedentes

```bash
docker compose run --rm app npm run start:cli -- embeddings:precedentes
```

Validacao:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_precedentes, COUNT(*) FILTER (WHERE tese_vetor IS NOT NULL OR questao_vetor IS NOT NULL) AS precedentes_com_vetor FROM precedente;"
```

Na avaliacao desta task, o resultado observado foi:
- `total_precedentes = 10001`
- `precedentes_com_vetor = 8238`

### 5. Persistir as 21 peticoes no banco e rodar a pipeline completa

```bash
docker compose run --rm app npm run start:cli -- run:pipeline:batch
```

Esse comando faz, para cada PDF numerado de `1` a `21` em `dev-tools/data`:
- cria a `peticao`
- extrai texto
- gera resumo com OpenAI
- salva `resumo`
- gera embedding da peticao
- salva vetores na `peticao`
- executa busca vetorial
- salva `precedente_sugerido`
- gera sinteses

Validacao apos a batch:

```bash
docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_peticoes, COUNT(*) FILTER (WHERE resumo IS NOT NULL) AS peticoes_com_resumo, COUNT(*) FILTER (WHERE tese_vetor IS NOT NULL OR questao_vetor IS NOT NULL) AS peticoes_com_vetor FROM peticao;"

docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS total_sugestoes, COUNT(DISTINCT peticao_id) AS peticoes_com_sugestoes FROM precedente_sugerido;"

docker exec -i nest_postgres psql -U nestuser -d nestdb -c "SELECT COUNT(*) AS duplicated_paths FROM (SELECT caminho_arquivo FROM peticao GROUP BY caminho_arquivo HAVING COUNT(*) > 1) t;"
```

Na avaliacao desta task, o resultado final foi:
- `total_peticoes = 21`
- `peticoes_com_resumo = 21`
- `peticoes_com_vetor = 21`
- `total_sugestoes = 394`
- `peticoes_com_sugestoes = 21`
- `duplicated_paths = 0`

### 6. Gerar a tabela da assertividade

O SQL versionado para essa etapa esta em `dev-tools/sql/assertividade_pipeline.sql`.

Ele faz o seguinte:
- usa o `.docx` como referencia de gabarito
- consolida 20 temas unicos
- localiza a peticao correspondente no banco
- cruza com `precedente_sugerido`
- retorna, por tema, se o precedente esperado apareceu no top-10, seu rank/classificacao e percentual de similaridade

Executar:

```bash
mkdir -p dev-tools/out

docker exec -i nest_postgres psql -U nestuser -d nestdb -At -F '|' \
  < dev-tools/sql/assertividade_pipeline.sql \
  > dev-tools/out/assertividade_pipeline_final.tsv
```

Para inspecionar o resultado cru:

```bash
cat dev-tools/out/assertividade_pipeline_final.tsv
```

### 7. Conferir a tabela final pronta para apresentacao

O material consolidado desta avaliacao esta em:

- `dev-tools/assertividade-pipeline-precedentes.md`

Esse arquivo ja traz:
- resumo executivo
- taxa de acerto
- distribuicao por rank
- tabela pronta para README/slide

## Resultado esperado da avaliacao atual

- 20 temas unicos avaliados
- 19/20 com precedente esperado dentro do top-10
- 13 casos em rank `#1`
- 5 casos em rank `#2`
- 1 caso em rank `#3`
- 1 caso fora do top-10: `tjes-irdr-4`

## Observacoes sobre o gabarito

- O gabarito foi extraido de `Precedentes relacionados a cada petição.docx`
- No caso `Uso de imagem de jogador`, o documento referencia `SIRDR STJ 10`, enquanto o registro efetivamente recuperado e persistido no banco foi `stj-ct-618`
- No caso `Fracionamento de precatorio`, o documento referencia o Tema 28 do STF; no banco, o identificador encontrado foi `stf-rg-28`

## Checklist para avaliador de PR

- Branch atualizada e migrations aplicadas
- PostgreSQL ativo
- `OPENAI_API_KEY` configurada
- Tabela `precedente` populada
- Embeddings de precedentes gerados
- 21 PDFs persistidos na tabela `peticao`
- `precedente_sugerido` preenchida
- SQL `dev-tools/sql/assertividade_pipeline.sql` executado com sucesso
- Tabela final revisada em `dev-tools/assertividade-pipeline-precedentes.md`