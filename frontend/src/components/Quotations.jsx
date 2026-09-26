import { useState, useEffect } from 'react';
import api from '../api';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [enquiryIdInput, setEnquiryIdInput] = useState('1');

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const res = await api.get('/quotations');
            setQuotations(res.data);
        } catch (err) {
            console.error('Failed to fetch quotations', err);
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/quotations', {
                enquiry_id: parseInt(enquiryIdInput),
                customer_id: 1,
                valid_until: "2026-10-20",
                items: [
                    { product_id: 1, quantity: 100, unit_price: 1500.00, discount_percent: 10, gst_percent: 18 },
                    { product_id: 2, quantity: 40, unit_price: 450.50, discount_percent: 5, gst_percent: 18 }
                ]
            });
            setIsCreating(false);
            fetchQuotations();
        } catch (err) {
            alert(`Error creating quotation. Ensure Enquiry ID ${enquiryIdInput} exists.`);
        }
    };

    const handleAccept = async (id) => {
        try {
            await api.patch(`/quotations/${id}/status`, { status: 'ACCEPTED' });
            fetchQuotations();
        } catch (err) {
            alert('Error updating status');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Quotations</h2>
            
            <button 
                onClick={() => setIsCreating(!isCreating)} 
                style={{ marginBottom: '20px', padding: '10px', backgroundColor: isCreating ? '#dc3545' : '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                {isCreating ? 'Cancel' : 'Generate Test Quotation'}
            </button>

            {isCreating && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p>Enter the ID of an existing enquiry from your Enquiries tab:</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="number" 
                            value={enquiryIdInput} 
                            onChange={(e) => setEnquiryIdInput(e.target.value)} 
                            style={{ padding: '8px', width: '80px' }}
                            placeholder="Enquiry ID"
                        />
                        <button onClick={handleCreate} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            Confirm & Generate
                        </button>
                    </div>
                </div>
            )}

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Quote ID</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Quote #</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Grand Total</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {quotations.map(q => (
                        <tr key={q.id}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{q.id}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{q.quotation_number}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{parseFloat(q.grand_total).toFixed(2)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <strong style={{ color: q.status === 'ACCEPTED' ? 'green' : 'orange' }}>
                                    {q.status}
                                </strong>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {q.status === 'DRAFT' && (
                                    <button 
                                        onClick={() => handleAccept(q.id)}
                                        style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        Accept Quote
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Quotations;