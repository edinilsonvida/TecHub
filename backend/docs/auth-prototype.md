# Tech Hub — protótipo parcial de cadastro e login

## Escopo e decisões

Esta versão atende parcialmente RF-01-1 (cadastro), RF-02-1 (login), RNF02 (hash da senha) e preserva o rate limiting existente relacionado ao RNF06. US01 e US02 não estão concluídas. Confirmação de e-mail e domínio institucional foram explicitamente adiados para este protótipo.

O backend mantém Express, CommonJS, Zod, Sequelize, bcryptjs e JWT. Não houve alteração em frontend, models, migrations, seeders ou esquema do banco. Não foi criada uma base de dados alternativa. A aplicação continua usando a integração Sequelize existente.

Compatibilidade temporária com a tabela herdada:
- Cadastro exige name porque o model e a tabela users atuais não aceitam nome vazio/nulo. É nome de exibição, não username.
- O controller grava role=customer. Esse é o valor legado disponível para conta comum; não significa que o produto Tech Hub terá compradores.
- A resposta e o JWT ainda apresentam customer. A migração para estudante/super-admin será alinhada com a equipe de banco.
- Cadastro rejeita role e quaisquer campos extras. O cliente não pode cadastrar seller/admin.
- Não alteramos os papéis ou o login de contas legadas já existentes.
- Cadastro retorna token imediatamente, sem confirmar e-mail, somente por ser um protótipo parcial autorizado.
- O JWT mantém JWT_EXPIRES_IN do ambiente, com padrão 1d. Isso não implementa sessão de 30 dias por inatividade nem revogação no logout.

## Arquivos

Caminhos relativos à pasta backend do repositório:

- src/validators/authValidators.js: normaliza e-mail no cadastro/login, exige letra e número na nova senha, rejeita campos extras no cadastro. Mesma política de nova senha usada pela troca de senha já existente.
- src/controllers/authController.js: fixa o papel customer no servidor e responde 409/503 em falhas específicas de persistência sem devolver detalhes internos de SQL.
- src/routes/authRoutes.js: preserva as rotas e o limitador existentes; documenta contrato e erros do protótipo.
- src/config/swagger.js: atualiza os schemas de cadastro e de nova senha; mantém o restante da documentação.
- package.json: acrescenta npm test.
- test/auth.test.js: testes HTTP com banco simulado exclusivamente durante os testes.
- docs/auth-prototype.md: este guia.

Não foi necessário um serviço/adaptador separado: a única compatibilidade de papel fica explícita no User.create do controller. O nome obrigatório permanece no validador.

## Como funciona o código

1. A rota recebe JSON e passa pelo limitador de requisições.
2. O controller chama o schema Zod; ele rejeita entradas inválidas antes de gravar.
3. O cadastro busca o e-mail normalizado. Se já existir, retorna 409.
4. User.create usa o model existente. Seu hook beforeSave gera salt e hash bcrypt com custo 12.
5. O controller chama toSafeJSON para excluir a senha/hash da resposta e assina um JWT com id e papel.
6. O login procura o usuário e compara a senha com bcrypt; não descriptografa a senha.
7. authenticate verifica o Bearer token e busca o usuário no banco antes de liberar /me.

A senha não recebe trim: espaços fazem parte da credencial. Novas senhas têm ao menos 8 caracteres, uma letra (inclusive acentuada) e um número de 0 a 9. O limite técnico é 72 bytes UTF-8, para evitar truncamento silencioso no bcrypt. Acentos podem ocupar mais de um byte. Referência: https://github.com/dcodeIO/bcrypt.js/#security-considerations

O login não reaplica a política de criação à senha existente: valida preenchimento e limite de 128 caracteres e faz a comparação. Isso preserva compatibilidade com contas legadas.

## Testar sem banco

No PowerShell, a partir da raiz do repositório TecHub:

    cd backend
    npm.cmd ci --ignore-scripts --no-audit --no-fund
    npm.cmd test

Node 18 ou superior é necessário para o executor de testes e fetch; a verificação desta entrega utilizou o Node instalado na máquina.

Os testes abrem um servidor temporário local e substituem somente operações de persistência de User por memória, mantendo Zod, Express, controllers, model, hook bcrypt e JWT reais. Não leem credenciais para conectar ao banco, não criam tabelas e não deixam contas persistidas. A chave JWT de teste é aleatória e vale somente nesse processo.

Eles verificam: validação e normalização, hash custo 12, token assinado, duplicidade, violação de unicidade retornada pelo banco simulado, rejeição de role/campos extras, login com sucesso, erro genérico, preservação dos espaços na senha, token ausente/inválido/expirado, usuário removido, banco/tabela indisponível e rate limit.

A simulação não comprova o esquema real, a persistência após reinício nem concorrência no PostgreSQL. Essas verificações dependem do banco entregue pela equipe.

## Preparar teste manual com banco

1. Solicite os dados de conexão e a confirmação de que a tabela users está pronta.
2. No VS Code, crie o arquivo backend/.env a partir de backend/.env.example, se ainda não existir. Preserve um .env já configurado.
3. Preencha DB_DIALECT, DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD com os dados do Tech Hub. Não reutilize automaticamente o banco ecommerce do Órbita.
4. Gere uma chave JWT para desenvolvimento com:

       node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"

   Coloque o resultado em JWT_SECRET. Não publique o .env.
5. Configure PORT=3002 para evitar colisão com o Órbita em localhost:3001. Mantenha FRONTEND_URL conforme a URL combinada com o frontend.
6. Execute:

       npm.cmd run dev

