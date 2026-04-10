# Task Manager (Notion-Style)

Este é um projeto desenvolvido inteiramente para **testar e aprimorar conhecimentos** de desenvolvimento web moderno com foco na interface do usuário (UI) e experiência do usuário (UX), replicando nativamente os conceitos dinâmicos de arquitetura presentes no Notion.

## Tecnologias utilizadas

- **[React](https://react.dev/)**
- **[Next.js (App Router)](https://nextjs.org/)**
- **[Supabase](https://supabase.com/)** (Autenticação, Banco de Dados, Storage)
- **[Shadcn UI](https://ui.shadcn.com/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[next-intl](https://next-intl-docs.vercel.app/)**
- **[@dnd-kit](https://dndkit.com/)**
- **[Drizzle ORM](https://orm.drizzle.team/)** (PostgreSQL)
- **[react-easy-crop](https://github.com/valentinvichnal/react-easy-crop)** (Edição de Avatares)

## Como executar o projeto (primeira vez após clonar)

Requisitos: **Node.js** e um projeto **Supabase** ativo.

1. Clone o repositório e entre na pasta raiz.
2. Instale as dependências:

```bash
npm install
```

3. **Variáveis de ambiente**

```bash
cp .env.example .env.local
```

Edite o `.env.local` com as credenciais do seu projeto Supabase.

4. **Configuração Automática do Banco e Storage**

Este comando irá criar as tabelas (via Drizzle), configurar o bucket de `avatars` no Storage e definir as políticas de segurança (RLS) automaticamente.

```bash
npm run db:setup
```

5. Inicie o app:

```bash
npm run dev
```

6. Abra [http://localhost:3000](http://localhost:3000).

---

## Detalhes do Projeto

### Fluxo de Autenticação
O projeto utiliza o Supabase Auth. Quando novos usuários são criados, o Supabase gerencia a verificação de e-mail. O login é realizado via cookies seguros no lado do servidor (SSR).

### Edição de Perfil
O sistema permite alterar nome e avatar com ferramenta de crop circular. As imagens são armazenadas no Supabase Storage e sincronizadas automaticamente com o banco de dados.

### Comandos de Banco de Dados

| Comando | Descrição |
|--------|-----------|
| `npm run db:setup` | **(Recomendado)** Sincroniza tabelas e configura Storage/RLS do Supabase. |
| `npm run db:push` | Sincroniza o schema do Drizzle com o banco de dados. |
| `npm run db:studio` | Abre o Drizzle Studio para visualização dos dados. |
