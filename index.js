// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// البحث عن المنتجات
app.get('/products/search', async (req, res) => {
    try {
        const { keyword, category } = req.query;

        let query = 'SELECT * FROM public.products_comp WHERE 1=1';
        let params = [];

        if (keyword) {
            params.push(`%${keyword}%`);
            query += ` AND product_name ILIKE $${params.length}`;
        }

        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC'; // أحدث المنتجات أولاً

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// إضافة منتج (للتجار)
app.post('/products', async (req, res) => {
    try {
        const { company_id, product_name, category, price, image_url } = req.body;

        const result = await pool.query(
            `INSERT INTO public.products_comp 
            (company_id, product_name, category, price, image_url) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [company_id, product_name, category, price, image_url]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
