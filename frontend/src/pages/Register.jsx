// pages/Register.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const Register = () => {
    const { backendUrl, login } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${backendUrl}/api/user/register`, formData);
            if (response.data.success) {
                toast.success('Registration successful!');
                login(response.data.token); // Lưu token vào context và localStorage
                // Redirect hoặc làm gì đó sau khi đăng ký thành công
            } else {
                toast.error(response.data.message || 'Registration failed.');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Name" 
                required 
            />
            <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Email" 
                required 
            />
            <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Password" 
                required 
            />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
