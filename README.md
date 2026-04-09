# Task Manager (Notion-Style)

Este é um projeto desenvolvido inteiramente para **testar e aprimorar conhecimentos** de desenvolvimento web moderno com foco na interface do usuário (UI) e experiência do usuário (UX), replicando nativamente os conceitos dinâmicos de arquitetura presentes no Notion.

## 🚀 Tecnologias Utilizadas

A aplicação foi construída sob conceitos super modernos, abrangendo:

- **[React](https://react.dev/)**: Base interativa da construção das telas.
- **[Next.js 15 (App Router)](https://nextjs.org/)**: Framework principal para rotas e middleware.
- **[Shadcn UI](https://ui.shadcn.com/)**: Biblioteca de componentes customizáveis minimalistas.
- **[Tailwind CSS](https://tailwindcss.com/)**: Estilização flexível e rápida.
- **[next-intl](https://next-intl-docs.vercel.app/)**: Internacionalização sob demanda nativa na plataforma.
- **[@dnd-kit](https://dndkit.com/)**: Sistema para arrastar e soltar (Drag and Drop) nativo no Dashboard Kanban.

## 🛠 Como executar o projeto

Para rodar o projeto localmente por enquanto, você apenas precisará do Node.js instalado na sua máquina:

1. Clone o repositório e acesse a pasta raiz (`my-app-todo`).
2. Instale as dependências executando:

```bash
npm install
```

3. **Configuração de Banco de Dados (Neon Postgres):**
   A aplicação utiliza Drizzle ORM atrelado a um Serverless PostgreSQL Auth. 
   - Renomeie ou faça uma cópia do arquivo `.env.example` e chame-o de `.env.local` na raiz do projeto.
   - Abra o `.env.local` e defina suas chaves:
     - `DATABASE_URL`: A sua URL de conexão fornecida no painel do Neon Postgres.
     - `AUTH_SECRET`: Uma string aleatória forte (gerada para a Criptografia das sessões).
   - Feito isso, mande a estrutura das tabelas para o banco usando o comando Drizzle: 
     ```bash
     npx drizzle-kit push
     ```

4. Inicie o servidor de desenvolvimento na sua máquina:

```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000) pelo seu navegador de preferência.
