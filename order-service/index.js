const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db'
});


const USER_SERVICE_URL = 'http://localhost:3001/api/users';


app.post('/api/orders', async (req, res) => {
    const { user_id, product_name, quantity, total_price } = req.body;

    try {
        
        const response = await axios.get(`${USER_SERVICE_URL}/${user_id}`);
        
        if (response.data) {
            
            const sql = 'INSERT INTO orders (user_id, product_name, quantity, total_price) VALUES (?, ?, ?, ?)';
            db.query(sql, [user_id, product_name, quantity, total_price], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: 'Order berhasil dibuat!', order_id: result.insertId });
            });
        }
    } catch (error) {
        
        res.status(404).json({ message: 'Gagal membuat order: User tidak ditemukan.' });
    }
});

app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});


app.get('/api/orders/:id', (req, res) => {
    db.query('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});


app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Status order diperbarui' });
    });
});


app.delete('/api/orders/:id', (req, res) => {
    db.query('DELETE FROM orders WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Order dihapus' });
    });
});

app.listen(3002, () => console.log('Order Service running on port 3002'));
