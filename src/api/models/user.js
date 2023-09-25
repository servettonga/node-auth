/* istanbul ignore file */
import argon2 from 'argon2';
import { model, Schema } from 'mongoose';
import validator from 'validator';

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: [true, 'This username is already taken']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: [true, 'This email is already registered'],
        lowercase: true,
        validate: [
            validator.isEmail,
            'Please provide a valid email address'
        ]
    },
    admin: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    }
}, { strict: true })
    .index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 1 }, sparse: true })

    .pre('save', async function (next) {
        try {
            if (this.isModified('password') || this.isNew) {
                const hashed = await argon2.hash(this.get('password'));
                this.set('password', hashed);
            }
            return next();
        } catch (err) {
            return next(err);
        }
        next();
    })

    .pre('findOneAndUpdate', async function (next) {
        try {
            if (this._update.password) {
                this._update.password = await argon2.hash(this._update.password);
            }
            next();
        } catch (err) {
            return next(err);
        }
    })

    .set('toJSON', {
        transform: (doc, ret, _options) => {
            ret.created = ret.created.toISOString();

            delete ret.password;
            delete ret._id;
            delete ret.__v;
        }
    })

    .method('comparePassword', async function (password) {
        try {
            if (password) {
                return await argon2.verify(this.password, password);
            }
        } catch {
            return false;
        }
    });

/**
 * User schema
 * @returns mongoose.Model
 * @param {Object} User
 * @param {string} User.username Unique username
 * @param {string} User.email Unique email
 * @param {string} User.password At least 8 characters long
 */
export default model('User', userSchema);
