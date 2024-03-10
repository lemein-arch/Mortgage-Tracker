const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');

// Route to handle form submission
router.post('/application', async (req, res) => {
    const { firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore } = req.body;
    const status = 'Pending'; 
    try {

        const userid = req.user.id;
        // Insert data into the database
        const newApplication = await pool.query(
            `INSERT INTO applications (firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, userid]
        );
        console.log('Data inserted successfully');
        // Send email to user
        sendEmail(email, 'Application Received', 'Your mortgage application has been received and will undergo review.');
        
        res.redirect('/dashboard'); 
    } catch (err) {
        console.error('Error inserting data:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/loans', async (req, res) => {
    try {
        const userId = req.user.id; 
        const userApplications = await pool.query('SELECT * FROM applications WHERE user_id = $1', [userId]);
        res.render('loans', { applicationController: userApplications.rows });
    } catch (err) {
        console.error('Error getting user applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
