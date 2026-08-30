# Website Financeiro (Casal + Pessoal) — Plano de Desenvolvimento

## Objetivo
Aplicação web simples para gerir finanças pessoais e do casal (receitas, despesas, orçamentos, objetivos de poupança), **100% gratuita** e acessível online.

---

## 1. Stack Recomendada (tudo grátis)

| Camada | Opção | Porquê |
|---|---|---|
| Frontend | React (Vite) ou HTML/CSS/JS simples | Leve, rápido de montar |
| Backend | Node.js + Express, **ou** Supabase (BaaS) | Supabase evita ter de gerir servidor/DB |
| Base de dados | Supabase (Postgres) ou Firebase Firestore | Free tier generoso, autenticação incluída |
| Autenticação | Supabase Auth / Firebase Auth | Login por email ou Google, grátis |
| Hosting frontend | Vercel ou Netlify | Deploy grátis, domínio `.vercel.app` incluído |
| Hosting backend | Render (free tier) ou funções serverless (Vercel/Supabase) | Evita custos de servidor |
| Domínio | Subdomínio grátis (ex: `.vercel.app`) ou domínio próprio (~10€/ano, opcional) | Mantém custo zero se usar subdomínio |

**Recomendação simples:** React + Vite no frontend, Supabase para DB/Auth, deploy no Vercel. Sem backend próprio necessário.

---

## 2. Funcionalidades Essenciais (MVP)

1. **Login/Registo** — conta individual, com opção de "espaço partilhado" para o casal.
2. **Registo de transações** — receitas e despesas (valor, categoria, data, descrição).
3. **Categorias** — predefinidas + personalizáveis (casa, alimentação, lazer, poupança...).
4. **Vista mensal** — saldo, total receitas/despesas por categoria.
5. **Orçamentos** — definir limite mensal por categoria e acompanhar progresso.
6. **Partilha casal** — dados visíveis para ambos os membros da conta partilhada.
7. **Gráficos simples** — barras/pizza (usar biblioteca `recharts` ou `chart.js`).

### Funcionalidades futuras (fase 2)
- Objetivos de poupança com progresso.
- Exportação para CSV/Excel.
- Notificações de orçamento excedido.
- Modo escuro.

---

## 3. Estrutura de Dados (Supabase — exemplo)

```
users (gerido pelo Supabase Auth)

households (id, nome)
household_members (household_id, user_id)

transactions (
  id, household_id, user_id,
  tipo [receita/despesa],
  valor, categoria, data, descricao
)

budgets (
  id, household_id, categoria, limite_mensal
)
```

---

## 4. Passos de Desenvolvimento

1. Criar conta grátis no [Supabase](https://supabase.com) → criar projeto → definir tabelas acima.
2. Criar projeto React com Vite: `npm create vite@latest financas-casal -- --template react`
3. Instalar cliente Supabase: `npm install @supabase/supabase-js`
4. Implementar autenticação (login/registo).
5. Criar CRUD de transações (formulário + listagem).
6. Criar dashboard com totais e gráficos.
7. Implementar orçamentos por categoria.
8. Testar localmente (`npm run dev`).
9. Ligar repositório a conta grátis no [Vercel](https://vercel.com) → deploy automático a cada `git push`.
10. Configurar variáveis de ambiente (chaves Supabase) no Vercel.

---

## 5. Custos Esperados
- **0€** usando: Vercel (frontend), Supabase (backend/DB free tier), domínio `.vercel.app`.
- Único custo opcional: domínio próprio (~10€/ano) — dispensável.

---

## 6. Próximos Passos Imediatos
- [ ] Criar repositório Git (GitHub, grátis).
- [ ] Criar projeto Supabase e definir esquema de dados.
- [ ] Montar esqueleto React + rotas (login, dashboard, transações).
- [ ] Fazer primeiro deploy no Vercel (mesmo vazio) para validar pipeline.
