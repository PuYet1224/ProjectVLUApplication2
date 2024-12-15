// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import addressRoute from './routes/addressRoute.js'; 
import errorHandler from './middlewares/errorHandler.js';
import logger from './middlewares/logger.js';
import jwt from 'jsonwebtoken';
import Order from './models/orderModel.js';

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"], 
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware cho Socket.IO để xác thực admin
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return next(new Error("Not authorized as admin"));
        }
        socket.admin = true;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(logger);

// API Endpoints
app.use('/api/user', userRouter);
app.use('/api/user', addressRoute); 
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

// Root route
app.get('/', (req, res) => {
    res.send("API Working");
});

// Error handler
app.use(errorHandler);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    if (socket.admin) {
        socket.join('admin');
        console.log(`Admin socket ${socket.id} joined admin room`);
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('socketio', io);

// Start server
server.listen(port, () => console.log(`Server started on PORT: ${port}`));

export { io };
