const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');
const { sendEmail } = require('./emailService');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

function mapRoleInput(role) {
  if (!role) return 'CUSTOMER';
  const normalized = role.toString().toLowerCase();
  if (normalized === 'artisan') return 'ARTISAN';
  if (normalized === 'admin') return 'ADMIN';
  return 'CUSTOMER';
}

function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, emailVerificationToken, emailVerificationTokenExpires, resetPasswordToken, resetPasswordTokenExpires, ...rest } =
    user;
  return rest;
}

async function registerUser({ name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email is already registered', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const prismaRole = mapRoleInput(role);

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: prismaRole,
      isVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpires,
    },
  });

  const verifyUrl = `${APP_URL}/api/auth/verify-email/${emailVerificationToken}`;
  await sendEmail({
    to: email,
    subject: 'Verify your Local for Vocal account',
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to Local for Vocal – Visakhapatnam Artisans Platform.</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });

  return sanitizeUser(user);
}

async function verifyEmail(token) {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    },
  });

  return sanitizeUser(updated);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Do not reveal user existence
    return;
  }

  const resetPasswordToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken,
      resetPasswordTokenExpires,
    },
  });

  const resetUrl = `${APP_URL}/api/auth/reset-password/${resetPasswordToken}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Local for Vocal password',
    html: `
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}

async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired password reset token', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null,
    },
  });
}

module.exports = {
  registerUser,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
};

