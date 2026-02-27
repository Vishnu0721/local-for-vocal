const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = users.map((u) => {
      // eslint-disable-next-line no-unused-vars
      const { password, emailVerificationToken, emailVerificationTokenExpires, resetPasswordToken, resetPasswordTokenExpires, ...rest } =
        u;
      return rest;
    });

    return sendResponse(res, {
      success: true,
      message: 'Users fetched successfully',
      data: { items: sanitized },
    });
  } catch (error) {
    return next(error);
  }
}

async function getArtisans(req, res, next) {
  try {
    const artisans = await prisma.user.findMany({
      where: { role: 'ARTISAN' },
      include: {
        artisanProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = artisans.map((u) => {
      // eslint-disable-next-line no-unused-vars
      const { password, emailVerificationToken, emailVerificationTokenExpires, resetPasswordToken, resetPasswordTokenExpires, ...rest } =
        u;
      return rest;
    });

    return sendResponse(res, {
      success: true,
      message: 'Artisans fetched successfully',
      data: { items: sanitized },
    });
  } catch (error) {
    return next(error);
  }
}

async function approveArtisan(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { artisanProfile: true },
    });

    if (!user || user.role !== 'ARTISAN') {
      throw new AppError('Artisan not found', 404);
    }

    if (!user.artisanProfile) {
      throw new AppError('Artisan profile not found', 404);
    }

    const profile = await prisma.artisanProfile.update({
      where: { id: user.artisanProfile.id },
      data: {
        isApproved: true,
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Artisan approved successfully',
      data: { profile },
    });
  } catch (error) {
    return next(error);
  }
}

async function removeUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({ where: { id } });

    return sendResponse(res, {
      success: true,
      message: 'User removed successfully',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getArtisans,
  approveArtisan,
  removeUser,
};

