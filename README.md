# 🥗 Nutri lucas — Sistema de Gestão para Nutricionistas

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> Uma plataforma web moderna, rápida e intuitiva desenvolvida para nutricionistas gerenciarem seus pacientes, consultas, planos alimentares e métricas em tempo real com **Neon Serverless PostgreSQL**.

---

## 📌 Funcionalidades Principais

- 🔐 **Autenticação & Segurança de Nutricionistas**:
  - Cadastro e login seguro com hash de senha SHA-256 no client/banco.
  - Sessão persistente no navegador com isolamento total por nutricionista (`nutricionista_id`).
  - Row Level Security (RLS) habilitado no banco Neon.

- 📊 **Dashboard em Tempo Real (Prompt 3)**:
  - **Menu lateral fixo**: Navegação ágil com o logo **Nutri lucas ** e abas *Dashboard* e *Pacientes*.
  - **Card 1 — Total de pacientes ativos**: Contagem em tempo real de pacientes cadastrados.
  - **Card 2 — Consultas da semana**: Monitoramento de consultas registradas na semana corrente.
  - **Card 3 — Pacientes sem retorno**: Identificação automática de pacientes sem consulta há mais de 30 dias e sem retorno futuro agendado, com acesso direto ao perfil do paciente.

- 👥 **Gestão Completa de Pacientes**:
  - Cadastro rápido de novos pacientes (dados pessoais, contato, peso inicial, altura e objetivos).
  - Tabela com busca instantânea por nome, email ou telefone.
  - Modal de perfil detalhado com histórico de consultas e dados antropométricos.

- ⚡ **Banco de Dados Neon PostgreSQL Integrado**:
  - Conexão serverless ultrarrápida via `@neondatabase/serverless`.
  - Configuração via arquivo `.env` ou modal interativo de configurações.
  - Função integrada para popular dados de teste (*Seed Demo*).

---

## 🗄️ Estrutura do Banco de Dados (Neon PostgreSQL)

```mermaid
erDiagram
    NUTRICIONISTAS ||--o{ PACIENTES : "gerencia"
    PACIENTES ||--o{ CONSULTAS : "possui"
    PACIENTES ||--o{ PLANOS_ALIMENTARES : "possui"

    NUTRICIONISTAS {
        uuid id PK
        text nome
        text email UK
        text senha_hash
        timestamp created_at
    }

    PACIENTES {
        uuid id PK
        uuid nutricionista_id FK
        text nome
        text email
        text telefone
        text whatsapp
        date data_nascimento
        text sexo
        numeric peso_inicial
        numeric altura
        text objetivo_texto
        timestamp created_at
    }

    CONSULTAS {
        uuid id PK
        uuid paciente_id FK
        date data_consulta
        numeric peso
        numeric cintura
        numeric quadril
        numeric percentual_gordura
        date proximo_retorno
        text observacoes
        timestamp created_at
    }

    PLANOS_ALIMENTARES {
        uuid id PK
        uuid paciente_id FK
        jsonb conteudo
        timestamp created_at
    }
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/)
- **Bundler & Dev Server**: [Vite](https://vite.dev/)
- **Banco de Dados**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **Driver de Conexão**: `@neondatabase/serverless`
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Design & Estilos**: Vanilla CSS moderno com Design System próprio (verde/branco saúde, glassmorphism e micro-animações)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/lucassantana2301-bot/NewApp.git
cd NewApp
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (ou copie o [.env.example](file:///.env.example)):

```env
# Configuração do Neon PostgreSQL
VITE_NEON_DATABASE_URL=postgresql://usuario:senha@ep-exemplo.sa-east-1.aws.neon.tech/neondb?sslmode=require
VITE_NEON_PROJECT_ID=seu-project-id-aqui
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Abra no seu navegador: **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Estrutura de Pastas

```text
├── public/                 # Arquivos estáticos
├── src/
│   ├── assets/             # Imagens e ícones estáticos
│   ├── components/         # Componentes React
│   │   ├── DashboardScreen.jsx    # Dashboard principal & Sidebar
│   │   ├── LoginScreen.jsx        # Tela de login
│   │   ├── SignUpScreen.jsx       # Tela de cadastro
│   │   ├── Logo.jsx               # Componente de marca
│   │   └── NeonSettingsModal.jsx  # Configuração de conexão Neon
│   ├── lib/
│   │   └── neonClient.js   # Queries SQL, Auth & Conexão Neon
│   ├── App.jsx             # Roteador de telas e controle de sessão
│   ├── index.css           # Design system e folhas de estilo globais
│   └── main.jsx            # Ponto de entrada React
├── .env                    # Variáveis de ambiente locais
├── package.json            # Dependências e scripts do projeto
├── vite.config.js          # Configurações do Vite (Porta 3000)
└── README.md               # Documentação do projeto
```

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor Vite de desenvolvimento na porta `3000` |
| `npm run build` | Gera a versão de produção otimizada na pasta `/dist` |
| `npm run preview` | Pré-visualiza localmente a versão compilada |
| `npm run lint` | Executa o linter Oxlint para validação de código |

---

## 👨‍💻 Autor

Desenvolvido por **Lucas Santana**  
GitHub: [@lucassantana2301-bot](https://github.com/lucassantana2301-bot)
