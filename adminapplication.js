const express = require('express');
const router = express.Router();
const session = require("express-session");
const flash = require("express-flash");
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');

// PUT request to update application status
router.put('/admin/adminapplication/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {

        const userId = req.session.userId;
        const firstName = req.session.firstName;

        // Update the application status in the database
        await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', [status, id]);

        // Get the application details to determine the email recipient, loan amount, and user ID
        const applicationQuery = await pool.query('SELECT * FROM applications WHERE application_id = $1', [id]);
        const application = applicationQuery.rows[0];
        const { email, loanamount, user_id } = application;

        // Insert data into loans database
        const currentTime = new Date().toISOString(); 
        await pool.query('INSERT INTO loans (app_id, amount, startdate, userid) VALUES ($1, $2, $3, $4)', [id, loanamount, currentTime, user_id]);

        // Calculate interest amount
        const interestRate = 0.09; 
        const interestAmount = loanamount * interestRate;

         // Retrieve client's first name using user_id
         const userQuery = await pool.query('SELECT firstname FROM users WHERE id = $1', [user_id]);
         const { firstname } = userQuery.rows[0];

        const emailMessage = `Hi ${firstname} 👋,\n\nYour mortgage application has been approved.\n\nLoan Amount: ${loanamount}\nInterest Rate: 9%\nInterest Amount: ${interestAmount}\nLoan Start Time: ${currentTime}\n\nLogin to your account for further details`;

        const rejectMessage = `Hi ${firstname} 👋,\n\nWe regret to inform you that your mortgage application has been rejected. We understand how disappointing this news may be, and we want to assure you that we carefully reviewed your application. If you have any questions or need further assistance, please don't hesitate to reach out to us. We're here to help.\n\nBest regards, \nThe Mortgage Team`;

        // Send email notification based on the status
        if (status === 'Approved') {
            sendEmail(email, 'Application Approved', emailMessage);
        } else if (status === 'Rejected') {
            sendEmail(email, 'Application Rejected', rejectMessage);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating application status:', error.message);
        res.sendStatus(500);
    }
});

// GET request to fetch all applications 
router.get('/admin/adminapplication', async (req, res) => {
    try {
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        const allApplications = await pool.query('SELECT * FROM applications WHERE status = \'Pending\'');
        res.render('admin/adminapplication', { user: firstName,adminapplication: allApplications.rows });
    } catch (err) {
        console.error('Error getting applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// GET request to fetch all approved applications to the admin dashboard
router.get('/admin/admindashboard', async (req, res) => {
    try {
        // Retrieve user ID and first name from the session
        const userId = req.session.userId;
        const firstName = req.session.firstName;

        // Fetch approved applications
        const approvedApplications = await pool.query('SELECT * FROM applications WHERE status = \'Approved\'');
        res.render('admin/admindashboard', { user: firstName, adminapplication: approvedApplications.rows });
    } catch (err) {
        console.error('Error getting applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// GET request to fetch user documents
router.get('/admin/viewdocs/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch the documents for the specified user
        const userDocuments = await pool.query('SELECT * FROM documents WHERE user_id = $1', [userId]);
        
        // Render the viewdocs template and pass the user's documents data
        res.render('admin/admindashboard', { user: firstName, userDocuments: userDocuments.rows });
    } catch (error) {
        console.error('Error fetching user documents:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// GET request to fetch all approved applications to the admin dashboard
router.get('/admin/transactions', async (req, res) => {
    try {
        // Retrieve user ID and first name from the session
        const userId = req.session.userId;
        const firstName = req.session.firstName;

        // Fetch approved transactions
        const approvedTransactions = await pool.query('SELECT * FROM transaction ');
        res.render('admin/transactions', { user: firstName, adminapplication: approvedTransactions.rows });
    } catch (err) {
        console.error('Error getting transactions:', err.message);
        res.status(500).send('Internal Server Error');
    }
}); 

// GET request to fetch all approved applications to the admin dashboard
/**router.get('/admin/transactions', async (req, res) => {
    try {
        // Retrieve user ID and first name from the session
        const userId = req.session.userId;
        const firstName = req.session.firstName;

        // Fetch the total amount paid for each user
        const totalAmountPaidPerUser = await pool.query('SELECT userid, name, refnumber, SUM(amount) AS totalAmountPaid FROM transaction GROUP BY userid, name, refnumber');

        res.render('admin/transactions', { user: firstName, totalAmountPaidPerUser: totalAmountPaidPerUser.rows });
    } catch (err) {
        console.error('Error getting transactions:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
**/


module.exports = router;
