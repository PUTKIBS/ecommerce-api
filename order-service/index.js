require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const axios = require('axios'); // Untuk memanggil User Service
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ Gagal konek ke DB Order:', err.message);
        return;
    }
    console.log('✅ Connected to Order Database');

    // Buat tabel otomatis jika belum ada
    const sql = `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        total_price INT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    db.query(sql, (err) => { 
        if(err) console.log('❌ Gagal buat tabel:', err); 
        else console.log('✅ Orders table ready'); 
    });
});

// Endpoint untuk membuat pesanan
app.post('/api/orders', async (req, res) => {
    const { user_id, product_name, total_price } = req.body;

    try {
        // 1. "Jembatan": Cek ke User Service apakah user ada?
        const userCheck = await axios.get(`http://localhost:3301/api/users/validate/${user_id}`);
        
        if (userCheck.data.valid) {
            // 2. Jika valid, simpan pesanan
            const query = "INSERT INTO orders (user_id, product_name, total_price) VALUES (?, ?, ?)";
            db.query(query, [user_id, product_name, total_price], (err, result) => {
                if (err) return res.status(500).json({ message: "Gagal simpan order", error: err.message });
                res.status(201).json({ message: "Order berhasil dibuat!", orderId: result.insertId });
            });
        }
    } catch (error) {
        // Jika user tidak ditemukan (error 404 dari User Service)
        res.status(400).json({ message: "User tidak valid, pesanan ditolak!" });
    }
});

// Endpoint untuk melihat semua pesanan
app.get('/api/orders', (req, res) => {
    const query = "SELECT * FROM orders";
    
    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal mengambil data pesanan", error: err.message });
        
        res.json(result);
    });
});

// Endpoint Update Status Pesanan
app.patch('/api/orders/:id', (req, res) => {
    const { status } = req.body; // Status baru (contoh: 'shipped', 'delivered')
    const orderId = req.params.id;

    const query = "UPDATE orders SET status = ? WHERE id = ?";
    
    db.query(query, [status, orderId], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update status", error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan" });
        }
        
        res.json({ message: `Status pesanan ${orderId} berhasil diupdate ke ${status}` });
    });
});

// Endpoint Hapus Pesanan
app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;

    const query = "DELETE FROM orders WHERE id = ?";
    
    db.query(query, [orderId], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menghapus pesanan", error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Pesanan tidak ditemukan" });
        }
        
        res.json({ message: "Pesanan berhasil dibatalkan/dihapus!" });
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Order Service running on port ${PORT}`));