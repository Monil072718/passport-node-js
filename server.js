const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const { connectDb } = require('./database/db');
const BlogModal = require('./model/blogModal');
const UserModal = require('./model/userModal');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session'); // Require express-session

connectDb();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(express.static('upload'));
app.use(express.static('public'));

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, 'upload');
    },
    filename: (req, file, cb) => {
        return cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('file');

// Passport configuration
passport.use(new LocalStrategy(
    {
        usernameField: 'email', // assuming email as username
        passwordField: 'password'
    },
    async function (email, password, done) {
        try {
            const user = await UserModal.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            if (user.password !== password) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await UserModal.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false })); // Use express-session

app.use(passport.initialize());
app.use(passport.session());

// Routes

const auth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        next();
    }
};
app.get('/', async (req, res) => {
    const blog = await BlogModal.find({});
    res.render('pages/index', { blogs: blog, user: req.user });
});
app.get('/add', auth, (req, res) => {
    console.log(req.user)
    res.render('pages/add', { user: req.user });
});

app.post('/add', async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error uploading file.');
        }
        if (req.file) {
            var details = {
                title: req.body.title,
                description: req.body.description,
                username: req.body.username,
                date: req.body.date,
                image: req.file.filename
            };
            try {
                const blog = new BlogModal(details);
                const result = await blog.save();
                res.redirect('/');
            } catch (error) {
                console.error(error);
                res.status(500).send('Error saving blog details.');
            }
        } else {
            res.status(400).send('No file uploaded.');
        }
    });
});

app.get('/signup', (req, res) => {
    res.render('pages/signup');
});

// Assuming this is your route for handling user sign-up
app.post('/signup', async function(req, res) {
    try {
        const {name, email, password } = req.body;
        // Check if the email is already registered
        const existingUser = await UserModal.findOne({ email });
        if (existingUser) {
            // Redirect to sign-up page with a message indicating email already exists
            return res.redirect('/signup?error=emailExists');
        }
        // Create a new user
        const newUser = new UserModal({name, email, password });
        await newUser.save();
        // Redirect to login page after successful sign-up
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        // Redirect to sign-up page with an error message if something goes wrong
        res.redirect('/signup?error=unknown');
    }
});

  
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/add');
    }
    res.render('pages/login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/add',
    failureRedirect: '/login',
    // failureFlash: true
}));

app.get('/signout', (req, res , next) => {
    // req.logout();
    // res.redirect('/login');
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    // console.log('hii')
});

app.listen(7500, () => {
    console.log('Listening on port 7500');
});
