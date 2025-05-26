const database = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    constructor(data = {}) {
        this.id = data.id;
        this.email = data.email;
        this.name = data.name;
        this.password = data.password;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.last_login = data.last_login;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.api_key = data.api_key;
    }

    // Create new user
    static async create({ email, name, password }) {
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate API key
            const apiKey = require('crypto').randomBytes(32).toString('hex');

            const query = `
        INSERT INTO users (email, name, password, api_key)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, created_at, is_active, api_key
      `;

            const result = await database.query(query, [email, name, hashedPassword, apiKey]);
            return new User(result.rows[0]);
        } catch (error) {
            if (error.code === '23505' && error.constraint === 'users_email_key') {
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
            const result = await database.query(query, [email]);

            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
            const result = await database.query(query, [id]);

            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by API key
    static async findByApiKey(apiKey) {
        try {
            const query = 'SELECT * FROM users WHERE api_key = $1 AND is_active = true';
            const result = await database.query(query, [apiKey]);

            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Verify password
    async verifyPassword(password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw error;
        }
    }

    // Update last login
    async updateLastLogin() {
        try {
            const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING last_login
      `;

            const result = await database.query(query, [this.id]);
            this.last_login = result.rows[0].last_login;
            return this.last_login;
        } catch (error) {
            throw error;
        }
    }

    // Update user profile
    async update({ name, email }) {
        try {
            const query = `
        UPDATE users 
        SET name = COALESCE($1, name),
            email = COALESCE($2, email),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, email, name, updated_at
      `;

            const result = await database.query(query, [name, email, this.id]);
            const updated = result.rows[0];

            // Update current instance
            this.name = updated.name;
            this.email = updated.email;
            this.updated_at = updated.updated_at;

            return this;
        } catch (error) {
            if (error.code === '23505' && error.constraint === 'users_email_key') {
                throw new Error('Email already in use');
            }
            throw error;
        }
    }

    // Change password
    async changePassword(newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            const query = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

            await database.query(query, [hashedPassword, this.id]);
            this.password = hashedPassword;

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Regenerate API key
    async regenerateApiKey() {
        try {
            const newApiKey = require('crypto').randomBytes(32).toString('hex');

            const query = `
        UPDATE users 
        SET api_key = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING api_key
      `;

            const result = await database.query(query, [newApiKey, this.id]);
            this.api_key = result.rows[0].api_key;

            return this.api_key;
        } catch (error) {
            throw error;
        }
    }

    // Deactivate user (soft delete)
    async deactivate() {
        try {
            const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

            await database.query(query, [this.id]);
            this.is_active = false;

            return this;
        } catch (error) {
            throw error;
        }
    }

    // Get user statistics
    static async getStats() {
        try {
            const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN last_login > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days,
          COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_last_7_days
        FROM users
      `;

            const result = await database.query(query);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get user's classification history count
    async getClassificationCount() {
        try {
            const query = `
        SELECT COUNT(*) as classification_count
        FROM classifications 
        WHERE user_id = $1
      `;

            const result = await database.query(query, [this.id]);
            return parseInt(result.rows[0].classification_count);
        } catch (error) {
            throw error;
        }
    }

    // Convert to safe object (without password)
    toSafeObject() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            created_at: this.created_at,
            updated_at: this.updated_at,
            last_login: this.last_login,
            is_active: this.is_active,
            api_key: this.api_key
        };
    }

    // Convert to public object (minimal info)
    toPublicObject() {
        return {
            id: this.id,
            name: this.name,
            created_at: this.created_at
        };
    }
}

module.exports = User;