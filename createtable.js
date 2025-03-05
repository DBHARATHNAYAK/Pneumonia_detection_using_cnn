const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3030;

// Database connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Vasaviram@123',
    database: 'college'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to the database successfully');
});

// Route to create the "users" table
app.get('/createTable', (req, res) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            name VARCHAR(100),
            email VARCHAR(255) UNIQUE NOT NULL
        )
    `;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error creating table:', err.message);
            res.status(500).send(`Error creating table: ${err.message}`);
            return;
        }
        console.log('Table created successfully:', result);
        res.send('Table created successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
