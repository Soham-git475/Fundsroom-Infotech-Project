import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Enquiries from './components/Enquiries';

// Placeholder components for the other screens
const Quotations = () => <div><h2>Quotations Screen (Coming Next)</h2></div>;
const SalesOrders = () => <div><h2>Sales Orders Screen (Coming Next)</h2></div>;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setIsAuthenticated(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
    };

    return (
        <BrowserRouter>
            {isAuthenticated && (
                <nav style={{ padding: '15px', backgroundColor: '#f4f4f4', marginBottom: '20px', display: 'flex', gap: '20px' }}>
                    <Link to="/enquiries">Enquiries</Link>
                    <Link to="/quotations">Quotations</Link>
                    <Link to="/sales-orders">Sales Orders</Link>
                    <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Logout</button>
                </nav>
            )}
            
            <Routes>
                <Route path="/login" element={
                    !isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/enquiries" />
                } />
                <Route path="/enquiries" element={
                    isAuthenticated ? <Enquiries /> : <Navigate to="/login" />
                } />
                <Route path="/quotations" element={
                    isAuthenticated ? <Quotations /> : <Navigate to="/login" />
                } />
                <Route path="/sales-orders" element={
                    isAuthenticated ? <SalesOrders /> : <Navigate to="/login" />
                } />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/enquiries" : "/login"} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;