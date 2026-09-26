const pool = require('../config/db');

// POST /quotations - Create a Quotation
const createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        const { enquiry_id, customer_id, valid_until, items } = req.body;

        await client.query('BEGIN'); // Start transaction

        let grandTotal = 0;
        const quotationNumber = `QTN-${Date.now()}`;

        // 1. Insert Quotation Header (Initial Grand Total as 0)
        const quoteRes = await client.query(
            `INSERT INTO quotations (quotation_number, enquiry_id, customer_id, valid_until, status, grand_total) 
             VALUES ($1, $2, $3, $4, 'DRAFT', 0) RETURNING id, quotation_number`,
            [quotationNumber, enquiry_id, customer_id, valid_until]
        );
        const quotationId = quoteRes.rows[0].id;

        // 2. Process Items and Calculate Server-Side Math
        for (let item of items) {
            const qty = parseFloat(item.quantity);
            const price = parseFloat(item.unit_price);
            const discount = parseFloat(item.discount_percent || 0);
            const gst = parseFloat(item.gst_percent || 0);

            // Calculation Logic
            const baseAmount = qty * price;
            const discountAmount = baseAmount * (discount / 100);
            const amountAfterDiscount = baseAmount - discountAmount;
            const gstAmount = amountAfterDiscount * (gst / 100);
            const lineAmount = amountAfterDiscount + gstAmount;

            grandTotal += lineAmount;

            await client.query(
                `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, discount_percent, gst_percent, line_amount) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [quotationId, item.product_id, qty, price, discount, gst, lineAmount]
            );
        }

        // 3. Update Quotation with final calculated Grand Total
        await client.query(
            `UPDATE quotations SET grand_total = $1 WHERE id = $2`,
            [grandTotal, quotationId]
        );

        // 4. Update Enquiry Status to QUOTED
        await client.query(
            `UPDATE enquiries SET status = 'QUOTED' WHERE id = $1`,
            [enquiry_id]
        );

        await client.query('COMMIT'); 

        res.status(201).json({ 
            message: 'Quotation generated successfully', 
            quotation_number: quoteRes.rows[0].quotation_number,
            grand_total: grandTotal
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating quotation:', err);
        res.status(500).json({ error: 'Server error while creating quotation' });
    } finally {
        client.release();
    }
};

// PATCH /quotations/:id/status - Update Status (Accept/Reject)
const updateQuotationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'ACCEPTED' or 'REJECTED'

        const result = await pool.query(
            `UPDATE quotations SET status = $1 WHERE id = $2 RETURNING id, status`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        res.json({ message: `Quotation marked as ${status}` });
    } catch (err) {
        console.error('Error updating quotation:', err);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

// GET /quotations - View all Quotations
const getQuotations = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM quotations ORDER BY id DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quotations:', err);
        res.status(500).json({ error: 'Server error while fetching quotations' });
    }
};

module.exports = { createQuotation, updateQuotationStatus };