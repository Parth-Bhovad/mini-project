const express = require('express');
const userModel = require("./Models/user");
const postModel = require("./Models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.set('view engine', "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/profile', isLoggedIn, async (req, res) => {
   let user = await userModel.findOne({email:req.user.email}).populate("posts")
   console.log(user);
    res.render("profile", {user});
});

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email:req.user.email});
   let post = await postModel.create({
        user: user._id,
        content:req.body.content,
    });

    user.posts.push(post._id);
    await  user.save();
    res.redirect('/profile');
})

app.post('/register', async (req, res) => {
    let user = await userModel.findOne({ email: req.body.email });
    if (user) {
        return res.send("User already registered");
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, async (err, hash) => {
            const userCreated = await userModel.create({
                username: req.body.username,
                name: req.body.name,
                age: req.body.age,
                email: req.body.email,
                password: hash
            });

            let token = jwt.sign({ email: req.body.email, userid: req.body._id }, "shhhh");
            res.cookie("token", token);
            res.send("registered");
        })
    })

});

app.post('/login', async (req, res) => {
    let user = await userModel.findOne({ email: req.body.email });

    if (!user) {
        res.status(500).send("something went wrong");
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: req.body.email, userid: req.body._id }, "shhhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login')
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") {
        res.redirect("login");
    } else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
    }
    next();
}

app.listen(3000);