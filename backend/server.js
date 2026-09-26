const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import database
require('./config/db');

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/sales-orders', orderRoutes);
app.use('/auth', authRoutes);
app.use('/enquiries', enquiryRoutes);
app.use('/quotations', quotationRoutes);

// Temporary test route
app.get('/api/health', (req, res) => {
    res.json({ message: 'ERP Backend is running successfully!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});