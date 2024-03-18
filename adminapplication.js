const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');

// PUT request to update application status
/**router.put('/admin/adminapplication/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', [status, id]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error updating application status:', error.message);
        res.sendStatus(500);
    }
}); **/


router.put('/admin/adminapplication/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Update the application status in the database
        await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', [status, id]);

        // Get the application details to determine the email recipient, loan amount, and user ID
        const applicationQuery = await pool.query('SELECT * FROM applications WHERE application_id = $1', [id]);
        const application = applicationQuery.rows[0];
        const { email, loanamount, user_id } = application;

        // Insert data into loans database
        const currentTime = new Date().toISOString(); // Current time and date
        await pool.query('INSERT INTO loans (app_id, amount, startdate, userid) VALUES ($1, $2, $3, $4)', [id, loanamount, currentTime, user_id]);

        // Calculate interest amount
        const interestRate = 0.09; // 9% interest rate
        const interestAmount = loanamount * interestRate;

        const emailMessage = `Your mortgage application has been approved.\n\nLoan Amount: ${loanamount}\nInterest Rate: 9%\nInterest Amount: ${interestAmount}\nLoan Start Time: ${currentTime}\n\nLogin to your account for further details`;


        // Send email notification based on the status
        if (status === 'Approved') {
            sendEmail(email, 'Application Approved', emailMessage);
        } else if (status === 'Rejected') {
            sendEmail(email, 'Application Rejected', 'Your mortgage application has been rejected.');
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
        const allApplications = await pool.query('SELECT * FROM applications WHERE status = \'Pending\'');
        res.render('admin/adminapplication', { adminapplication: allApplications.rows });
    } catch (err) {
        console.error('Error getting applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// GET request to fetch all approved applications to the admin dashboard
router.get('/admin/admindashboard', async (req, res) => {
    try {
        const approvedApplications = await pool.query('SELECT * FROM applications WHERE status = \'Approved\'');
        res.render('admin/admindashboard', { adminapplication: approvedApplications.rows });
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
        res.render('admin/admindashboard', { userId, userDocuments: userDocuments.rows });
    } catch (error) {
        console.error('Error fetching user documents:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
