const express = require('express');
const multer = require('multer');
const { pool } = require('./dbConfig');
const sendEmail = require('./mail');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id; 
    const userUploadsPath = `./public/documents/${userId}/`; 
    cb(null, userUploadsPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original filename
  }
});

const upload = multer({ storage: storage });

// Route to handle form submission
router.post('/submitdocs', upload.fields([
  { name: 'pay_statements', maxCount: 1 }, 
  { name: 'employment_contract', maxCount: 1 },
  { name: 'title_deed_lease', maxCount: 1 },
  { name: 'tax_comp', maxCount: 1 }
]), async (req, res) => {
  const { start_date, end_date, kra_pin } = req.body;
  const userid = req.user.id; 

  // Get file paths from multer
  const payStatementsPath = req.files['pay_statements'][0].path;
  const employmentContractPath = req.files['employment_contract'][0].path;
  const titleDeedLeasePath = req.files['title_deed_lease'][0].path;
  const taxCompPath = req.files['tax_comp'][0].path;

  try {
    // Insert document data into the database
    const newDocuments = await pool.query(
      `INSERT INTO documents (user_id, startdate, enddate, paystatements, employmentcontract, titledeed, taxcomp, krapin) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userid, start_date, end_date, payStatementsPath, employmentContractPath, titleDeedLeasePath, taxCompPath, kra_pin]
    );
    console.log('Documents inserted successfully');

    // Send email to user
    sendEmail(req.user.email, 'Application Received', 'Your supporting documents have been received.');
    //sendEmail(email, 'Application Received', 'Your mortgage application has been received and will undergo review.');

    res.redirect('/dashboard'); // Redirect to a success page
  } catch (err) {
    console.error('Error inserting documents:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
