import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export type UserType = {
  id: string;
  email: string;
  password: string; // Keep the password for internal use
  firstName: string;
  lastName: string;
};

export type CreateUserType = Omit<UserType, 'id' | 'password'>; // Exclude password from creation input type

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

const userSchema = {
  table: 'users',
  columns: {
    email: 'email',
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
  },
};

const User = {
  async create(user: CreateUserType & { password: string }): Promise<Omit<UserType, 'password'>> {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10); // Hashing the password
      const query = `
        INSERT INTO ${userSchema.table} (${Object.values(userSchema.columns).join(', ')})
        VALUES ($1, $2, $3, $4)
        RETURNING id, ${Object.values(userSchema.columns).join(', ')}
      `;
      const values = [user.email, hashedPassword, user.firstName, user.lastName];
      const { rows } = await pool.query<UserType>(query, values);
      return {
        id: rows[0].id,
        email: rows[0].email,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async findByEmail(email: string): Promise<UserType | null> {
    try {
      const query = `
        SELECT id, ${Object.values(userSchema.columns).join(', ')}
        FROM ${userSchema.table}
        WHERE ${userSchema.columns.email} = $1
      `;
      const { rows } = await pool.query<UserType>(query, [email]);
      return rows.length > 0 ? {
        id: rows[0].id,
        email: rows[0].email,
        password: rows[0].password, // Should not be returned in production
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
      } : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<string | null> {
    const user = await this.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null; // Invalid credentials
    }
    
    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });
    return token;
  },
};

export default User;