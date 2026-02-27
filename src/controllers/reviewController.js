const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function createOrUpdateReview(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const parsedRating = Number(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        rating: parsedRating,
        comment,
      },
      create: {
        userId,
        productId,
        rating: parsedRating,
        comment,
      },
      include: {
        user: true,
      },
    });

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    return next(error);
  }
}

async function getReviewsForProduct(req, res, next) {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Reviews fetched successfully',
      data: { items: reviews },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrUpdateReview,
  getReviewsForProduct,
};

