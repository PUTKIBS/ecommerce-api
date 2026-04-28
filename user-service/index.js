require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// Middleware wajib
app.use(cors());
// Agar bisa membaca dan menerima data dalam format JSON sesuai spesifikasi proyek [cite: 16, 26]
app.use(express.json()); 

// Konfigurasi Koneksi Database (Sudah disesuaikan untuk Railway)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,       // <-- Port khusus Railway masuk di sini
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Cek Koneksi dan Buat Tabel Otomatis
db.connect((err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database Railway:', err.message);
        return;
    }
    
    // Memberi tahu kita sedang berada di database mana agar tidak nyasar
    console.log(`✅ Berhasil terhubung ke database Railway (Database: ${process.env.DB_NAME})`);
    
    // Perintah SQL untuk membuat tabel secara otomatis jika belum ada
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Mengeksekusi pembuatan tabel
    db.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('❌ Gagal membuat tabel users:', err.message);
        } else {
            console.log('✅ Tabel "users" sudah divalidasi dan siap digunakan!');
        }
    });
});

// --- AREA ENDPOINT API ---

// Endpoint Test (Untuk ngecek server jalan atau tidak)
app.get('/', (req, res) => {
    res.json({ message: "Welcome to User Service API" });
});

// Nanti endpoint /register, /profile, /validate/{id} kita taruh di bawah sini

// Endpoint untuk Pendaftaran User Baru
app.post('/api/users/register', (req, res) => {
    const { name, email, password, address } = req.body;

    // Validasi sederhana: pastikan data tidak kosong
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, dan password wajib diisi!" });
    }

    // Query SQL untuk insert data
    const query = "INSERT INTO users (name, email, password, address) VALUES (?, ?, ?, ?)";
    
    // Kita jalankan query
    db.query(query, [name, email, password, address], (err, result) => {
        if (err) {
            // Jika email sudah terdaftar (duplicate entry)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "Email sudah terdaftar!" });
            }
            return res.status(500).json({ message: "Gagal mendaftar user", error: err.message });
        }
        
        // Jika sukses
        res.status(201).json({ 
            message: "User berhasil didaftarkan!", 
            userId: result.insertId 
        });
    });
});

// Endpoint Get User Profile
app.get('/api/users/profile/:id', (req, res) => {
    const userId = req.params.id;

    // Hanya ambil field yang perlu ditampilkan (jangan ambil password!)
    const query = "SELECT id, name, email, address FROM users WHERE id = ?";
    
    db.query(query, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal mengambil data", error: err.message });
        
        if (result.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan!" });
        }
        
        res.json(result[0]);
    });
});

// Endpoint Update Profile
app.put('/api/users/profile/:id', (req, res) => {
    const userId = req.params.id;
    const { name, address } = req.body;

    const query = "UPDATE users SET name = ?, address = ? WHERE id = ?";
    
    db.query(query, [name, address, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update data", error: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User tidak ditemukan!" });
        }
        
        res.json({ message: "Profil berhasil diupdate!" });
    });
});

// Endpoint Delete User
app.delete('/api/users/profile/:id', (req, res) => {
    const userId = req.params.id;

    // Query untuk menghapus user berdasarkan ID
    const query = "DELETE FROM users WHERE id = ?";
    
    db.query(query, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menghapus user", error: err.message });
        
        // Cek apakah ada data yang terhapus (jika ID tidak ada, affectedRows akan 0)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User tidak ditemukan!" });
        }
        
        res.json({ message: "User berhasil dihapus!" });
    });
});

// Endpoint untuk mengambil semua user
app.get('/api/users', (req, res) => {
    const query = "SELECT * FROM users"; // Ambil semua data dari tabel users
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Gagal mengambil data", error: err.message });
        
        // Mengirimkan hasil query dalam bentuk JSON
        res.json(results);
    });
});



// Endpoint Validate (Digunakan oleh Order Service Rasyid)
app.get('/api/users/validate/:id', (req, res) => {
    const userId = req.params.id;

    // Kita cari user-nya, cukup ambil ID dan Nama saja untuk validasi
    const query = "SELECT id, name, email FROM users WHERE id = ?";
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ valid: false, message: "Error pada server database" });
        }
        
        if (result.length > 0) {
            // User ditemukan! Kirim valid: true agar Rasyid bisa lanjut
            res.json({ 
                valid: true, 
                user: result[0] 
            });
        } else {
            // User tidak ada, Rasyid akan menerima valid: false
            res.status(404).json({ 
                valid: false, 
                message: "User tidak terdaftar" 
            });
        }
    });
});

// --- JALANKAN SERVER ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 User Service berjalan di http://localhost:${PORT}`);
});