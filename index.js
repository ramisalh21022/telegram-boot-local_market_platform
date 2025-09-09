const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// ----------- منتجات ----------
app.get('/products/search', async (req, res) => {
    try {
        const { keyword, category } = req.query;
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

app.post('/products', async (req, res) => {
    try {
        const { company_id, product_name, category, price, image_url } = req.body;
        const response = await axios.post(
            `${SUPABASE_URL}/rest/v1/products_comp`,
            { company_id, product_name, category, price, image_url },
            { headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }}
        );
        res.json(response.data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ----------- العملاء ----------
app.post('/clients', async (req, res) => {
    try {
        const { telegram_id } = req.body;
        // تحقق إذا موجود
        const check = await axios.get(`${SUPABASE_URL}/rest/v1/clients?phone=eq.${telegram_id}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (check.data.length > 0) return res.json(check.data[0]);
        // إنشاء جديد
        const response = await axios.post(`${SUPABASE_URL}/rest/v1/clients`, 
            { phone: telegram_id, store_name: `Client-${telegram_id}`, owner_name: `User-${telegram_id}` },
            { headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }}
        );
        res.json(response.data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ----------- الطلبات ----------
app.post('/orders/init', async (req, res) => {
    try {
        const { client_id } = req.body;
        // تحقق عن طلب مفتوح
        const check = await axios.get(`${SUPABASE_URL}/rest/v1/orders?client_id=eq.${client_id}&status=eq.pending`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (check.data.length > 0) return res.json(check.data[0]);
        // إنشاء طلب جديد
        const response = await axios.post(`${SUPABASE_URL}/rest/v1/orders`,
            { client_id, status: 'pending', total_price: 0 },
            { headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }}
        );
        res.json(response.data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ----------- عناصر الطلب ----------
app.post('/order_items', async (req, res) => {
    try {
        const { order_id, product_id, quantity } = req.body;

        // جلب سعر المنتج
        const prod = await axios.get(`${SUPABASE_URL}/rest/v1/products_comp?id=eq.${product_id}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const price = prod.data[0]?.price || 0;

        // إضافة عنصر
        const response = await axios.post(`${SUPABASE_URL}/rest/v1/order_items`,
            { order_id, product_id, quantity, unit_price: price },
            { headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }}
        );

        // تحديث إجمالي الطلب
        const total = await axios.get(`${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${order_id}`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const total_price = total.data.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
        await axios.patch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`,
            { total_price },
            { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } }
        );

        res.json(response.data[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
