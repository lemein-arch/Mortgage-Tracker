const express = require('express');
const session = require("express-session");
const flash = require("express-flash");
const router = express.Router();
const { pool } = require("./dbConfig");
const sendEmail = require('./mail.js');

router.get('/loanpayments', async (req, res) => {
    try {
        
        const userId = req.session.userId;
        const firstName = req.session.firstName;
        
        const transactions = await pool.query('SELECT * FROM transaction WHERE user = $1', [userId]);
        res.render('loanpayments', { user: firstName, loans: transactions.rows });
    } catch (err) {
        console.error('Error getting user applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;