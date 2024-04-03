const express = require('express');
const session = require("express-session");
const flash = require("express-flash");
const router = express.Router();
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');


// Route to handle dashboard rendering
router.get('/payment', async (req, res) => {
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
            totalloan = loanAmount + interestRate;
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
        const remainingAmount = totalloan - totalAmountPaid;

        // Render the dashboard with loan amount, total amount paid, remaining amount, and interest rate
        res.render('payment', { user: firstName, loanAmount, totalAmountPaid, remainingAmount, interestRate, totalloan });
    } catch (err) {
        console.error('Error fetching loan details or total amount paid:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

const { v4: uuidv4 } = require('uuid'); 

router.post('/payment', async (req, res) => {
    const { mpesaNumber, TotalPaid } = req.body; 
    const status = 'Pending'; 
    try {
        // Retrieve userId and firstName from session
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        
        // Generate a random reference number with the first 6 characters of the generated UUID
        const refNumber = uuidv4().substr(0, 6); 

        // Get the current date and time
        const currentDate = new Date().toISOString();

        console.log('Variables:', { firstName, mpesaNumber, currentDate, refNumber, TotalPaid, userId, status });
        
        // Insert transaction data into the database
        const newTransaction = await pool.query(
            `INSERT INTO transaction (name, phonenumber, clock, refnumber, amount, userid, transstatus) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [firstName, mpesaNumber, currentDate, refNumber, TotalPaid, userId, status]
        );
        
        console.log('Data inserted successfully');
        
        // Retrieve user's email from the database
        const user = await pool.query(
            `SELECT email FROM users WHERE id = $1`,
            [userId]
        );

        const userEmail = user.rows[0].email; 
        
        const paymentContent = `
           
            Hi ${firstName} 👋, You have paid an amount of KES ${TotalPaid}.\n\nThis is your reference number: ${refNumber}.\n\nYour payment is currently pending approval. `;
        
        // Assuming sendEmail function is defined properly
        sendEmail(userEmail, 'Payment Received', paymentContent);
        
        res.redirect('/dashboard'); 
    } catch (err) {
        console.error('Error inserting data:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

/**router.get('/loanpayments', async (req, res) => {
    try {
        // Retrieve user ID and first name from the session
        const userId = req.session.userId;
        const firstName = req.session.firstName;

        console.log("User ID:", userId);
        console.log("First Name:", firstName);

        // Fetch approved transactions
        const myTransactions = await pool.query('SELECT * FROM transaction WHERE userid = $1', [userId]);

        console.log("Transactions:", myTransactions.rows);

        // Render the loanpayments HTML page
        res.render('loanpayments', { user: firstName, loanpayments: myTransactions.rows });
    } catch (err) {
        console.error('Error getting transactions:', err.message);
        res.status(500).send('Internal Server Error');
    }
}); **/

router.get('/loanpayments', async (req, res) => {
    try {
        const userId = req.user.id; 
        const firstName = req.session.firstName;
        const myTransactions = await pool.query('SELECT * FROM transaction WHERE userid = $1', [userId]);
        res.render('loanpayments', { user: firstName, transactions: myTransactions.rows });
    } catch (err) {
        console.error('Error getting user applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// GET request to download transactions as CSV
router.get('/loanpayments', async (req, res) => {
    try {
        // Retrieve user ID from the session
        const userId = req.session.userId;

        // Fetch approved transactions
        const myTransactions = await pool.query('SELECT * FROM transaction WHERE userid = $1', [userId]);

        // Convert transactions to CSV format
        const csvData = myTransactions.rows.map(transaction => `${transaction.id},${transaction.name},${transaction.refnumber},${transaction.amount}`).join('\n');
        
        // Set response headers for CSV download
        res.setHeader('Content-disposition', 'attachment; filename=payments.csv');
        res.set('Content-Type', 'text/csv');
        
        // Send CSV data as response
        res.status(200).send(csvData);
    } catch (err) {
        console.error('Error downloading transactions as CSV:', err.message);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;