const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function createOrUpdateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { bio, story, location, phone, aadhaarNumber } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ARTISAN') {
      throw new AppError('Only artisans can create profiles', 403);
    }

    const existing = await prisma.artisanProfile.findUnique({
      where: { userId },
    });

    let profile;
    if (existing) {
      profile = await prisma.artisanProfile.update({
        where: { userId },
        data: {
          bio,
          story,
          location,
          phone,
          aadhaarNumber,
          profileImage: profileImage || existing.profileImage,
        },
      });
    } else {
      profile = await prisma.artisanProfile.create({
        data: {
          userId,
          bio,
          story,
          location,
          phone,
          aadhaarNumber,
          profileImage,
        },
      });
    }

    return sendResponse(res, {
      statusCode: existing ? 200 : 201,
      success: true,
      message: existing ? 'Artisan profile updated' : 'Artisan profile created',
      data: { profile },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrUpdateProfile,
};

