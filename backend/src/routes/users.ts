import express, { Request, Response } from 'express';
import User, { UserType, CreateUserType } from '../models/user';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';

const router = express.Router();

router.post(
  '/register',
  [
    check('firstName', 'First name is required').isString(),
    check('lastName', 'Last name is required').isString(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password with 6 or more characters required').isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      const { firstName, lastName, email, password }: CreateUserType = req.body;

      // Check if the user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create a new user
      const newUser: UserType = await User.create({
        email,
        password,
        firstName,
        lastName,
      });

      const token = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: '1d',
        }
      );

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400000,
      });

      return res.status(200).send({ message: 'User registered OK' });
    } catch (error) {
      console.error('Error details:', error);
      return res.status(500).send({ message: (error as Error).message });
    }
  }
);

export default router;