import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export type HotelType = {
  id: number;
  userId: number; // Foreign key to the User model
  name: string;
  city: string;
  country: string;
  description: string;
  type: string;
  pricePerNight: number;
  starRating: number;
  adultCount: number;
  childCount: number;
  facilities: string[];
  imageUrls: string[];
};

export type CreateHotelType = Omit<HotelType, 'id'>;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Create a new hotel
export const create = async (hotel: CreateHotelType): Promise<HotelType> => {
  try {
    const query = `
      INSERT INTO hotels (userId, name, city, country, description, type, pricePerNight, starRating, adultCount, childCount, facilities, imageUrls)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      hotel.userId,
      hotel.name,
      hotel.city,
      hotel.country,
      hotel.description,
      hotel.type,
      hotel.pricePerNight,
      hotel.starRating,
      hotel.adultCount,
      hotel.childCount,
      hotel.facilities, // Pass facilities as an array
      hotel.imageUrls,  // Pass imageUrls as an array
    ];
    const { rows } = await pool.query<HotelType>(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating hotel:', error);
    throw error;
  }
};

// Find hotels by user ID
export const findByUserId = async (userId: number): Promise<HotelType[]> => {
  try {
    const query = 'SELECT * FROM hotels WHERE userId = $1';
    const { rows } = await pool.query<HotelType>(query, [userId]);
    return rows;
  } catch (error) {
    console.error('Error finding hotels by user ID:', error);
    throw error;
  }
};