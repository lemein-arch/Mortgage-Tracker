const express = require('express');
const { pool } = require("./dbConfig");
const passport = require("passport");
const path = require ("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("express-flash");
require("dotenv").config();


const app = express();

const PORT = process.env.PORT || 3000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

const applicationController = require('./applicationController');


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

app.get('/', (req, res)=>{
    res.render("index");
});

app.get("/register", checkAuthenticated,(req, res) =>{
    res.render("register")
})

app.get("/Users/login", checkAuthenticated,(req, res) =>{
    res.render("login")
})

app.get("/dashboard", checkNotAuthenticated, (req, res) => {
    if (req.isAuthenticated()) {
        const isAdmin = req.user.isadmin; // Assuming 'isadmin' is the property name
        if (isAdmin) {
            return res.redirect("/admin/admindashboard"); // Redirect to admin dashboard
        } else {
            return res.render("dashboard", { user: req.user.firstname }); // Render user dashboard
        }
    } else {
        // If user is not authenticated, redirect to login
        res.redirect("/Users/login");
    }
});


app.get("/loanpayments", checkNotAuthenticated, (req, res) => {
    res.render('loanpayments', { user: req.user.firstname });
});

app.get("/application", checkNotAuthenticated, (req, res) => {
    res.render('application', { user: req.user.firstname });
});

app.get("/calender", checkNotAuthenticated, (req, res) => {
    res.render('calender', { user: req.user.firstname });
});

app.get("/admin/admindashboard", checkAdminAuthenticated, (req, res) => {
    res.render("admin/admindashboard", { user: req.user.firstname });
});



app.get("/Users/logout", (req,res) =>{
    req.logOut(function(err) {
        if(err) {return next(err);}
        req.flash("success_msg", "You have logged out");
        res.redirect("/Users/login");
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

                            console.log(results.rows);
                            req.flash("success_msg", "You are now registered. Please login in");
                            res.redirect("/Users/login");

                        }
                        
                    );
                }
            }
            );
    }
});

app.post("/Users/login", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/Users/login",
    failureFlash: true
})
);

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
    res.redirect("/Users/login")
}

function checkAdminAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.isadmin) {
        return next();
    }
    res.redirect("/Users/login");
}
app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})