const prisma = require('../prisma/client');
const { sendResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

async function createProduct(req, res, next) {
  try {
    const userId = req.user.id;

    const {
      title,
      description,
      price,
      stock,
      category,
      materials,
      productionTime,
      geoLocationLat,
      geoLocationLng,
      artisanStory,
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ARTISAN') {
      throw new AppError('Only artisans can create products', 403);
    }

    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile || !profile.isApproved) {
      throw new AppError('Artisan profile must be created and approved before adding products', 403);
    }

    const imageFiles = (req.files && req.files.images) || [];
    const images = imageFiles.map((f) => `/uploads/${f.filename}`);

    const handmadeProofFile = req.files && req.files.handmadeProof ? req.files.handmadeProof[0] : null;
    const handmadeProofImageUrl = handmadeProofFile ? `/uploads/${handmadeProofFile.filename}` : null;

    const materialsArray =
      typeof materials === 'string'
        ? materials.split(',').map((m) => m.trim()).filter(Boolean)
        : Array.isArray(materials)
        ? materials
        : [];

    let categoryRecord = null;
    if (category) {
      const slug = category.toString().toLowerCase().replace(/\s+/g, '-');
      categoryRecord = await prisma.category.upsert({
        where: { slug },
        update: { name: category },
        create: { name: category, slug },
      });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: Number(price),
        stock: Number(stock),
        materials: materialsArray,
        productionTime,
        geoLatitude: Number(geoLocationLat),
        geoLongitude: Number(geoLocationLng),
        artisanStory: artisanStory || profile.story,
        images,
        handmadeProofImageUrl,
        artisanId: userId,
        artisanProfileId: profile.id,
        categoryId: categoryRecord ? categoryRecord.id : null,
      },
      include: {
        category: true,
        artisan: true,
        artisanProfile: true,
      },
    };

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search, sort } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        OR: [{ name: { equals: category, mode: 'insensitive' } }, { slug: { equals: category.toLowerCase() } }],
      };
    }

    let orderBy = undefined;
    if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          artisan: true,
          artisanProfile: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return sendResponse(res, {
      success: true,
      message: 'Products fetched successfully',
      data: {
        items: products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        artisan: true,
        artisanProfile: true,
        reviews: { include: { user: true } },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return sendResponse(res, {
      success: true,
      message: 'Product fetched successfully',
      data: { product },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProductsByArtisan(req, res, next) {
  try {
    const { id } = req.params;
    const products = await prisma.product.findMany({
      where: { artisanId: id },
      include: {
        category: true,
        artisanProfile: true,
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Artisan products fetched successfully',
      data: { items: products },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    if (existing.artisanId !== userId) {
      throw new AppError('You can only update your own products', 403);
    }

    const {
      title,
      description,
      price,
      stock,
      category,
      materials,
      productionTime,
      geoLocationLat,
      geoLocationLng,
      artisanStory,
    } = req.body;

    const imageFiles = (req.files && req.files.images) || [];
    const images =
      imageFiles.length > 0 ? imageFiles.map((f) => `/uploads/${f.filename}`) : existing.images || [];

    const handmadeProofFile = req.files && req.files.handmadeProof ? req.files.handmadeProof[0] : null;
    const handmadeProofImageUrl =
      handmadeProofFile ? `/uploads/${handmadeProofFile.filename}` : existing.handmadeProofImageUrl;

    const materialsArray =
      typeof materials === 'string'
        ? materials.split(',').map((m) => m.trim()).filter(Boolean)
        : Array.isArray(materials)
        ? materials
        : existing.materials;

    let categoryId = existing.categoryId;
    if (category) {
      const slug = category.toString().toLowerCase().replace(/\s+/g, '-');
      const categoryRecord = await prisma.category.upsert({
        where: { slug },
        update: { name: category },
        create: { name: category, slug },
      });
      categoryId = categoryRecord.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        materials: materialsArray,
        productionTime: productionTime ?? existing.productionTime,
        geoLatitude: geoLocationLat !== undefined ? Number(geoLocationLat) : existing.geoLatitude,
        geoLongitude: geoLocationLng !== undefined ? Number(geoLocationLng) : existing.geoLongitude,
        artisanStory: artisanStory ?? existing.artisanStory,
        images,
        handmadeProofImageUrl,
        categoryId,
      },
    });

    return sendResponse(res, {
      success: true,
      message: 'Product updated successfully',
      data: { product: updated },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    if (existing.artisanId !== userId) {
      throw new AppError('You can only delete your own products', 403);
    }

    await prisma.product.delete({ where: { id } });

    return sendResponse(res, {
      success: true,
      message: 'Product deleted successfully',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductsByArtisan,
  updateProduct,
  deleteProduct,
};

