// types.ts
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