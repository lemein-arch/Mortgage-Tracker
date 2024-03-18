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
        // Insert application data into the database
        const newApplication = await pool.query(
            `INSERT INTO applications (firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, userid]
        );
        console.log('Data inserted successfully');
        // Send email to user
        //sendEmail(email, 'Application Received', 'Your mortgage application has been received and will undergo review.');
        
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

// Route to handle dashboard rendering
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id; 

        // Fetch the loan amount from approved applications
        const loanDetails = await pool.query(
            'SELECT amount FROM loans WHERE userid = $1',
            [userId]
        );

        // If there is a loan for the user, calculate the interest rate
        let loanAmount = 0;
        let interestRate = 0;
        if (loanDetails.rows.length > 0) {
            loanAmount = loanDetails.rows[0].amount;
            interestRate = loanAmount * 0.09; 
        }

        // Render the dashboard with loan amount and interest rate
        res.render('dashboard', { loanAmount, interestRate });
    } catch (err) {
        console.error('Error fetching loan details:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
