const { z } = require('zod');

// Regras compartilhadas pelo cadastro e pela troca de senha.
// bcrypt considera no máximo 72 bytes: rejeitamos excedentes, sem truncar.
const passwordSchema = z.string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/\p{L}/u, 'A senha deve conter pelo menos uma letra')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'A senha deve ter no máximo 72 bytes em UTF-8.',
  });

const emailSchema = z.string().trim().email('E-mail inválido').max(255).toLowerCase();

const registerSchema = z.object({
  // Temporário: a tabela herdada exige name. Não é o username do portfólio.
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  email: emailSchema,
  password: passwordSchema,
}).strict('Envie apenas name, email e password. O papel da conta é definido pelo servidor.');

const loginSchema = z.object({
  email: emailSchema,
  // Login compara a credencial existente; não aplica a política de novas senhas.
  password: z.string().min(1, 'Senha é obrigatória').max(128),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(100).optional(),
    email: z.string().trim().email('E-mail inválido').max(255).optional(),
    password: passwordSchema.optional(),
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  })
  .refine((data) => data.name || data.email || data.password, {
    message: 'Informe ao menos um campo para atualizar.',
    path: ['name'],
  });

module.exports = { registerSchema, loginSchema, updateProfileSchema };
