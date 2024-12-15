import React from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        toast.error('An error occurred. Please try again.');
    }

    render() {
        if (this.state.hasError) {
            return <h1>An error occurred.</h1>;
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
