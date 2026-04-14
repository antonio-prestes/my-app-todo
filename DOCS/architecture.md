# Arquitetura e Regras de Negócio

Documentação técnica detalhada do projeto **Task Manager (Notion-Style)**. Este documento serve como referência para desenvolvedores e também pode ser utilizado como contexto para LLMs em futuras interações.

---

## Sumário

- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Autenticação](#autenticação)
- [Banco de Dados](#banco-de-dados)
- [Cache com Redis (Upstash)](#cache-com-redis-upstash)
- [Internacionalização (i18n)](#internacionalização-i18n)
- [Edição de Perfil](#edição-de-perfil)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral da Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│  Next.js     │────▶│ Upstash Redis│
│  (React 19) │     │  App Router  │     │  (Cache REST)│
└─────────────┘     │  Server      │     └──────┬───────┘
                    │  Components  │            │ MISS
                    │  + Actions   │            ▼
                    └──────┬───────┘     ┌──────────────┐
                           │             │   Supabase   │
                           └────────────▶│  PostgreSQL  │
                                         │  Auth / RLS  │
                                         │  Storage     │
                                         └──────────────┘
```

- **Server Components** renderizam as páginas no servidor com dados já prontos.
- **Server Actions** (`src/app/actions/`) encapsulam toda a lógica de CRUD.
- **Redis** atua como camada intermediária de cache entre as actions e o banco.
- **Supabase** é o backend completo: banco, autenticação e armazenamento de arquivos.

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── actions/           # Server Actions (CRUD de workspaces, tasks, users)
│   │   ├── tasks.ts
│   │   ├── users.ts
│   │   └── workspaces.ts
│   └── [locale]/
│       ├── dashboard/
│       │   ├── layout.tsx           # Layout autenticado (Sidebar + Header)
│       │   ├── page.tsx             # Lista de workspaces
│       │   └── [workspaceId]/
│       │       └── page.tsx         # Detalhe do workspace (Tabela + Kanban)
│       ├── login/page.tsx
│       └── signup/page.tsx
├── components/
│   ├── ui/                # Componentes base (Shadcn UI)
│   ├── app-sidebar.tsx    # Sidebar com navegação entre workspaces
│   ├── data-table.tsx     # Tabela de tasks (TanStack Table)
│   ├── kanban-board.tsx   # Quadro Kanban (dnd-kit)
│   ├── task-dialog.tsx    # Dialog de criação/edição de task
│   └── workspace-dialog.tsx # Dialog de criação/edição de workspace
├── db/
│   ├── db.ts              # Conexão Drizzle + PostgreSQL
│   ├── schema.ts          # Schema das tabelas (users, workspaces, tasks)
│   └── setup-supabase.ts  # Setup automático (Storage + RLS)
├── lib/
│   ├── cache.ts           # Camada de cache Redis (Upstash)
│   └── supabase/          # Clients Supabase (server + client)
└── i18n/                  # Configuração next-intl
```

---

## Autenticação

O projeto utiliza **Supabase Auth** com autenticação via e-mail/senha.

### Fluxo

1. **Cadastro** → Usuário cria conta → Supabase envia e-mail de verificação com código OTP.
2. **Verificação** → Usuário insere o código → Toast de sucesso → Redirect para `/dashboard`.
3. **Login** → Autenticação via cookies seguros (SSR) → Sessão gerenciada pelo `@supabase/ssr`.
4. **Proteção de rotas** → O `layout.tsx` do dashboard verifica a sessão; se inválida, redireciona para `/`.

### Dados do usuário na sessão

```typescript
const sessionUser = {
  id: user.id,
  name: user.user_metadata.display_name || user.email?.split('@')[0],
  email: user.email,
  avatar: user.user_metadata.avatar_url,
};
```

---

## Banco de Dados

### Schema (Drizzle ORM)

**Tabelas:**

| Tabela | Descrição | Relações |
|--------|-----------|----------|
| `users` | Dados de perfil (nome, e-mail, avatar) | `1:N` → workspaces |
| `workspaces` | Espaços de trabalho com emoji e descrição | `N:1` → users, `1:N` → tasks |
| `tasks` | Tarefas com status, prioridade, assignee, tags, prazo | `N:1` → workspaces, `N:1` → users |

**Campos da task:**

| Campo | Tipo | Valores |
|-------|------|---------|
| `status` | `text` | `Todo`, `InProgress`, `Review`, `Done` |
| `priority` | `text` | `Low`, `Medium`, `High` |
| `tags` | `jsonb` | Array de strings |
| `assignee` | `text` | Nome do responsável |
| `assigneeAvatar` | `text` | URL do avatar |
| `dueDate` | `text` | Data de prazo |

### Segurança (RLS)

Row Level Security está habilitado em todas as tabelas públicas. Cada query filtra por `userId` para garantir isolamento de dados entre usuários.

---

## Cache com Redis (Upstash)

O projeto implementa uma camada de **cache distribuído** utilizando **Upstash Redis** via HTTP REST, otimizando a performance das consultas ao banco de dados remoto.

### Fluxo de funcionamento

```
Requisição → Redis (cache HIT?) → Retorna dados em ~5ms
                    ↓ (cache MISS)
            Consulta ao Supabase (~200-300ms) → Salva no Redis (TTL: 5 min) → Retorna dados
```

### Chaves de cache

| Chave | Dados cacheados | Invalidada quando |
|-------|-----------------|-------------------|
| `workspaces:{userId}` | Lista de workspaces com contagem de tasks e avatars | Criar/editar/excluir workspace ou task |
| `workspace:{userId}:{wsId}` | Detalhes de um workspace específico | Editar/excluir workspace |
| `tasks:{userId}:{wsId}` | Lista de tasks de um workspace | Criar/editar/excluir task |

### Estratégia de invalidação

- **Invalidação cirúrgica por chave**: Ao realizar mutações (create/update/delete), apenas as chaves afetadas são removidas do cache. Exemplo: ao criar uma task, invalida-se `tasks:{userId}:{wsId}` e `workspaces:{userId}` (pois a contagem mudou), mas NÃO outros workspaces.

- **Tag-based invalidation**: Cada chave pode ser associada a tags (ex: `user:{id}`). Isso permite invalidar todos os dados de um usuário de uma só vez quando necessário (ex: logout, troca de conta).

- **Graceful degradation**: Se o Redis estiver indisponível, a aplicação continua funcionando normalmente buscando direto no Supabase — sem erros visíveis para o usuário. Erros de Redis são logados como `console.warn`.

### Implementação

O cache é implementado em `src/lib/cache.ts` e expõe 4 funções principais:

```typescript
cached<T>(key, fetcher, ttl?, tags?)   // Busca do cache ou executa fetcher
invalidateCache(...keys)                // Invalida chaves específicas
invalidateTag(tag)                      // Invalida todas as chaves de uma tag
cacheKey(...parts)                      // Constrói chaves consistentes
```

---

## Internacionalização (i18n)

O projeto suporta múltiplos idiomas via **next-intl**. Consulte o guia completo em [`DOCS/i18n-guidelines.md`](./i18n-guidelines.md).

**Idiomas suportados:** `pt-BR` (padrão), `en`

**Namespaces de tradução:** `Common`, `Auth`, `Dashboard`, `Tasks`, `TaskFields`, `Navigation`, `Workspace`, `Account`, `Stats`

---

## Edição de Perfil

O sistema permite alterar nome e avatar com ferramenta de crop circular (via `react-easy-crop`). As imagens são armazenadas no **Supabase Storage** (bucket `avatars`) e o URL é sincronizado automaticamente com `user_metadata` do Supabase Auth.

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | ✅ | URL de conexão PostgreSQL (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave pública (publishable) do Supabase |
| `UPSTASH_REDIS_REST_URL` | ✅ | URL REST da instância Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Token de autenticação do Upstash Redis |
| `AUTH_SECRET` | ✅ | Secret para sessão de autenticação |
| `RESEND_API_KEY` | ✅ | API key do Resend (envio de e-mails) |
| `EMAIL_FROM` | ✅ | Endereço de e-mail remetente |

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run db:setup` | **(Recomendado)** Sincroniza tabelas e configura Storage/RLS |
| `npm run db:push` | Sincroniza o schema do Drizzle com o banco |
| `npm run db:studio` | Abre o Drizzle Studio para visualização dos dados |
