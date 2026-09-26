const pool = require('../config/db');

// POST /enquiries
const createEnquiry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { company_name, contact_person, mobile, email, city, required_date, notes, items } = req.body;

        await client.query('BEGIN');

        // 1. Auto-find or create a customer
        let customerRes = await client.query(`SELECT id FROM customers WHERE email = $1`, [email]);
        let customerId;

        if (customerRes.rows.length > 0) {
            customerId = customerRes.rows[0].id;
        } else {
            const newCust = await client.query(
                `INSERT INTO customers (company_name, contact_person, mobile, email, city) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [company_name, contact_person, mobile, email, city]
            );
            customerId = newCust.rows[0].id;
        }

        const enquiryNumber = `ENQ-${Date.now()}`;

        // 2. Create Enquiry
        const enquiryRes = await client.query(
            `INSERT INTO enquiries (enquiry_number, customer_id, enquiry_date, required_date, notes, status) 
             VALUES ($1, $2, CURRENT_DATE, $3, $4, 'NEW') RETURNING id, enquiry_number`,
            [enquiryNumber, customerId, required_date, notes]
        );
        const enquiryId = enquiryRes.rows[0].id;

        // 3. Insert Items directly into enquiry_items (assuming products 1 and 2 already exist)
        const enquiryItems = items && items.length > 0 ? items : [{ product_id: 1, quantity: 10 }];
        
        for (let item of enquiryItems) {
            await client.query(
                `INSERT INTO enquiry_items (enquiry_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [enquiryId, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Enquiry created successfully', enquiry_number: enquiryRes.rows[0].enquiry_number, enquiryId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating enquiry:', err);
        res.status(500).json({ error: err.message || 'Server error creating enquiry' });
    } finally {
        client.release();
    }
};

// GET /enquiries
const getEnquiries = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, c.company_name FROM enquiries e 
             JOIN customers c ON e.customer_id = c.id 
             ORDER BY e.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({ error: 'Server error while fetching enquiries' });
    }
};

module.exports = { createEnquiry, getEnquiries };