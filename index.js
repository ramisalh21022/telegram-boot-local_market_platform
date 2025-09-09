// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL;       // رابط مشروع Supabase
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;  // مفتاح API

// البحث عن المنتجات
app.get('/products/search', async (req, res) => {
    try {
        const { keyword, category } = req.query;

        // بناء الاستعلام
        let filter = '';
        if (keyword) filter += `product_name=ilike.*${keyword}*`;
        if (category) filter += (filter ? `&category=eq.${category}` : `category=eq.${category}`);

        const response = await axios.get(`${SUPABASE_URL}/rest/v1/products_comp?${filter}&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// إضافة منتج (للتجار)
app.post('/products', async (req, res) => {
    try {
        const { company_id, product_name, category, price, image_url } = req.body;

        const response = await axios.post(
            `${SUPABASE_URL}/rest/v1/products_comp`,
            { company_id, product_name, category, price, image_url },
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation' // لإرجاع الصف الذي تم إضافته
                }
            }
        );

        res.json(response.data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
