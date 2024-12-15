import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, navigate, backendUrl, login } = useContext(ShopContext);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Thêm toggle admin

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === 'Sign Up') {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        const response = await axios.post(`${backendUrl}/api/user/register`, { name, email, password });
        if (response.data.success) {
          toast.success('Registration successful!');
          login(response.data.token); // Gọi hàm login từ context
          navigate('/'); // Redirect sau khi đăng ký
        } else {
          toast.error(response.data.message);
        }

      } else {

        const endpoint = isAdmin ? `${backendUrl}/api/user/admin/login` : `${backendUrl}/api/user/login`;
        const payload = { email, password };

        console.log(`isAdmin: ${isAdmin}`);
        console.log(`Sending login request to ${endpoint} with payload:`, payload);

        const response = await axios.post(endpoint, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          toast.success('Login successful!');
          login(response.data.token); // Gọi hàm login từ context
          navigate('/'); // Redirect sau khi đăng nhập
        } else {
          toast.error(response.data.message);
        }

      }

    } catch (error) {
      console.log('Login Error:', error);
      if (error.response) {
        console.log('Response Data:', error.response.data);
        toast.error(error.response.data.message || 'Something went wrong.');
      } else {
        toast.error('Something went wrong.');
      }
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>
      {currentState === 'Sign Up' && (
        <input 
          onChange={(e) => setName(e.target.value)} 
          value={name} 
          type="text" 
          className='w-full px-3 py-2 border border-gray-800' 
          placeholder='Name' 
          required 
        />
      )}
      <input 
        onChange={(e) => setEmail(e.target.value)} 
        value={email} 
        type="email" 
        className='w-full px-3 py-2 border border-gray-800' 
        placeholder='Email' 
        required 
      />
      <input 
        onChange={(e) => setPassword(e.target.value)} 
        value={password} 
        type="password" 
        className='w-full px-3 py-2 border border-gray-800' 
        placeholder='Password' 
        required 
      />
      {currentState === 'Sign Up' && (
        <input
          onChange={(e) => setConfirmPassword(e.target.value)}
          value={confirmPassword}
          type="password"
          className='w-full px-3 py-2 border border-gray-800'
          placeholder='Confirm Password'
          required
        />
      )}
      <div className='w-full flex justify-between items-center text-sm mt-[-8px]'>
        <p className='cursor-pointer'>Forgot your password?</p>
        <div className='flex items-center gap-2'>
          <input 
            type="checkbox" 
            id="admin" 
            checked={isAdmin} 
            onChange={() => {
              setIsAdmin(!isAdmin);
              console.log(`Checkbox isAdmin changed to: ${!isAdmin}`);
            }} 
            className='mr-2'
          />
          <label htmlFor="admin" className='cursor-pointer'>Login as Admin</label>
        </div>
      </div>
      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        {
          currentState === 'Login'
            ? <p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer'>Create account</p>
            : <p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Login Here</p>
        }
      </div>
      <button className='bg-black text-white font-light px-8 py-2 mt-4'>{currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>
    </form>
  )

}

export default Login;
