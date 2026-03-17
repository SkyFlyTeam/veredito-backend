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
