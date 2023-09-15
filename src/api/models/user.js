/* istanbul ignore file */
import argon2 from 'argon2';
import { Schema, model } from 'mongoose';
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
    }}, { strict: true })
    .index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 1 }, sparse: true })


    .pre('save', async function (next) {
        if (this.isModified('password') || this.isNew) {
            const hashed = await argon2.hash(this.get('password'));
            this.set('password', hashed);
        }
        next();
    })

    .set('toJSON', {
        transform: (doc, ret, options) => {
            ret.created = ret.created.getTime();

            delete ret.password;
            delete ret._id;
            delete ret.__v;
        }
    })

    .method('comparePassword', async function (password) {
        if (password) {
            return await argon2.verify(this.password, password);
        }
        throw Error('Invalid password');
    })

/**
 * User schema
 * @returns mongoose.Model
 * @param {Object} User
 * @param {string} User.username Unique username
 * @param {string} User.email Unique email
 * @param {string} User.password At least 8 characters long
 */
export default model('User', userSchema);
