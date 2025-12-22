// WebSocket Server Configuration

const config = {
    // Environment: 'development' or 'production'
    environment: process.env.NODE_ENV || 'development',
    
    // Development configuration
    development: {
        port: 3000,
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
            methods: ['GET', 'POST'],
            credentials: true
        },
        logging: {
            enabled: true,
            verbose: true
        }
    },
    
    // Production configuration
    production: {
        // Render.com uses PORT env variable, fallback to 3000 (removed WS_PORT)
        port: process.env.PORT || 3000,
        cors: {
            origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://tipzone.cz', 'https://www.tipzone.cz'],
            methods: ['GET', 'POST'],
            credentials: true
        },
        logging: {
            enabled: true,
            verbose: false
        }
    },
    
    // Get current environment config
    get current() {
        return this[this.environment];
    }
};

module.exports = config;
