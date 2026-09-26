const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedDatabase = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        
        // Clear existing data to avoid duplicates if run multiple times
        await client.query('TRUNCATE users, products, inventory RESTART IDENTITY CASCADE');

        // 1. Insert Users (Password is hashed for security)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        await client.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES 
            ('Admin User', 'admin@erp.com', $1, 'ADMIN'),
            ('Sales Rep', 'sales@erp.com', $1, 'SALES_USER')`,
            [hash]
        );

        // 2. Insert 6 Industrial Products
        const productsQuery = `
            INSERT INTO products (product_code, product_name, category, unit, base_price) VALUES 
            ('VALV-001', 'High Pressure Hydraulic Valve', 'Valves', 'Nos', 1500.00),
            ('BRNG-024', 'Industrial Flange Bearing', 'Bearings', 'Nos', 450.50),
            ('CONV-100', 'Heavy Duty Conveyor Belt', 'Belts', 'Meters', 2500.00),
            ('MOTR-050', '3-Phase AC Motor 5HP', 'Motors', 'Nos', 12500.00),
            ('PUMP-012', 'Centrifugal Water Pump', 'Pumps', 'Nos', 8400.00),
            ('SEAL-008', 'Mechanical Shaft Seal', 'Seals', 'Nos', 85.00)
            RETURNING id;
        `;
        const productRes = await client.query(productsQuery);

        // 3. Insert Starting Inventory (Random physical quantity between 50 and 200)
        for (let row of productRes.rows) {
            await client.query(
                `INSERT INTO inventory (product_id, physical_qty, reserved_qty) VALUES ($1, $2, 0)`,
                [row.id, Math.floor(Math.random() * 150) + 50] 
            );
        }

        console.log('✅ Database seeded successfully!');
        console.log('Login credentials:');
        console.log('Admin: admin@erp.com | Password: password123');
        console.log('Sales: sales@erp.com | Password: password123');
        
    } catch (err) {
        console.error('❌ Error seeding database:', err);
    } finally {
        await client.end();
    }
};

seedDatabase();