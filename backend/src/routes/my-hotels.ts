// my-hotels.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import * as Hotel from '../models/hotel'; // Import the hotel model
import verifyToken from '../middleware/auth'; // Middleware to verify JWT
import cloudinary from 'cloudinary';
import { body, validationResult } from 'express-validator';
import { HotelType } from '../shared/types';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Hotel creation route
router.post(
    '/',
    verifyToken,
    upload.array('imageFiles', 6), // Accept up to 6 images
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('country').notEmpty().withMessage('Country is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('type').notEmpty().withMessage('Type is required'),
        body('pricePerNight').isNumeric().withMessage('Price must be a number'),
        body('starRating').isNumeric().withMessage('Star rating must be a number'),
        body('adultCount').isNumeric().withMessage('Adult count must be a number'),
        body('childCount').isNumeric().withMessage('Child count must be a number'),
        body('facilities').isArray().withMessage('Facilities must be an array'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Extract userId from the request
            const userId = parseInt(req.userId as string, 10);
            if (isNaN(userId)) {
                return res.status(401).json({ message: 'Invalid user ID' });
            }

            // Prepare hotel data
            const facilitiesArray = Array.isArray(req.body.facilities)
                ? req.body.facilities.map((f: string) => f.trim())
                : [];

            const newHotel: Omit<HotelType, 'id'> = {
                userId: userId,
                name: req.body.name,
                city: req.body.city,
                country: req.body.country,
                description: req.body.description,
                type: req.body.type,
                pricePerNight: parseFloat(req.body.pricePerNight),
                starRating: parseInt(req.body.starRating, 10),
                adultCount: parseInt(req.body.adultCount, 10),
                childCount: parseInt(req.body.childCount, 10),
                facilities: facilitiesArray,
                imageUrls: [],
            };

            // Upload images to Cloudinary
            const imageUploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;
                const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
                return uploadResponse.url; // Return the image URL
            });

            newHotel.imageUrls = await Promise.all(imageUploadPromises);

            // Create the hotel record
            const createdHotel = await Hotel.create(newHotel);
            res.status(201).json(createdHotel);
        } catch (error) {
            console.error('Error creating hotel:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

// Route to find hotels by user ID
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.userId as string, 10);
        if (isNaN(userId)) {
            return res.status(401).json({ message: 'Invalid user ID' });
        }

        const hotels = await Hotel.findByUserId(userId);
        res.json(hotels);
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).json({ message: "Error fetching hotels" });
    }
});

export default router;