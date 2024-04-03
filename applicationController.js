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
        const emailContent = ` Hi ${firstName} 👋, \n\n Your mortgage application has been received and will undergo review.`;
        
        sendEmail(email, 'Application Received', emailContent);
        
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

        // Fetch the loan amount from approved applications if any
        const loanDetails = await pool.query(
            'SELECT amount FROM loans WHERE userid = $1', [userId]
        );

        let loanAmount = 0;
        let interestRate = 0;
        let totalLoan = 0; // Initialize total loan amount

        // If there is a loan for the user, calculate the interest rate and total loan amount
        if (loanDetails.rows.length > 0) {
            loanAmount = loanDetails.rows[0].amount;
            interestRate = loanAmount * 0.09; 
            totalLoan = loanAmount + interestRate;
        }

        // Fetch the total amount paid by the user from transactions
        const totalAmountPaidResult = await pool.query(
            'SELECT SUM(amount) AS total_paid FROM transaction WHERE userid = $1',
            [userId]
        );

        let totalAmountPaid = 0;
        if (totalAmountPaidResult.rows.length > 0 && totalAmountPaidResult.rows[0].total_paid !== null) {
            totalAmountPaid = totalAmountPaidResult.rows[0].total_paid;
        }

        // Calculate the difference between loan amount and total amount paid
        const remainingAmount = totalLoan - totalAmountPaid;

        // Render the dashboard with loan amount, total amount paid, remaining amount, and interest rate
        res.render('dashboard', { user: firstName, loanAmount, totalAmountPaid, remainingAmount, interestRate, totalLoan });
    } catch (err) {
        console.error('Error fetching loan details or total amount paid:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.session.firstName) {
            return res.status(401).send('Unauthorized');
        }
        
        // Extract user ID and first name from session
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        
        // Query the database to get all transactions made by all users
        const transactionsResult = await pool.query('SELECT userid, amount FROM transaction');

        // Initialize an object to store total amounts for each user
        const totalAmounts = {};

        // Calculate total amount for each user
        for (const transaction of transactionsResult.rows) {
            if (!totalAmounts[transaction.userid]) {
                totalAmounts[transaction.userid] = 0;
            }
            totalAmounts[transaction.userid] += transaction.amount;
        }

        // Get the total amount for the current user
        const totalAmount = totalAmounts[userId] || 0;

        // Render the dashboard view with the user's first name and the total amount
        res.render('dashboard', { user: firstName, totalAmount: totalAmount });
    } catch (err) {
        // Log error
        console.error('Error getting user transactions:', err.message);
        // Render error page or send internal server error response
        res.status(500).send('Internal Server Error');
    }
});





module.exports = router;