7. Abra http://localhost:3002/api/docs e use as rotas abaixo.

Não execute db:setup, migrations ou seeders herdados sem alinhar com a equipe de banco. O server.js testa a conexão antes de iniciar; a rota /api/health sozinha não comprova que a tabela users está pronta.

Sem banco acessível, o servidor existente não sobe. Se a conexão funcionar mas users estiver ausente/incompatível, cadastro/login retornam 503 para a falha SQL. Falhas de integridade como duplicidade retornam 409. Não há fallback automático para dados em memória na aplicação.

## 1. Cadastro

POST http://localhost:3002/api/auth/register
Content-Type: application/json

    {
      "name": "Maria Silva",
      "email": "maria@example.com",
      "password": "SenhaTeste123"
    }

Resposta esperada: 201.

    {
      "user": {
        "id": "<uuid>",
        "name": "Maria Silva",
        "email": "maria@example.com",
        "role": "customer",
        "createdAt": "<data ISO>",
        "updatedAt": "<data ISO>"
      },
      "token": "<JWT>"
    }

Os valores entre sinais de menor/maior são ilustrativos. Cadastro persiste a conta no banco configurado. A API não devolve senha/hash. Não envie username, role, accountType ou confirmPassword.

## 2. Login

POST http://localhost:3002/api/auth/login
Content-Type: application/json

    {
      "email": "maria@example.com",
      "password": "SenhaTeste123"
    }

Resposta esperada: 200, com o mesmo formato { user, token }. Copie o token para o próximo teste.

## 3. Usuário autenticado

GET http://localhost:3002/api/auth/me
Authorization: Bearer <JWT>

Resposta esperada: 200 { "user": { ... } }, sem senha ou hash.

No Swagger, clique em Authorize e cole somente o JWT; a interface acrescenta Bearer. Depois execute GET /auth/me.

## 4. Testar erros

- Repita o cadastro com o mesmo e-mail, inclusive mudando maiúsculas/minúsculas: 409.
- Envie senha abcdefgh, 12345678 ou Abc1234: 400.
- Envie e-mail sem formato válido, nome ausente ou role: 400.
- Faça login com senha errada ou e-mail inexistente: mesmo 401 e mensagem genérica.
- Chame /me sem token ou com token inválido/expirado: 401.
- Muitas chamadas de cadastro/login no mesmo IP: 429.

Exemplo de erro de validação, mantendo o formato do Tech Hub:

    {
      "message": "Dados inválidos.",
      "errors": [
        {
          "path": "password",
          "message": "A senha deve conter pelo menos um número"
        }
      ]
    }

Campos extras geram erro no objeto (path vazio), que a interface pode mostrar acima do formulário.

Credenciais incorretas:

    { "message": "E-mail ou senha inválidos." }

Serviço de contas indisponível:

    { "message": "Serviço de contas indisponível. Tente novamente mais tarde." }

O limitador atual compartilha 20 requisições por IP em 15 minutos entre cadastro, login e PATCH /me. Ele não é o bloqueio por conta após cinco senhas erradas exigido pelo PRD.

## Dependências da equipe de banco

- Conexão própria do Tech Hub e confirmação do schema/tabela disponível; nesta cópia não há .env configurado.
- Tabela users compatível com o model atual: UUID, name obrigatório até acordo contrário, email único normalizado, password com espaço para hash, role legado e timestamps.
- Definição oficial de estudante/super-admin e migração do ENUM; não promover contas seller antigas automaticamente.
- Possibilidade de criar conta sem nome até o preenchimento de perfil, conforme o PRD.
- Fonte persistida dos domínios institucionais, administrável e com ao menos um domínio ativo.
- Em features futuras: confirmação de e-mail, tentativas/bloqueio, suspensão e sessões revogáveis.

## Alinhamento com frontend e professor

A tela atual /cadastro ainda não chama a API e envia um conceito de username/tipo de conta que não corresponde a este contrato. A equipe de frontend deverá alinhar name, email e password temporários, tratar errors[].path e usar o Bearer token. A confirmação de senha fica na tela. O frontend precisa da URL/porta correta (3002 no exemplo).

O professor/equipe deve validar o adiamento dos critérios do PRD na entrega parcial, inclusive a exigência temporária de nome e o papel legado. A decisão técnica de expiração fixa versus inatividade permanece pendente.

## Próximas features e limitações

- RN18/US21: domínio institucional dinâmico e sua administração.
- RF-01-2: confirmação de e-mail de 24h, reenvio e bloqueio de acesso até confirmação.
- RF-02-2: bloqueio por conta após cinco falhas por 15 minutos.
- RF-02-3: sessão de 30 dias e logout com revogação imediata.
- RF-12-2: username após confirmação, com unicidade e regras do portfólio.
- US03/US04: seed inicial combinado com banco, convites de super-admin e primeiro acesso.
- Suspensão/reativação, proteção das rotas conforme estado da conta, exclusão de conta e dados.
- HTTPS no ambiente publicado, integração da proteção CSRF com a estratégia de sessão e logs/monitoramento. JWT Bearer atual não equivale por si só a atender todos os RNFs.
- Recuperação de senha: detalhar escopo com o professor; o PRD a menciona em RNF06 sem especificar uma história completa.
- 2FA: fora do escopo de US02 no PDF; não tratar como obrigação desta entrega.

Esta versão é para desenvolvimento e validação do núcleo de autenticação. Não é a entrega integral do módulo de contas.
