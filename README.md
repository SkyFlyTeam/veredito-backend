# SKYFLY NestJS Cookie-cutter

## Inicialização de ambiente

```bash
cp .env-sample .env

docker compose build app

docker compose run --rm app npm run migration:run

docker compose run --rm --service-ports app
```

## Execução de testes

```bash
docker compose run --rm app npm run test:cov
```

## Execução de migrações

Comandos para atualizar o banco de dados com os models

```bash
docker compose run --rm app npm run migration:generate

docker compose run --rm app npm run migration:run
```

## Workflow do deploy (depois de implementado pode remover)

1. Build da imagem

```bash
docker compose -f docker-compose-prod.yml build app --no-cache
```

1. Build dos serviços de migration

```bash
docker compose -f docker-compose-prod.yml build migration --no-cache
```

1. Subir o banco de dados

```bash
docker compose -f docker-compose-prod.yml up -d postgres
```

1. Executar as migrações

```bash
docker compose -f docker-compose-prod.yml run --rm migration
```

1. Subir os serviços

```bash
docker compose -f docker-compose-prod.yml up postgres app nginx -d
```

1. Aplicar certificado SSL

```bash
docker compose -f docker-compose-prod.yml run --rm certbot
```

## Execução de comandos CLI

```bash
docker compose run --rm app npm run start:cli -- update:especies-tribunais
```

Comando para atualizar as espécies e tribunais diretamente

```bash
docker compose run --rm app npm run start:cli -- update:precedentes
```

Comando para atualizar precedentes

```bash
docker compose run --rm app npm run start:cli -- embeddings:precedentes
```

Comando para gerar embeddings de todos os precedentes
