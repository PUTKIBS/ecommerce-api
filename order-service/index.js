require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2');
const app = express();

const port = process.env.PORT || 4001; 

app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database lo gagal konek: ' + err.stack);
        return;
    }
    console.log('Mantap! Berhasil konek ke MySQL.');
});


app.post('/api/orders', async (req, res) => {
    const { userId, product_name, quantity } = req.body;

    try {
        
        const response = await fetch(`${process.env.USER_SERVICE_URL}/api/users/${userId}`);
        
        if (!response.ok) {
            return res.status(404).json({ message: "User tidak ditemukan di server sebelah!" });
        }

        const userData = await response.json(); 

        
        const sql = "INSERT INTO orders (user_id, product_name, quantity) VALUES (?, ?, ?)";
        db.query(sql, [userId, product_name, quantity], (err, result) => {
            if (err) throw err;
            res.json({ 
                message: "Order Berhasil Dibuat!", 
                id_order: result.insertId,
                pembeli: userData.name 
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal konek ke User Service. Cek .env atau port temen lo!" });
    }
});



app.get('/api/orders', (req, res) => {
    db.query("SELECT * FROM orders", (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});



app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM orders WHERE id = ?", [id], (err, result) => {
        if (err) throw err;
        res.json(result[0] || { message: "Order tidak ketemu!" });
    });
});


app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM orders WHERE id = ?", [id], (err, result) => {
        if (err) throw err;
        res.json({ message: "Order berhasil dihapus!" });
    });
});

app.listen(port, () => {
    console.log(`Order Service jalan di http://localhost:${port}`);
});