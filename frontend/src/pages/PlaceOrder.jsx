// pages/PlaceOrder.jsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PlaceOrder = () => {
    const [method, setMethod] = useState('cod');
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    });
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // To manage deletion state

    // State for Dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // State for Delete Confirmation Modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState(null);

    // Fetch Addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/user/addresses`, { headers: { Authorization: `Bearer ${token}` } });
                if (response.data.success) {
                    const userAddresses = response.data.addresses;
                    setAddresses(userAddresses);

                    if (userAddresses.length > 0) {
                        setSelectedAddressId(userAddresses[0]._id);
                    } else {
                        setShowNewAddressForm(true);
                    }
                }
            } catch (error) {
                console.log(error);
                toast.error('Failed to fetch addresses.');
            }
        };

        if (token) {
            fetchAddresses();
        }
    }, [backendUrl, token]);

    // Handle Input Changes
    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(data => ({ ...data, [name]: value }));
    };

    // Handle Selecting an Existing Address
    const handleSelectAddress = (addressId) => {
        setSelectedAddressId(addressId);
        setShowNewAddressForm(false);
        setDropdownOpen(false);
        // Reset formData khi chọn địa chỉ đã lưu
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            street: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            phone: ''
        });
        console.log(`Selected Address ID: ${addressId}`);
    };

    // Handle Cancel Adding New Address
    const handleCancelNewAddress = () => {
        setShowNewAddressForm(false);
        setSelectedAddressId(addresses.length > 0 ? addresses[0]._id : null); // Revert to the first address if available
        // Reset formData khi hủy thêm địa chỉ mới
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            street: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            phone: ''
        });
    };

    // Handle Submitting New Address
    const handleNewAddressSubmit = async () => {
        try {
            const { firstName, lastName, email, street, city, zipcode, country, phone } = formData;
            // Validate required fields
            if (!firstName || !lastName || !email || !street || !city || !zipcode || !country || !phone) {
                toast.error('Please fill in all required fields.');
                return;
            }

            const response = await axios.post(`${backendUrl}/api/user/addresses`, formData, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.success) {
                setAddresses([...addresses, response.data.address]);
                setSelectedAddressId(response.data.address._id);
                setShowNewAddressForm(false);
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    street: '',
                    city: '',
                    state: '',
                    zipcode: '',
                    country: '',
                    phone: ''
                });
                toast.success('Address saved successfully.');
            } else {
                toast.error(response.data.message || 'Failed to save address.');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        }
    };

    // Handle Deleting an Address
    const confirmDeleteAddress = (addressId) => {
        setAddressToDelete(addressId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteAddress = async () => {
        if (!addressToDelete) return;

        setIsDeleting(true);
        try {
            const response = await axios.delete(`${backendUrl}/api/user/addresses/${addressToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                // Remove the deleted address from state
                const updatedAddresses = addresses.filter(addr => addr._id !== addressToDelete);
                setAddresses(updatedAddresses);

                // If the deleted address was selected, select the first address or show the new address form
                if (selectedAddressId === addressToDelete) {
                    if (updatedAddresses.length > 0) {
                        setSelectedAddressId(updatedAddresses[0]._id);
                    } else {
                        setSelectedAddressId(null);
                        setShowNewAddressForm(true);
                    }
                }

                toast.success('Address deleted successfully.');
            } else {
                toast.error(response.data.message || 'Failed to delete address.');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong while deleting the address.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setAddressToDelete(null);
        }
    };

    // Handle Placing Order
    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            let orderItems = [];

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items));
                        if (itemInfo) {
                            itemInfo.size = item;
                            itemInfo.quantity = cartItems[items][item];
                            orderItems.push(itemInfo);
                        }
                    }
                }
            }

            let orderData = {
                address: selectedAddressId ? { addressId: selectedAddressId } : formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            };

            console.log("Order Data:", orderData); // Debug

            switch (method) {

                // COD Payment
                case 'cod':
                    const response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { Authorization: `Bearer ${token}` } });
                    if (response.data.success) {
                        setCartItems({});
                        toast.success('Order successfully!');
                        navigate('/orders');
                    } else {
                        toast.error(response.data.message || 'Failed to place order.');
                    }
                    break;

                // Stripe Payment
                case 'stripe':
                    const responseStripe = await axios.post(`${backendUrl}/api/order/stripe`, orderData, { headers: { Authorization: `Bearer ${token}` } });
                    if (responseStripe.data.success) {
                        toast.info('Direction to Stripe payment...');
                        const { session_url } = responseStripe.data;
                        window.location.replace(session_url);
                    } else {
                        toast.error(responseStripe.data.message || 'Stripe payment failed.');
                    }
                    break;

                default:
                    toast.error('Invalid payment method.');
                    break;
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        }
    };

    return (
        <>
            <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
                {/* ------------- Left Side ---------------- */}
                <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
                    <div className='text-xl sm:text-2xl my-3'>
                        <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                    </div>

                    {/* Custom Dropdown for Address Selection */}
                    <div className='relative border p-4 rounded-md'>
                        <label className='block mb-2 font-medium'>Select Address:</label>
                        <div className='relative'>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className='w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                            >
                                {selectedAddressId
                                    ? addresses.find(addr => addr._id === selectedAddressId)
                                        ? `${addresses.find(addr => addr._id === selectedAddressId).firstName} ${addresses.find(addr => addr._id === selectedAddressId).lastName}, ${addresses.find(addr => addr._id === selectedAddressId).street}, ${addresses.find(addr => addr._id === selectedAddressId).city}`
                                        : 'Select Address'
                                    : 'Add New Address'}
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </button>

                            {dropdownOpen && (
                                <div className='absolute mt-1 w-full rounded-md bg-white shadow-lg z-10'>
                                    <ul className='max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm'>
                                        {addresses.map((addr) => (
                                            <li key={addr._id} className='flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer'>
                                                <div onClick={() => handleSelectAddress(addr._id)} className='flex items-center w-full'>
                                                    <input
                                                        type="radio"
                                                        name="selectedAddress"
                                                        value={addr._id}
                                                        checked={selectedAddressId === addr._id}
                                                        onChange={() => handleSelectAddress(addr._id)}
                                                        className='mr-2'
                                                    />
                                                    <span>
                                                        {`${addr.firstName} ${addr.lastName}, ${addr.street}, ${addr.city}, ${addr.state}, ${addr.zipcode}, ${addr.country}`}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); confirmDeleteAddress(addr._id); }}
                                                    disabled={isDeleting}
                                                    className='text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                    title="Delete Address"
                                                >
                                                    &#10005; {/* Unicode for "X" */}
                                                </button>
                                            </li>
                                        ))}
                                        <li
                                            onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); setDropdownOpen(false); }}
                                            className='flex items-center justify-center px-4 py-2 text-blue-500 hover:bg-gray-100 cursor-pointer'
                                        >
                                            Add New Address
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form to Add New Address */}
                    {showNewAddressForm && (
                        <div className='flex flex-col gap-4 w-full sm:max-w-[480px] border p-4 rounded-md'>
                            <div className='flex gap-3'>
                                <input
                                    required
                                    onChange={onChangeHandler}
                                    name='firstName'
                                    value={formData.firstName}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="text"
                                    placeholder='First name'
                                />
                                <input
                                    required
                                    onChange={onChangeHandler}
                                    name='lastName'
                                    value={formData.lastName}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="text"
                                    placeholder='Last name'
                                />
                            </div>
                            <input
                                required
                                onChange={onChangeHandler}
                                name='email'
                                value={formData.email}
                                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                type="email"
                                placeholder='Email address'
                            />
                            <input
                                required
                                onChange={onChangeHandler}
                                name='street'
                                value={formData.street}
                                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                type="text"
                                placeholder='Street'
                            />
                            <div className='flex gap-3'>
                                <input
                                    required
                                    onChange={onChangeHandler}
                                    name='city'
                                    value={formData.city}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="text"
                                    placeholder='City'
                                />
                                <input
                                    onChange={onChangeHandler}
                                    name='state'
                                    value={formData.state}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="text"
                                    placeholder='State'
                                />
                            </div>
                            <div className='flex gap-3'>
                                <input
                                    required
                                    onChange={onChangeHandler}
                                    name='zipcode'
                                    value={formData.zipcode}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="number"
                                    placeholder='Zipcode'
                                />
                                <input
                                    required
                                    onChange={onChangeHandler}
                                    name='country'
                                    value={formData.country}
                                    className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                    type="text"
                                    placeholder='Country'
                                />
                            </div>
                            <input
                                required
                                onChange={onChangeHandler}
                                name='phone'
                                value={formData.phone}
                                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                                type="number"
                                placeholder='Phone'
                            />
                            <div className='flex justify-end gap-4'>
                                <button
                                    type='button'
                                    onClick={handleCancelNewAddress}
                                    disabled={addresses.length === 0}
                                    className={`bg-gray-300 text-black px-4 py-2 rounded-md ${addresses.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    onClick={handleNewAddressSubmit}
                                    className='bg-black text-white px-4 py-2 rounded-md'
                                >
                                    Save Address
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ------------- Right Side ------------------ */}
                <div className='mt-8 sm:mt-0'>
                    <div className='mt-8 min-w-80'>
                        <CartTotal />
                    </div>

                    <div className='mt-12'>
                        <Title text1={'PAYMENT'} text2={'METHOD'} />
                        <div className='flex gap-3 flex-col lg:flex-row'>
                            <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                                <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
                                <img className='h-5 mx-4' src={assets.stripe_logo} alt="Stripe" />
                            </div>
                            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                                <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
                                <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
                            </div>
                        </div>

                        <div className='w-full text-end mt-8'>
                            <button type='submit' className='bg-black text-white px-16 py-3 text-sm'>PLACE ORDER</button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                        <p className="mb-6">Are you sure you want to delete this address?</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAddress}
                                disabled={isDeleting}
                                className={`bg-red-500 text-white px-4 py-2 rounded-md ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

};

export default PlaceOrder;
