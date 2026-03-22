# file-converter

Módulo responsável por parsear arquivos e retornar seu conteúdo como texto bruto.

## Formatos suportados

| Formato | Extensão | Biblioteca |
|---------|----------|------------|
| Word    | `.docx`  | `mammoth`  |
| PDF     | `.pdf`   | `pdf-parse` |
| Texto   | `.txt`   | Node.js nativo (`Buffer`) |

> Qualquer outro formato retorna **HTTP 400** com a mensagem:
> `"Tipo de arquivo não suportado. Formatos aceitos: pdf, docx, txt"`

---

## Estrutura do módulo

```
src/file-converter/
├── controller/
│   └── file-converter.controller.ts   # Endpoint POST /file-converter/parse
├── service/
│   └── file-converter.service.ts      # Lógica de parsing por formato
├── file-converter.module.ts
└── README.md                          # Este arquivo
```

---

## Testando localmente (sem subir o servidor)

O script `scripts/test-file-converter.ts` instancia o serviço diretamente,  
sem precisar de banco de dados, Docker ou token JWT.

### Pré-requisito

Dependências já instaladas via:

```bash
npm install
```

### Comando

```bash
npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts <caminho-do-arquivo>
```

---

## Arquivos de exemplo

Os arquivos de exemplo estão em `./data/`:

| Arquivo | Formato |
|---------|---------|
| `data/example-1.docx` | Word (.docx) |
| `data/example-2.pdf`  | PDF (.pdf)   |
| `data/example-3.txt`  | Texto (.txt) |

### Testando o `.docx`

```bash
npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./data/example-1.docx
```

Saída esperada:
```
Parsing file: example-1.docx (22367 bytes)

--- Extracted text ---

<texto bruto extraído do Word>

--- End of text ---
```

---

### Testando o `.pdf`

```bash
npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./data/example-2.pdf
```

Saída esperada:
```
Parsing file: example-2.pdf (121288 bytes)

--- Extracted text ---

<texto bruto extraído do PDF>

--- End of text ---
```

---

### Testando o `.txt`

```bash
npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./data/example-3.txt
```

Saída esperada:
```
Parsing file: example-3.txt (4951 bytes)

--- Extracted text ---

<texto bruto do arquivo de texto>

--- End of text ---
```

> **Obs.:** O parser TXT normaliza automaticamente codificação UTF-8 BOM e  
> line endings `\r` (Mac antigo) e `\r\n` (Windows) para `\n`.

---

### Testando formato não suportado

```bash
npx ts-node -r tsconfig-paths/register scripts/test-file-converter.ts ./package.json
```

Saída esperada:
```
Parsing file: package.json (2838 bytes)

Error: Tipo de arquivo não suportado. Formatos aceitos: pdf, docx, txt
```

---

## Endpoint HTTP (com o servidor rodando)

```
POST /file-converter/parse
Authorization: Bearer <JWT token>
Content-Type: multipart/form-data

campo: file → arquivo (.pdf, .docx ou .txt)
```

Resposta de sucesso (`200 OK`):
```json
{
  "text": "<texto bruto extraído do arquivo>"
}
```

Resposta de erro (`400 Bad Request`):
```json
{
  "statusCode": 400,
  "message": "Tipo de arquivo não suportado. Formatos aceitos: pdf, docx, txt",
  "error": "Bad Request"
}
```
