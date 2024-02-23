const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");

// Route to handle form submission
router.post('/application', async (req, res) => {
    const { firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore } = req.body;
    try {
        // Insert data into the database
        const newApplication = await pool.query(
            `INSERT INTO applications (firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore]
        );
        console.log('Data inserted successfully');
        res.redirect('/dashboard'); // Redirect to dashboard after successful submission
    } catch (err) {
        console.error('Error inserting data:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
