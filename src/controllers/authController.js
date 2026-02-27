const {
  registerUser,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
} = require('../services/authService');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const user = await registerUser({ name, email, password, role });

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyEmailController(req, res, next) {
  try {
    const { token } = req.params;
    const user = await verifyEmail(token);

    return sendResponse(res, {
      success: true,
      message: 'Email verified successfully. You can now log in.',
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await login({ email, password });

    return sendResponse(res, {
      success: true,
      message: 'Login successful',
      data: { token, user },
    });
  } catch (error) {
    return next(error);
  }
}

async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    await forgotPassword(email);

    return sendResponse(res, {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPasswordController(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      throw new AppError('New password is required', 400);
    }

    await resetPassword(token, password);

    return sendResponse(res, {
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  verifyEmailController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
};

