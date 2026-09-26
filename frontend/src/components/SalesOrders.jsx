import { useState, useEffect } from 'react';
import api from '../api';

const SalesOrders = () => {
    const [orders, setOrders] = useState([]);
    const [quoteId, setQuoteId] = useState('1');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/sales-orders');
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const handleConvert = async () => {
        try {
            await api.post(`/sales-orders/convert/${quoteId}`);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.error || `Error converting Quote #${quoteId}. Ensure it is ACCEPTED.`);
        }
    };

    const handleConfirm = async (id) => {
        try {
            // This triggers the FOR UPDATE stock reservation
            await api.post(`/sales-orders/${id}/confirm`);
            fetchOrders();
            alert('Order confirmed and stock reserved successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error confirming order');
        }
    };

    const handleDispatch = async (id) => {
        try {
            await api.post(`/sales-orders/${id}/dispatch`, {
                vehicle_number: "MH-12-AB-1234",
                driver_name: "Ramesh Kumar"
            });
            fetchOrders();
            alert('Order dispatched and stock deducted successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Error dispatching order');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Sales Orders & Dispatch</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <input 
                    type="number" 
                    value={quoteId} 
                    onChange={(e) => setQuoteId(e.target.value)} 
                    style={{ padding: '9px', marginRight: '10px', width: '80px', border: '1px solid #ccc' }} 
                    placeholder="Quote ID"
                />
                <button 
                    onClick={handleConvert} 
                    style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Convert to Sales Order
                </button>
            </div>

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Order #</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total Amount</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.order_number}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <strong style={{ 
                                    color: order.status === 'PENDING' ? 'orange' : 
                                           order.status === 'CONFIRMED' ? 'blue' : 'green' 
                                }}>
                                    {order.status}
                                </strong>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', display: 'flex', gap: '10px' }}>
                                {order.status === 'PENDING' && (
                                    <button onClick={() => handleConfirm(order.id)} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                                        Confirm (Reserve Stock)
                                    </button>
                                )}
                                {order.status === 'CONFIRMED' && (
                                    <button onClick={() => handleDispatch(order.id)} style={{ padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', cursor: 'pointer' }}>
                                        Dispatch Order
                                    </button>
                                )}
                                {order.status === 'DISPATCHED' && <span>Completed</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SalesOrders;