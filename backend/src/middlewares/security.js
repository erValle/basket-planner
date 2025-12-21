const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const express = require('express');

function securityMiddleware(app) {
    //Set security HTTP headers
    app.use(helmet());
    //Payload limit
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4000')
        .split(',')
        .map(origin => origin.trim());
        
    //CORS configuration
    app.use(cors({
        origin: function(origin, callback) {
            if(!origin) return callback(null, true);
            if(allowedOrigins.length === 0 ) return callback(null, true);
            if(allowedOrigins.includes(origin)){
                callback(null, true);
            }
            else {
                callback(new Error(`CORS blocked for origin ${origin}`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 120, 
        message: 'Too many requests from this IP, please try again later.',
        legacyHeaders: false,
        message: {error: "RATE_LIMIT", message: 'Too many requests from this IP, please try again later.'}
    });

    app.use('/api', apiLimiter);

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 20, 
        message: {error: "AUTH_RATE_LIMIT", message: 'Too many auth attempts from this IP, please try again later.'},
        legacyHeaders: false,
        standardHeaders: true,
    });

    app.use('/api/auth', authLimiter);
}

module.exports = securityMiddleware;