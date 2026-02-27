const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { shippingAddress, city, state, postalCode, country } = req.body;

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    if (!cartItems.length) {
      throw new AppError('Your cart is empty', 400);
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress,
          city,
          state,
          postalCode,
          country,
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      await tx.cart.deleteMany({ where: { userId } });

      return createdOrder;
    });

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Orders fetched successfully',
      data: { items: orders },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
};

