import { useState, useEffect } from 'react';
import api from '../api';

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // Pre-filled form data to save time during your demo
    const [formData, setFormData] = useState({
        company_name: 'Tech Industries Pvt Ltd', 
        contact_person: 'John Doe', 
        mobile: '9876543210', 
        email: 'john@techindustries.com', 
        city: 'Mumbai', 
        required_date: '2026-10-31', 
        notes: 'Urgent requirement for Q4 production.'
    });

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        try {
            const res = await api.get('/enquiries');
            setEnquiries(res.data);
        } catch (err) {
            console.error('Failed to fetch enquiries', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                items: [
                    { product_id: 1, quantity: 150 },
                    { product_id: 2, quantity: 75 }
                ]
            };
            await api.post('/enquiries', payload);
            setIsCreating(false);
            fetchEnquiries(); // Refresh the table
        } catch (err) {
            // This exposes the exact server-side error message
            alert(err.response?.data?.error || err.message);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Customer Enquiries</h2>
            <button 
                onClick={() => setIsCreating(!isCreating)} 
                style={{ marginBottom: '20px', padding: '10px', backgroundColor: isCreating ? '#dc3545' : '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
            >
                {isCreating ? 'Cancel' : 'Create New Enquiry'}
            </button>

            {isCreating && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
                    <input type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
                    <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} required />
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <input type="date" value={formData.required_date} onChange={e => setFormData({...formData, required_date: e.target.value})} required />
                    <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Submit Enquiry
                    </button>
                    <small>Note: This will automatically request 150 units of Product 1 and 75 units of Product 2.</small>
                </form>
            )}

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Enquiry #</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Company</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {enquiries.map(enq => (
                        <tr key={enq.id}>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>ID: {enq.id} | {enq.enquiry_number}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{enq.company_name}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', color: enq.status === 'NEW' ? 'blue' : 'green' }}>
                                <strong>{enq.status}</strong>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Enquiries;