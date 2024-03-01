const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");

router.get('/adminapplication', async (req, res) => {
    try {
        const allApplications = await pool.query('SELECT * FROM applications');
        res.render('admin/adminapplication', { adminapplication: allApplications.rows });
    } catch (err) {
        console.error('Error getting applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle approving an application
router.post('/approve/:application_id', async (req, res) => {
    const { application_id } = req.params;
    try {
        await pool.query('UPDATE applications SET status = $1 WHERE id = $2', ['approved', application_id]);
        res.redirect('/admin/adminapplication'); // Redirect back to the admin application page
    } catch (err) {
        console.error('Error approving application:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle rejecting an application
router.post('/reject/:application_id', async (req, res) => {
    const { application_id } = req.params;
    try {
        await pool.query('UPDATE applications SET status = $1 WHERE id = $2', ['rejected', application_id]);
        res.redirect('/admin/adminapplication'); // Redirect back to the admin application page
    } catch (err) {
        console.error('Error rejecting application:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
