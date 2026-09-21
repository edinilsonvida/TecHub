const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/authValidators');
const { ApiError } = require('../middlewares/errorHandler');

// Mantém o formato de erro existente sem registrar SQL ou valores de credenciais.
function handleAuthError(err, res, next) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
  }
  if (err.name === 'SequelizeDatabaseError' || err.name.startsWith('SequelizeConnection')
    || err.name === 'SequelizeHostNotFoundError' || err.name === 'SequelizeHostNotReachableError'
    || err.name === 'SequelizeAccessDeniedError') {
    return res.status(503).json({ message: 'Serviço de contas indisponível. Tente novamente mais tarde.' });
  }
  return next(err);
}


async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
    }

    // Compatibilidade temporária com o ENUM existente, sem alterar o banco.
    // Nunca aceite role do cliente nem atribua seller/admin no cadastro público.
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      role: 'customer',
    });

    const token = signToken({ sub: user.id, role: user.role });

    res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      user: user.toSafeJSON(),
      token,
    });
  } catch (err) {
    handleAuthError(err, res, next);
  }
}




// Confere e-mail e senha e gera uma nova sessão JWT para o usuário.
async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ where: { email: data.email.toLowerCase() } });
    const genericError = { message: 'E-mail ou senha inválidos.' };

    if (!user) {
      return res.status(401).json(genericError);
    }

    const valid = await user.validatePassword(data.password);
    if (!valid) {
      return res.status(401).json(genericError);
    }

    const token = signToken({ sub: user.id, role: user.role });
    res.json({ user: user.toSafeJSON(), token });
  } catch (err) {
    handleAuthError(err, res, next);
  }
}

// Retorna os dados seguros do usuário autenticado na requisição.
async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

// Confirma a senha atual e atualiza os dados permitidos do perfil.
async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = req.user;

    const validCurrentPassword = await user.validatePassword(data.currentPassword);
    if (!validCurrentPassword) {
      throw new ApiError(401, 'Senha atual incorreta.');
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ where: { email: data.email.toLowerCase() } });
      if (existing) {
        return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
      }
      user.email = data.email;
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.password) {
      user.password = data.password;
    }

    await user.save();

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile };
