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

2. Build dos serviços de migration
```bash
docker compose -f docker-compose-prod.yml build migration --no-cache
```


4. Subir o banco de dados
```bash
docker compose -f docker-compose-prod.yml up -d postgres
```

5. Executar as migrações
```bash
docker compose -f docker-compose-prod.yml run --rm migration
```

6. Subir os serviços
```bash
docker compose -f docker-compose-prod.yml up postgres app nginx -d
```

7. Aplicar certificado SSL
```bash
docker compose -f docker-compose-prod.yml run --rm certbot
```
