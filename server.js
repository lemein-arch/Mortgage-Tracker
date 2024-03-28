const express = require('express');
const { pool } = require("./dbConfig");
const passport = require("passport");
const path = require ("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("express-flash");
const sendEmail = require('./mail.js');
const fs = require('fs');
require("dotenv").config();


const app = express();

const PORT = process.env.PORT || 3000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

const applicationController = require('./applicationController');

const adminapplication = require('./adminapplication');

const submitdocs = require('./submitdocs.js');

const loans = require('./loans.js');


//middleware
app.use(express.urlencoded({ extended: false}));

app.set("view engine", "hbs");


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());

app.use(passport.session());

app.use(flash());

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use('/', applicationController);

app.use('/', adminapplication);

app.use('/', submitdocs);

app.use('/', loans);

app.get('/', (req, res)=>{
    res.render("index");
});

app.get("/register", checkAuthenticated,(req, res) =>{
    res.render("register")
})

app.get("/login", checkAuthenticated,(req, res) =>{
    res.render("login")
})

app.get("/dashboard", checkNotAuthenticated, (req, res) => {
    if (req.isAuthenticated()) {
        const isAdmin = req.user.isadmin; 
        if (isAdmin) {
            return res.redirect("/admin/admindashboard"); 
        } else {
            return res.render("dashboard", { user: req.user.firstname }); 
        }
    } else {
        // If user is not authenticated, redirect to login
        res.redirect("/login");
    }
});

app.get("/loanpayments", checkNotAuthenticated, (req, res) => {
    res.render('loanpayments', { user: req.user.firstname });
});

app.get("/application", checkNotAuthenticated, (req, res) => {
    res.render('application', { user: req.user.firstname });
});

app.get("/loans", checkNotAuthenticated, (req, res) => {
    res.render('loans', { user: req.user.firstname });
});

app.get("/submitdocs", checkNotAuthenticated, (req, res) => {
    res.render('submitdocs', { user: req.user.firstname });
});

app.get("/admin/admindashboard", checkAdminAuthenticated, (req, res) => {
    res.render("admin/admindashboard", { user: req.user.firstname });
});

app.get("/admin/adminapplication", checkAdminAuthenticated, (req, res) => {
    res.render("admin/adminapplication", { user: req.user.firstname });
});


app.get("/admin/transactions", checkAdminAuthenticated, (req, res) => {
    res.render("admin/transactions", { user: req.user.firstname });
});

app.get("/admin/viewdocs", checkAdminAuthenticated, (req, res) => {
    res.render("admin/viewdocs", { user: req.user.firstname });
});


app.get("/logout", (req,res) =>{
    req.logOut(function(err) {
        if(err) {return next(err);}
        req.flash("success_msg", "You have logged out");
        res.redirect("/login");
    });
})
app.post("/register" , async(req, res) =>{
    let {firstname, secondname, email, phonenumber, dateofbirth, password, confirmedpassword } = req.body;

    console.log({
        firstname,
        secondname,
        email,
        phonenumber,
        dateofbirth,
        password,
        confirmedpassword
    });

    let errors = [];

    if(!firstname || !secondname || !email || !phonenumber || !dateofbirth || !password || !confirmedpassword) {
        errors.push ({message: "Please enter all fields"});
    }

    if( password.length < 8) {
        errors.push ({message: "Password must be at least 8 characters"});
    }

    if( password != confirmedpassword) {
        errors.push ({message: "Passwords do not match"});
    }

    if(errors.length > 0){
        res.render("register", {errors});
    }
    else{
        // Validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results) =>{
                if(err){
                    throw err;
                }
                console.log(results.rows);

                if (results.rows.length > 0 ){
                    errors.push({message: "The email is already registered"});
                    res.render("register", {errors});
                }
                else{
                    pool.query(
                        `INSERT INTO users (firstname, secondname, email, phonenumber, dateofbirth, password, isadmin)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id, password`, [firstname, secondname, email, phonenumber, dateofbirth, hashedPassword, false], (err, results) =>{
                            if(err){
                                throw err;
                            }

                           /**  console.log(results.rows);
                            req.flash("success_msg", "You are now registered. Please login in");
                            res.redirect("/Users/login");

                            // Create directory for the user
                            const userId = results.rows[0].id;
                            const userDirectory = path.join(__dirname, 'public', 'documents', userId.toString());
                            if (!fs.existsSync(userDirectory)) {
                                fs.mkdirSync(userDirectory, { recursive: true });
                                console.log('User directory created:', userDirectory);
                            } */

                        }
                        
                    );
                }
            }
            );
    }
});

//sendEmail();

app.post("/login", passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
}), function(req, res) {
    // If authentication is successful
    if (req.isAuthenticated()) {
        // Store user ID and first name in the session
        req.session.userId = req.user.id;
        req.session.firstName = req.user.firstname;

        // Determine the redirection based on isAdmin value
        if (req.user.isadmin) {
            // Redirect to admin dashboard if user is an admin
            res.redirect("/admin/admindashboard");
        } else {
            // Redirect to regular dashboard if user is not an admin
            res.redirect("/dashboard");
        }
    } else {
        // Handle authentication failure if needed
        res.redirect("/login");
    }
});



function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect("/dashboard");
    }
    next();
}
function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
}

function checkAdminAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.isadmin) {
        return next();
    }
    res.redirect("/login");
}
app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})