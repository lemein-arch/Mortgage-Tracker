const express = require('express');
const session = require("express-session");
const flash = require("express-flash");
const router = express.Router();
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');

// Route to handle form submission
router.post('/application', async (req, res) => {
    const { firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore } = req.body;
    const status = 'Pending'; 
    try {
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        //const userid = req.user.id;
        // Insert application data into the database
        const newApplication = await pool.query(
            `INSERT INTO applications (firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, user_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [firstname, lastname, email, phone, address, propertyaddress, propertyvalue, loanamount, employment, income, creditscore, status, userId]
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
        const firstName = req.session.firstName;
        const userApplications = await pool.query('SELECT * FROM applications WHERE user_id = $1', [userId]);
        res.render('loans', { user: firstName, applicationController: userApplications.rows });
    } catch (err) {
        console.error('Error getting user applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle dashboard rendering
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id; 
        const firstName = req.session.firstName;

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
        res.render('dashboard', {user: firstName, loanAmount, interestRate });
    } catch (err) {
        console.error('Error fetching loan details:', err.message);
        res.status(500).send('Internal Server Error');
    }
}); 

router.get('/dashboard', async (req, res) => {
    try {
        // Check if req.user and req.session.firstName are defined
        if (!req.user || !req.session.firstName) {
            // Handle the case where user authentication or session information is missing
            return res.status(401).send('Unauthorized');
        }
        
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        
        // Query the database to get all transactions of the user
        const total = await pool.query('SELECT amount FROM transaction WHERE user = $1', [userId]);

        // Initialize totalAmount to 0
        let totalAmount = 0;

        // Check if there are any transactions
        if (total.rows.length > 0) {
            // Calculate the total amount paid by summing up all transaction amounts
            for (const transaction of total.rows) {
                totalAmount += transaction.amount;
            }
        } else {
            // Set totalAmount to 0 if there are no transactions
            totalAmount = 0;
        }

        // Render the dashboard view with the total amount
        res.render('dashboard', { user: firstName, totalAmount: totalAmount });
    } catch (err) {
        console.error('Error getting user applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;