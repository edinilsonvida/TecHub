# Autenticação do TecHub — estado atual

Este documento descreve o comportamento observado no código do backend. É um protótipo parcial, não uma especificação de requisitos nem confirmação de que todas as etapas de cadastro/login estejam prontas. Revise o código e os testes antes de alterar ou afirmar o comportamento.

Revisado em 21/09/2026.

## Estado importante

O cadastro (`POST /api/auth/register`) cria a conta, emite um JWT e inicia a sessão imediatamente. A confirmação de e-mail ainda não faz parte deste protótipo: não há envio, token de verificação, estado persistido ou bloqueio do login. A resposta de sucesso não afirma que um e-mail foi enviado.

Na verificação local desta revisão, os 13 testes do backend passaram. A confirmação de e-mail deve ser implementada como uma evolução completa do fluxo, sem reaproveitar mensagens ou trechos experimentais como se a funcionalidade já estivesse ativa.

## Código de referência

Todos os caminhos abaixo são relativos à pasta `backend/`:

- `src/routes/authRoutes.js`: rotas e rate limit.
- `src/controllers/authController.js`: cadastro, login, perfil e respostas.
- `src/validators/authValidators.js`: validação e normalização de entrada.
- `src/models/User.js`: campos, papel, hash bcrypt e representação segura.
- `src/middlewares/auth.js`: autenticação Bearer e autorização por papel.
- `src/utils/jwt.js`: assinatura e verificação JWT.
- `src/services/mailService.js`: implementação experimental baseada em conta de teste Ethereal; não está conectada ao cadastro atualmente.
- `test/auth.test.js`: testes HTTP com persistência simulada.

## Contrato implementado

| Rota | Comportamento atual |
|---|---|
| `POST /api/auth/register` | Aceita somente `name`, `email`, `password`; cria usuário com papel `customer`; responde `201` com `{ message, user, token }` e inicia a sessão sem confirmação de e-mail nesta etapa. |
| `POST /api/auth/login` | Valida e-mail/senha, responde com erro genérico `401` para conta ausente ou senha incorreta; em sucesso retorna `{ user, token }`. Não verifica confirmação de e-mail. |
| `GET /api/auth/me` | Exige `Authorization: Bearer <token>` válido, busca o usuário atual no banco e retorna `{ user }`. |
| `PATCH /api/auth/me` | Exige autenticação e `currentPassword`; aceita ao menos um entre `name`, `email` e `password`; valida a senha atual e devolve `{ user }` sem dados de senha. |

Usuários são serializados com `toSafeJSON()` (`id`, `name`, `email`, `role`, `createdAt`, `updatedAt`); senha/hash não são retornados. O model atualmente exige `name` e limita o papel ao enum `customer`/`seller`. O cadastro público sempre define `customer` no servidor e rejeita campos extras, inclusive `role`.

### Regras de entrada

- E-mail é aparado, validado e convertido para minúsculas.
- Nome de cadastro é obrigatório, aparado e limitado a 100 caracteres.
- Nova senha (cadastro/alteração): mínimo de 8 caracteres, ao menos uma letra e um algarismo, no máximo 72 bytes UTF-8. A senha não é aparada; espaços são parte da credencial.
- Login valida senha não vazia e até 128 caracteres para preservar compatibilidade com contas existentes; não reaplica a política de criação.
- E-mail duplicado retorna `409`. Credenciais incorretas retornam a mesma mensagem genérica `401`.
- Erros Zod retornam `400` com `message` e lista `errors`. Cadastro/login mapeiam erros de conexão/tabela do Sequelize para `503`; confira o middleware antes de generalizar isso para outras rotas.

### Senhas, tokens e limitação

- O hook `beforeSave` gera hash bcrypt com custo 12 quando a senha muda.
- O JWT contém `sub` e `role`; `JWT_EXPIRES_IN` define duração e seu padrão é `1d`.
- O middleware valida assinatura/expiração e consulta o usuário no banco em cada requisição protegida.
- Não há rota de logout, lista de sessões nem revogação imediata de JWT no logout.
- Um rate limiter em memória limita a 20 requisições por IP em 15 minutos e está conectado ao cadastro, login e `PATCH /me`. Isso não é um bloqueio por conta após tentativas erradas.

## Verificação local

O teste simula operações de persistência e não precisa conectar a um banco; porém, a configuração Sequelize exige variáveis `DB_*` ao carregar os models. Na pasta `backend/`, use valores descartáveis apenas no processo local, nunca as credenciais de produção:

```powershell
$env:DB_USER='test'
$env:DB_PASSWORD='test-only'
$env:DB_NAME='techub_test'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='5432'
$env:DB_DIALECT='postgres'
npm test
```

Estado observado nesta revisão: 13 testes passaram. Eles não comprovam compatibilidade com o esquema real nem persistência no PostgreSQL.

Para um teste manual, use somente banco descartável/autorizado, configure `backend/.env` sem sobrescrever um arquivo existente e abra `/api/docs`. `server.js` autentica no banco antes de iniciar. Não use dados reais nem execute migrations/seeds herdados contra banco compartilhado sem alinhamento explícito com a equipe.

## Pendências a decidir antes de evoluir o módulo

- Definir se uma versão futura deve exigir confirmação de e-mail. Se sim, completar estado persistido, token com prazo, envio real, endpoint de confirmação/reenvio e bloqueio do login. Essa é uma decisão funcional, não apenas documental.
- Confirmar se o cadastro deve manter nome obrigatório e papel `customer`, dado o produto acadêmico e o schema herdado.
- Acrescentar cobertura de `PATCH /me` e demais fluxos conforme necessário.
- Definir estratégia de expiração e revogação de sessões; JWT com expiração fixa não implementa sessão revogável.
- Revisar rate limiting em produção: o limitador atual é em memória e por IP, não por conta.

Não assuma que essas pendências já foram aprovadas ou concluídas. Mudanças em banco, entrega de e-mail, autenticação ou configuração publicada precisam de escopo e validação próprios.
