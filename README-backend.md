## Local for Vocal – Visakhapatnam Artisans Platform (Backend)

This is the **production-ready backend API** for the **Local for Vocal – Visakhapatnam Artisans Platform**, built with:

- **Node.js + Express.js**
- **PostgreSQL + Prisma ORM**
- **JWT authentication**
- **bcrypt** for password hashing
- **Nodemailer** for email verification and password reset
- **Multer** for image uploads
- **dotenv**, **CORS**, **Helmet**, **Morgan**

### 1. Project Structure

- `src/app.js` – Express app, middlewares, route mounting
- `src/server.js` – HTTP server bootstrap
- `src/prisma/client.js` – Prisma client instance
- `src/controllers` – Route handlers
- `src/routes` – Express routers
- `src/middleware` – Auth, roles, validation, error handling, uploads
- `src/services` – Business logic (auth, email, etc.)
- `prisma/schema.prisma` – Prisma models
- `uploads/` – Uploaded images (profile, product, handmade proof)

### 2. Setup Instructions

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   - Copy `.env.example` to `.env` in the project root.
   - Update values:
     - `DATABASE_URL` – PostgreSQL connection string
     - `JWT_SECRET` – secure random secret
     - `SMTP_*` values – SMTP credentials for Nodemailer (e.g. Ethereal, Gmail, etc.)
     - `APP_URL` – backend URL (e.g. `http://localhost:5000`)
     - `CLIENT_URL` – frontend URL (for links)

3. **Prisma migrate & generate**

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`.

### 3. Prisma Models Overview

Defined in `prisma/schema.prisma`:

- `User` – customers, artisans, admins (with `role`, `isVerified`, tokens)
- `ArtisanProfile` – artisan story, bio, location, phone, Aadhaar (optional), profile image, approval flag
- `Category` – product categories
- `Product` – includes traceability fields:
  - `artisanStory`
  - `productionDate`
  - `materials` (string array)
  - `handmadeProofImageUrl`
  - `geoLatitude` / `geoLongitude`
  - image gallery
- `Cart` – per-user cart line items (product + quantity)
- `Order` / `OrderItem` – orders and their items
- `Review` – product reviews with unique `(userId, productId)`

### 4. Security

- **JWT middleware**: `src/middleware/authMiddleware.js`
- **Role-based access control**: `src/middleware/roleMiddleware.js`
- **Input validation**: `express-validator` + `src/middleware/validateRequest.js`
- **Error handling**: centralized in `src/middleware/errorMiddleware.js`
- **Helmet** + **CORS** + **Morgan** configured in `src/app.js`
- **SQL injection protection** via Prisma parameterization
- **Secure password storage** using `bcryptjs`

All JSON responses follow:

```json
{
  "success": true,
  "message": "Some message",
  "data": {}
}
```

### 5. Core Endpoints

Base URL: `/api`

#### Auth

- **POST** `/api/auth/register`
  - Body: `{ "name", "email", "password", "role": "customer" | "artisan" }`
  - Hashes password, creates user with `isVerified = false`, sends email verification link.

- **GET** `/api/auth/verify-email/:token`
  - Activates account linked to verification token.

- **POST** `/api/auth/login`
  - Body: `{ "email", "password" }`
  - Returns `{ token, user }` (password removed).

- **POST** `/api/auth/forgot-password`
  - Body: `{ "email" }`
  - Sends password reset link if user exists.

- **POST** `/api/auth/reset-password/:token`
  - Body: `{ "password" }`
  - Resets user password.

#### Artisan

- **POST** `/api/artisan/create-profile`
  - Auth: JWT, role `ARTISAN`
  - Upload: `profileImage` (image)
  - Body: `{ "bio", "story", "location", "phone", "aadhaarNumber?" }`

#### Products (with traceability)

- **POST** `/api/products`
  - Auth: JWT, role `ARTISAN`, approved `ArtisanProfile` required
  - Upload: `images` (multiple), `handmadeProof` (single)
  - Body:
    ```json
    {
      "title": "",
      "description": "",
      "price": 0,
      "stock": 0,
      "category": "Handcrafted Decor",
      "materials": "wood, paint",
      "productionTime": "3-5 days",
      "geoLocationLat": 17.6868,
      "geoLocationLng": 83.2185,
      "artisanStory": "Optional override; defaults to artisan profile story"
    }
    ```
  - Product keeps:
    - artisan story
    - production date (auto `createdAt` / `productionDate`)
    - materials
    - handmade proof image URL
    - geo-location tag

- **GET** `/api/products`
  - Query:
    - `page`, `limit`
    - `category` (name or slug)
    - `search` (title/description)
    - `sort` = `price_asc | price_desc`

- **GET** `/api/products/:id`

- **GET** `/api/products/artisan/:id`

- **PUT** `/api/products/:id`
  - Auth: JWT artisan, must own product
  - Supports updating metadata + images/handmade proof.

- **DELETE** `/api/products/:id`
  - Auth: JWT artisan, must own product.

#### Cart

- **POST** `/api/cart`
  - Auth: JWT, role `CUSTOMER`
  - Body: `{ "productId", "quantity": 1 }`

- **GET** `/api/cart`
  - Auth: JWT, role `CUSTOMER`

- **DELETE** `/api/cart/:itemId`
  - Auth: JWT, role `CUSTOMER`

#### Orders

- **POST** `/api/orders`
  - Auth: JWT, role `CUSTOMER`
  - Body:
    ```json
    {
      "shippingAddress": "",
      "city": "",
      "state": "",
      "postalCode": "",
      "country": ""
    }
    ```
  - Creates order from current cart; moves all cart items into `OrderItem`s and clears cart.

- **GET** `/api/orders/my-orders`
  - Auth: JWT, role `CUSTOMER`

#### Reviews

- **POST** `/api/reviews`
  - Auth: JWT
  - Body:
    ```json
    {
      "productId": "",
      "rating": 5,
      "comment": "Great craftsmanship!"
    }
    ```
  - Upserts review per user/product.

- **GET** `/api/reviews/:productId`

#### Admin

- **GET** `/api/admin/users`
  - Auth: JWT, role `ADMIN`

- **GET** `/api/admin/artisans`
  - Auth: JWT, role `ADMIN`

- **PUT** `/api/admin/approve-artisan/:id`
  - Auth: JWT, role `ADMIN`
  - Marks the artisan’s `ArtisanProfile.isApproved = true`.

- **DELETE** `/api/admin/remove-user/:id`
  - Auth: JWT, role `ADMIN`
  - Deletes user (with cascading deletes for related records).

### 6. Postman Testing Examples

You can import these conceptual flows into Postman:

- **Register & verify**
  1. `POST /api/auth/register`
  2. Check email (SMTP inbox) for verification link
  3. `GET /api/auth/verify-email/:token`

- **Login**
  1. `POST /api/auth/login`
  2. Copy `data.token` into Postman auth: `Bearer <token>`

- **Artisan flow**
  1. Register artisan
  2. Admin login → `PUT /api/admin/approve-artisan/:id`
  3. Artisan login → `POST /api/artisan/create-profile`
  4. `POST /api/products` with form-data (images + handmadeProof)

- **Customer flow**
  1. Register customer → verify → login
  2. `GET /api/products`
  3. `POST /api/cart`
  4. `GET /api/cart`
  5. `POST /api/orders`
  6. `GET /api/orders/my-orders`
  7. `POST /api/reviews`

### 7. Running Commands Recap

From the project root:

```bash
npm install
npx prisma migrate dev
npm run dev
```

This will bring up a fully functional backend that satisfies all the specified endpoints, security, and traceability requirements.

