const pool = require('../config/db');

// POST /enquiries - Create Customer and Enquiry
const createEnquiry = async (req, res) => {
    const client = await pool.connect();
    try {
        const { company_name, contact_person, mobile, email, city, required_date, notes, items } = req.body;

        await client.query('BEGIN'); // Start transaction

        // 1. Insert Customer
        const customerRes = await client.query(
            `INSERT INTO customers (company_name, contact_person, mobile, email, city) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [company_name, contact_person, mobile, email, city]
        );
        const customerId = customerRes.rows[0].id;

        // 2. Generate unique Enquiry Number
        const enquiryNumber = `ENQ-${Date.now()}`;

        // 3. Insert Enquiry Header
        const enquiryRes = await client.query(
            `INSERT INTO enquiries (enquiry_number, customer_id, required_date, notes) 
             VALUES ($1, $2, $3, $4) RETURNING id, enquiry_number, status`,
            [enquiryNumber, customerId, required_date, notes]
        );
        const enquiryId = enquiryRes.rows[0].id;

        // 4. Insert Enquiry Line Items
        for (let item of items) {
            await client.query(
                `INSERT INTO enquiry_items (enquiry_id, product_id, quantity) 
                 VALUES ($1, $2, $3)`,
                [enquiryId, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT'); // Save changes

        res.status(201).json({ 
            message: 'Enquiry created successfully', 
            enquiry_number: enquiryRes.rows[0].enquiry_number,
            enquiry_id: enquiryId
        });

    } catch (err) {
        await client.query('ROLLBACK'); // Undo all changes on error
        console.error('Error creating enquiry:', err);
        res.status(500).json({ error: 'Server error while creating enquiry' });
    } finally {
        client.release();
    }
};

// GET /enquiries - View all Enquiries
const getEnquiries = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.id, e.enquiry_number, e.enquiry_date, e.required_date, e.status, e.notes,
                   c.company_name, c.contact_person, c.email
            FROM enquiries e
            JOIN customers c ON e.customer_id = c.id
            ORDER BY e.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({ error: 'Server error while fetching enquiries' });
    }
};

module.exports = { createEnquiry, getEnquiries };