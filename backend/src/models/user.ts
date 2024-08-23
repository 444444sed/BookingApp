import { Pool } from 'pg';
import bcrypt from 'bcrypt';

export type UserType = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type CreateUserType = Omit<UserType, 'id'>;

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
  async create(user: CreateUserType): Promise<UserType> {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 8);
      const query = `
        INSERT INTO ${userSchema.table} (${Object.values(userSchema.columns).join(', ')})
        VALUES ($1, $2, $3, $4)
        RETURNING ${Object.values(userSchema.columns).join(', ')}
      `;
      const values = [user.email, hashedPassword, user.firstName, user.lastName];
      console.log('Executing query:', query, 'with values:', values);
      const { rows } = await pool.query<UserType>(query, values);
      console.log('Created user:', rows[0]);
      return {
        id: rows[0].id,
        email: rows[0].email,
        password: rows[0].password,
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
        SELECT ${Object.values(userSchema.columns).join(', ')}
        FROM ${userSchema.table}
        WHERE ${userSchema.columns.email} = $1
      `;
      const { rows } = await pool.query<UserType>(query, [email]);
      console.log('Found user:', rows[0]);
      return rows.length > 0 ? {
        id: rows[0].id,
        email: rows[0].email,
        password: rows[0].password,
        firstName: rows[0].firstName,
        lastName: rows[0].lastName,
      } : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },
};

export default User;