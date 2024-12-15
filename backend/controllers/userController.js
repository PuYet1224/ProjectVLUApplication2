import validator from "validator";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import userModel from "../models/userModel.js";
import { 
    NotFoundError, 
    ConflictRequestError, 
    BadRequestError, 
    UnauthorizedError 
} from "../core/error.response.js";
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); 
}

// Đăng nhập người dùng
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            throw new NotFoundError("User doesn't exist");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id);
            res.json({ success: true, token });
        }
        else {
            throw new UnauthorizedError('Invalid credentials');
        }

    } catch (error) {
        console.log(error);
        next(error); // Pass error to middleware
    }
}

// Đăng ký người dùng
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra xem người dùng đã tồn tại chưa
        const exists = await userModel.findOne({ email });
        if (exists) {
            throw new ConflictRequestError("User already exists");
        }

        // Validate email và password
        if (!validator.isEmail(email)) {
            throw new BadRequestError("Please enter a valid email");
        }
        if (password.length < 8) {
            throw new BadRequestError("Please enter a strong password (min 8 characters)");
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();

        const token = createToken(user._id);

        res.status(201).json({ success: true, token });

    } catch (error) {
        console.log(error);
        next(error); // Pass error to middleware
    }
}

// Đăng nhập admin
const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token admin chứa role
            res.json({ success: true, token });
        } else {
            throw new UnauthorizedError("Invalid credentials");
        }

    } catch (error) {
        console.log(error);
        next(error); // Pass error to middleware
    }
}

export { loginUser, registerUser, adminLogin }
