const pool = require('../config/db');

// POST /sales-orders/convert/:quotationId
const convertToOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        const { quotationId } = req.params;

        await client.query('BEGIN');

        // 1. Verify Quotation is ACCEPTED
        const quoteRes = await client.query(`SELECT * FROM quotations WHERE id = $1`, [quotationId]);
        if (quoteRes.rows.length === 0) throw new Error('Quotation not found');
        
        const quotation = quoteRes.rows[0];
        if (quotation.status !== 'ACCEPTED') {
            return res.status(400).json({ error: 'Only ACCEPTED quotations can be converted' });
        }

        // 2. Prevent duplicate orders (Handled partially by UNIQUE constraint, but good to check)
        const existingOrder = await client.query(`SELECT id FROM sales_orders WHERE quotation_id = $1`, [quotationId]);
        if (existingOrder.rows.length > 0) {
            return res.status(400).json({ error: 'Sales Order already exists for this quotation' });
        }

        const orderNumber = `SO-${Date.now()}`;

        // 3. Create Sales Order
        const orderRes = await client.query(
            `INSERT INTO sales_orders (order_number, customer_id, quotation_id, total_amount, status) 
             VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id, order_number`,
            [orderNumber, quotation.customer_id, quotationId, quotation.grand_total]
        );
        const orderId = orderRes.rows[0].id;

        // 4. Copy Items
        const itemsRes = await client.query(`SELECT product_id, quantity FROM quotation_items WHERE quotation_id = $1`, [quotationId]);
        for (let item of itemsRes.rows) {
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [orderId, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Sales Order created', order_number: orderRes.rows[0].order_number });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error converting quotation' });
    } finally {
        client.release();
    }
};

// POST /sales-orders/:id/confirm (The Concurrency Challenge)
const confirmOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Verify Order
        const orderRes = await client.query(`SELECT status FROM sales_orders WHERE id = $1`, [id]);
        if (orderRes.rows[0].status !== 'PENDING') {
            return res.status(400).json({ error: 'Order is not PENDING' });
        }

        // 2. Check and Reserve Stock using FOR UPDATE (Row-level lock)
        const itemsRes = await client.query(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [id]);
        
        for (let item of itemsRes.rows) {
            // FOR UPDATE locks this specific product's inventory row until COMMIT/ROLLBACK
            const invRes = await client.query(
                `SELECT physical_qty, reserved_qty FROM inventory WHERE product_id = $1 FOR UPDATE`, 
                [item.product_id]
            );
            
            const inv = invRes.rows[0];
            const available = inv.physical_qty - inv.reserved_qty;

            if (available < item.quantity) {
                throw new Error(`Insufficient stock for product ID ${item.product_id}. Available: ${available}`);
            }

            // Reserve the stock
            await client.query(
                `UPDATE inventory SET reserved_qty = reserved_qty + $1 WHERE product_id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // 3. Update Order Status
        await client.query(`UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = $1`, [id]);

        await client.query('COMMIT');
        res.json({ message: 'Order CONFIRMED and inventory reserved successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

// POST /sales-orders/:id/dispatch
const dispatchOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { vehicle_number, driver_name } = req.body;

        await client.query('BEGIN');

        // 1. Verify Order is CONFIRMED
        const orderRes = await client.query(`SELECT status FROM sales_orders WHERE id = $1`, [id]);
        if (orderRes.rows.length === 0 || orderRes.rows[0].status !== 'CONFIRMED') {
            return res.status(400).json({ error: 'Only CONFIRMED orders can be dispatched' });
        }

        const dispatchNumber = `DSP-${Date.now()}`;

        // 2. Create Dispatch Record
        const dispatchRes = await client.query(
            `INSERT INTO dispatches (dispatch_number, order_id, vehicle_number, driver_name) 
             VALUES ($1, $2, $3, $4) RETURNING id, dispatch_number`,
            [dispatchNumber, id, vehicle_number, driver_name]
        );
        const dispatchId = dispatchRes.rows[0].id;

        // 3. Process Items & Deduct Inventory
        const itemsRes = await client.query(`SELECT product_id, quantity FROM sales_order_items WHERE order_id = $1`, [id]);
        
        for (let item of itemsRes.rows) {
            // Lock the inventory row to ensure accuracy during deduction
            const invRes = await client.query(
                `SELECT reserved_qty FROM inventory WHERE product_id = $1 FOR UPDATE`, 
                [item.product_id]
            );
            
            if (invRes.rows[0].reserved_qty < item.quantity) {
                throw new Error(`Cannot dispatch more than reserved for product ${item.product_id}`);
            }

            // Insert dispatch items
            await client.query(
                `INSERT INTO dispatch_items (dispatch_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [dispatchId, item.product_id, item.quantity]
            );

            // Deduct from Physical AND Reserved quantities
            await client.query(
                `UPDATE inventory 
                 SET physical_qty = physical_qty - $1, 
                     reserved_qty = reserved_qty - $1 
                 WHERE product_id = $2`,
                [item.quantity, item.product_id]
            );
        }

        // 4. Update Order Status
        await client.query(`UPDATE sales_orders SET status = 'DISPATCHED' WHERE id = $1`, [id]);

        await client.query('COMMIT');
        res.json({ message: 'Order DISPATCHED successfully', dispatch_number: dispatchRes.rows[0].dispatch_number });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

// GET /sales-orders - View all Orders
const getOrders = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM sales_orders ORDER BY id DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Server error while fetching orders' });
    }
};

module.exports = { convertToOrder, confirmOrder, dispatchOrder, getOrders };