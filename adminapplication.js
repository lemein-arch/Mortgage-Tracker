const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");

// PUT request to update application status
router.put('/admin/adminapplication/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', [status, id]);
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

module.exports = router;
