# Task Manager (Notion-Style)

Um gerenciador de tarefas moderno inspirado no Notion, com workspaces, quadro Kanban, tabela interativa e suporte a múltiplos idiomas.

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, Next.js 16 (App Router), Tailwind CSS, Shadcn UI |
| **Backend** | Next.js Server Actions, Drizzle ORM |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **Cache** | Upstash Redis (REST) |
| **Autenticação** | Supabase Auth (SSR cookies) |
| **Storage** | Supabase Storage (avatares) |
| **i18n** | next-intl (pt-BR, en) |
| **Drag & Drop** | @dnd-kit |

## Funcionalidades

- ✅ Autenticação com verificação de e-mail (OTP)
- ✅ Workspaces com ícone emoji personalizável
- ✅ Visualização em Tabela (TanStack Table) e Kanban (drag & drop)
- ✅ CRUD completo de tasks com status, prioridade, tags e prazo
- ✅ Edição de perfil com crop de avatar
- ✅ Cache distribuído com Redis (Upstash) e invalidação cirúrgica
- ✅ Internacionalização completa (Português e Inglês)
- ✅ Row Level Security (RLS) em todas as tabelas

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite com suas credenciais do Supabase e Upstash Redis

# 3. Configurar banco + storage + RLS
npm run db:setup

# 4. Iniciar
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Documentação

Para detalhes sobre arquitetura, regras de negócio, estratégia de cache e schema do banco de dados, consulte a documentação completa:

- 📐 [Arquitetura e Regras de Negócio](./DOCS/architecture.md)
- 🌐 [Guia de Internacionalização](./DOCS/i18n-guidelines.md)
