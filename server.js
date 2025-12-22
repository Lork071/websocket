const { Server } = require('socket.io');
const config = require('./config');

// Get current environment configuration
const envConfig = config.current;

// WebSocket server
const io = new Server(envConfig.port, {
    cors: envConfig.cors
});

console.log(`WebSocket server starting in ${config.environment} mode on port ${envConfig.port}`);
console.log('CORS origins:', envConfig.cors.origin);

// Store active users per event
const activeUsers = new Map(); // eventId -> Map of userId -> {socketIds: Set, userName, userPicture}
const typingUsers = new Map(); // eventId -> Map of userId -> userName

io.on('connection', (socket) => {
    if (envConfig.logging.verbose) {
        console.log('User connected:', socket.id);
    }

    // Join event room
    socket.on('join-event', (data) => {
        const { eventId, userId, userName, userPicture } = data;
        
        socket.join(`event-${eventId}`);
        socket.eventId = eventId;
        socket.userId = userId;
        socket.userName = userName;
        socket.userPicture = userPicture;

        // Add to active users - deduplicate by userId
        if (!activeUsers.has(eventId)) {
            activeUsers.set(eventId, new Map());
        }
        
        const eventUsers = activeUsers.get(eventId);
        if (!eventUsers.has(userId)) {
            eventUsers.set(userId, {
                socketIds: new Set(),
                userName: userName,
                userPicture: userPicture
            });
        }
        eventUsers.get(userId).socketIds.add(socket.id);

        if (envConfig.logging.verbose) {
            console.log(`User ${userName} (${userId}) joined event ${eventId}`);
        }

        // Notify others about active users count and list - unique users only
        const activeCount = eventUsers.size;
        const usersList = Array.from(eventUsers.entries()).map(([uid, user]) => ({
            userId: uid,
            userName: user.userName,
            userPicture: user.userPicture
        }));
        
        if (envConfig.logging.verbose) {
            console.log('Sending active users list:', usersList);
            console.log('Active users count:', activeCount);
        }
        
        io.to(`event-${eventId}`).emit('active-users-count', activeCount);
        io.to(`event-${eventId}`).emit('active-users-list', usersList);
    });

    // New message sent
    socket.on('new-message', (data) => {
        const { eventId, message } = data;
        
        // Broadcast to all users in the event room except sender
        socket.to(`event-${eventId}`).emit('message-received', message);
        
        if (envConfig.logging.verbose) {
            console.log(`New message in event ${eventId}:`, message);
        }
    });

    // User is typing
    socket.on('typing-start', (data) => {
        const { eventId, userId, userName } = data;
        
        if (!typingUsers.has(eventId)) {
            typingUsers.set(eventId, new Map());
        }
        typingUsers.get(eventId).set(userId, userName);

        // Broadcast to others in the same event room only
        socket.to(`event-${eventId}`).emit('user-typing', { 
            userId, 
            userName,
            isTyping: true 
        });

        if (envConfig.logging.verbose) {
            console.log(`User ${userName} is typing in event ${eventId}`);
        }
    });

    // User stopped typing
    socket.on('typing-stop', (data) => {
        const { eventId, userId } = data;
        
        if (typingUsers.has(eventId)) {
            typingUsers.get(eventId).delete(userId);
        }

        // Broadcast to others in the same event room only
        socket.to(`event-${eventId}`).emit('user-typing', { 
            userId, 
            isTyping: false 
        });
    });

    // Message deleted
    socket.on('message-deleted', (data) => {
        const { eventId, messageId } = data;
        
        // Broadcast to all users in the event room
        io.to(`event-${eventId}`).emit('message-deleted', { messageId });
        
        if (envConfig.logging.verbose) {
            console.log(`Message ${messageId} deleted in event ${eventId}`);
        }
    });

    // Reaction toggled
    socket.on('reaction-toggled', (data) => {
        const { eventId, messageId, reactions } = data;
        
        // Broadcast to all users in the event room except sender
        socket.to(`event-${eventId}`).emit('reaction-updated', { messageId, reactions });
        
        if (envConfig.logging.verbose) {
            console.log(`Reaction updated on message ${messageId} in event ${eventId}`);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (envConfig.logging.verbose) {
            console.log('User disconnected:', socket.id);
        }

        if (socket.eventId) {
            const eventId = socket.eventId;
            const userId = socket.userId;

            // Remove from active users - remove this specific socket
            if (activeUsers.has(eventId)) {
                const eventUsers = activeUsers.get(eventId);
                
                if (eventUsers.has(userId)) {
                    const user = eventUsers.get(userId);
                    user.socketIds.delete(socket.id);
                    
                    // If user has no more active sockets, remove them completely
                    if (user.socketIds.size === 0) {
                        eventUsers.delete(userId);
                    }
                }

                // Notify others about active users count and list
                const activeCount = eventUsers.size;
                const usersList = Array.from(eventUsers.entries()).map(([uid, user]) => ({
                    userId: uid,
                    userName: user.userName,
                    userPicture: user.userPicture
                }));
                
                io.to(`event-${eventId}`).emit('active-users-count', activeCount);
                io.to(`event-${eventId}`).emit('active-users-list', usersList);

                if (eventUsers.size === 0) {
                    activeUsers.delete(eventId);
                }
            }

            // Remove from typing users
            if (typingUsers.has(eventId)) {
                typingUsers.get(eventId).delete(userId);
                socket.to(`event-${eventId}`).emit('user-typing', { 
                    userId, 
                    isTyping: false 
                });
            }
        }
    });
});

// Health check endpoint for Render.com
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            environment: config.environment,
            activeEvents: activeUsers.size,
            totalUsers: Array.from(activeUsers.values()).reduce((sum, users) => sum + users.size, 0)
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Attach Socket.IO to HTTP server
io.attach(server);

server.listen(envConfig.port, () => {
    if (envConfig.logging.enabled) {
        console.log(`WebSocket server running on port ${envConfig.port}`);
        console.log('Waiting for connections...');
    }
});
