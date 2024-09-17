import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import { HotelType } from "../../backend/src/shared/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Register a new user
export const register = async (formData: RegisterFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
    });

    const responseBody = await response.json();

    if (!response.ok) {
        throw new Error(responseBody.message || "Registration failed");
    }
};

// Sign in a user
export const signIn = async (formData: SignInFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const body = await response.json();
    
    if (!response.ok) {
        throw new Error(body.message || "Sign-in failed");
    }

    return body;
};

// Validate the user's token
export const validateToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Token invalid");
    }

    return response.json();
};

// Sign out a user
export const signOut = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Error during sign out");
    }
};

// Add a new hotel
export const addMyHotel = async (hotelFormData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/api/my-hotels`, {
        method: "POST",
        credentials: "include",
        body: hotelFormData,
    });

    if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to add hotel");
    }

    return response.json();
};

// Fetch the user's hotels
export const fetchMyHotels = async (): Promise<HotelType[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/my-hotels`, {
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Error fetching hotels: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log('API response data:', JSON.stringify(data, null, 2)); // Log the full response

        return data as HotelType[];
    } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Rethrow the error for handling in the component
    }
};