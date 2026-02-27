const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const User = require('./models/User');
const Artisan = require('./models/Artisan');
const Product = require('./models/Product');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for Seeding'))
    .catch(err => { console.error(err); process.exit(1); });

const seedArtisans = [
    {
        name: "Ramesh Kumar",
        email: "ramesh.k@example.com",
        village: "Etikoppaka",
        story: "I have been making wooden toys for 25 years. We use soft wood and natural dyes from seeds, lacquer, roots, and leaves to craft colorful, safe toys.",
        skills: ["Woodturning", "Natural Dyeing", "Lacquer artisan"],
        materials: "Ankudu wood, Natural dyes, Lac",
        photo: "https://images.unsplash.com/photo-1540304453527-62f97914fd76?w=400&q=80",
        products: [
            {
                name: "Traditional Etikoppaka Wooden Train",
                price: 450,
                description: "A vividly colored, non-toxic wooden train crafted using centuries-old techniques.",
                makingStory: "Each block is carefully turned on a lathe and colored using natural dyes extracted from purely organic materials like seeds and bark. Safe for children.",
                productionTime: "4 days",
                materials: "Ankudu wood, Natural dies",
                images: ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400"]
            },
            {
                name: "Lacquered Wooden Spinning Top",
                price: 150,
                description: "A fun and beautifully colored spinning top.",
                makingStory: "Carved from soft wood and coated with lacquer. The fast spinning action is a joy to watch.",
                productionTime: "2 days",
                materials: "Soft wood",
                images: ["https://images.unsplash.com/photo-1611077544834-8c08ea3cfbc1?w=400"]
            }
        ]
    },
    {
        name: "Sita Devi",
        email: "sitadevi@example.com",
        village: "Kondapalli",
        story: "My family has been making Kondapalli toys for generations. We pride ourselves on the intricate details and vibrant colors that tell stories of rural life.",
        skills: ["Wood Carving", "Miniature Painting", "Toy making"],
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
        products: [
            {
                name: "Kondapalli Dasavataram Set",
                price: 1800,
                description: "A complete set of the ten avatars of Vishnu, intricately carved and hand-painted.",
                makingStory: "This masterpiece takes weeks to complete. We carve each piece from Tella Poniki wood and mix our own vibrant watercolors.",
                productionTime: "15 days",
                materials: "Tella Poniki wood, Watercolors",
                images: ["https://images.unsplash.com/photo-1605335198075-84617dfb1129?w=400"]
            }
        ]
    },
    {
        name: "Krishna Rao",
        email: "krishnarao@example.com",
        village: "Mangalagiri",
        story: "I am a master weaver in Mangalagiri. We specialize in producing fine cotton sarees with distinctive zari borders.",
        skills: ["Handloom Weaving", "Dyeing", "Textile design"],
        photo: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80",
        products: [
            {
                name: "Pure Cotton Mangalagiri Saree",
                price: 2500,
                description: "A traditional Nizam border pure cotton saree, perfect for any occasion.",
                makingStory: "Woven meticulously on a pit loom. The design reflects the rich textile heritage of our region.",
                productionTime: "7 days",
                materials: "Pure cotton, Zari",
                images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400"]
            }
        ]
    }
];

const seedDB = async () => {
    try {
        console.log('Clearing existing data...');
        await Product.deleteMany();
        await Artisan.deleteMany();
        await User.deleteMany();

        console.log('Database cleared. Seeding starting...');

        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash("Password@123", salt);

        for (const data of seedArtisans) {
            // 1. Create User
            const user = await User.create({
                name: data.name,
                email: data.email,
                password: defaultPassword,
                role: "artisan",
                verified: true
            });

            // 2. Create Artisan Profile
            const artisan = new Artisan({
                userId: user._id,
                photo: data.photo,
                village: data.village,
                story: data.story,
                skills: data.skills,
                isApproved: true,
                location: { latitude: 17.6868, longitude: 83.2185 }
            });

            // Generate Artisan QR Code
            const artisanUrl = `http://localhost:3000/artisan.html?id=${artisan._id}`;
            const artisanQrCode = await QRCode.toDataURL(artisanUrl);
            artisan.qrCodeUrl = artisanQrCode;

            await artisan.save();
            console.log(`Created Artisan: ${data.name}`);

            // 3. Create Products for Artisan
            for (const prodData of data.products) {
                const product = new Product({
                    artisanId: user._id,
                    name: prodData.name,
                    price: prodData.price,
                    description: prodData.description,
                    materials: prodData.materials,
                    productionTime: prodData.productionTime,
                    makingStory: prodData.makingStory,
                    images: prodData.images
                });

                const productUrl = `http://localhost:3000/product.html?id=${product._id}`;
                const productQrCode = await QRCode.toDataURL(productUrl);
                product.qrCodeUrl = productQrCode;

                await product.save();
                console.log(`  Created Product: ${product.name}`);
            }
        }

        // Create a default customer to test with
        await User.create({
            name: "Test Customer",
            email: "customer@example.com",
            password: defaultPassword,
            role: "customer",
            verified: true
        });
        console.log('Created Default Customer: customer@example.com');

        console.log('Database Seeding Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error(`Error with seeding: ${error.message}`);
        process.exit(1);
    }
};

seedDB();
