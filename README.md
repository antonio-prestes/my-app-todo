# Task Manager (Notion-Style)

Este é um projeto desenvolvido inteiramente para **testar e aprimorar conhecimentos** de desenvolvimento web moderno com foco na interface do usuário (UI) e experiência do usuário (UX), replicando nativamente os conceitos dinâmicos de arquitetura presentes no Notion.

## Tecnologias utilizadas

- **[React](https://react.dev/)**
- **[Next.js (App Router)](https://nextjs.org/)**
- **[Shadcn UI](https://ui.shadcn.com/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[next-intl](https://next-intl-docs.vercel.app/)**
- **[@dnd-kit](https://dndkit.com/)**
- **[Drizzle ORM](https://orm.drizzle.team/)** + **PostgreSQL** (ex.: Neon)
- **[NextAuth](https://next-auth.js.org/)** (credenciais)
- **[Resend](https://resend.com/)** (e-mail de verificação de cadastro)

## Como executar o projeto (primeira vez após clonar)

Requisitos: **Node.js** e um **PostgreSQL** acessível.

1. Clone o repositório e entre na pasta raiz.
2. Instale as dependências:

```bash
npm install
```

3. **Variáveis de ambiente**

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do Postgres (ex.: Neon; use `?sslmode=require` se necessário). |
| `AUTH_SECRET` | String aleatória forte (ex.: `openssl rand -base64 32`). |
| `RESEND_API_KEY` | Chave da API Resend para enviar o código de verificação. |
| `EMAIL_FROM` | Remetente verificado no Resend (ex.: `App <onboarding@seudominio.com>`). |

O `drizzle.config.ts` carrega `.env.local` para os comandos do Drizzle.

4. **Sincronizar o banco com o schema**

- **Desenvolvimento (rápido):** aplica o schema atual ao banco sem gerar novos arquivos SQL:

```bash
npm run db:push
```

- **Migrations versionadas:** após alterar `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:migrate
```

Se o banco já tinha tabelas antigas sem novas colunas, o **`db:push`** costuma alinhar colunas e tabelas ao `schema.ts`.

5. Inicie o app:

```bash
npm run dev
```

6. Abra [http://localhost:3000](http://localhost:3000).

### Comandos úteis do Drizzle

| Comando | Descrição |
|--------|-----------|
| `npm run db:generate` | Gera migrations a partir de `src/db/schema.ts`. |
| `npm run db:migrate` | Aplica migrations em `src/db/migrations`. |
| `npm run db:push` | Sincroniza o schema com o banco (sem novo arquivo SQL). |
| `npm run db:studio` | Abre o Drizzle Studio. |

## Fluxo de cadastro

Após criar a conta, o usuário recebe um código de **4 dígitos** por e-mail e deve confirmar em `/verify-email`. O login só é permitido com a conta verificada (`email_verified` no banco).
