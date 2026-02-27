const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function addToCart(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const qty = quantity ? Number(quantity) : 1;
    if (qty <= 0) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    const cartItem = await prisma.cart.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        quantity: qty,
      },
      create: {
        userId,
        productId,
        quantity: qty,
      },
      include: {
        product: true,
      },
    });

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Item added to cart',
      data: { item: cartItem },
    });
  } catch (error) {
    return next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const userId = req.user.id;
    const items = await prisma.cart.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Cart fetched successfully',
      data: { items },
    });
  } catch (error) {
    return next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const existing = await prisma.cart.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== userId) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cart.delete({ where: { id: itemId } });

    return sendResponse(res, {
      success: true,
      message: 'Cart item removed',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addToCart,
  getCart,
  removeCartItem,
};

