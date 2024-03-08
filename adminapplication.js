const express = require('express');
const router = express.Router();
const { pool } = require("./dbConfig");

router.get('/admin/adminapplication', async (req, res) => {
    try {
        const allApplications = await pool.query('SELECT * FROM applications');
        // Log the data to see if it's fetched correctly
        console.log(allApplications.rows);
        res.render('admin/adminapplication', { adminapplication: allApplications.rows });
    } catch (err) {
        console.error('Error getting applications:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
