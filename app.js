var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override")
var moment = require("moment");
var uniqid = require('uniqid');
var Poll = require("./models/poll"); 
var User = require("./models/user");
var Comment = require("./models/comment")

//mac address config

// mongoose configs
// mongoose.connect("mongodb://localhost/voting_app", {useMongoClient: true});
mongoose.connect("mongodb://naveen:nyg201yy@ds143744.mlab.com:43744/voteready", {useMongoClient: true});
mongoose.Promise = global.Promise;
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'))
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

var uniId 
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   res.locals.voted = uniId;
   next();
});
// index routes
// ================================
app.get('/', function(req, res) {
    var id = uniqid();
    uniId = id;
    res.redirect('/home')
})
app.get("/home", function(req, res) {
    res.render("home");
})
// poll routes
// ===========================
// dashboard route
app.get('/polls', function(req, res) {
    Poll.find({}, function(err, polls) {
        if(err) {
            res.redirect('/')
        } else {
            res.render('dashboard', {polls: polls});
        }
    })
})
// new poll
app.get("/polls/new",isLoggedin,function(req, res) {
    res.render("new");
})
// new poll logic 
app.post("/polls/new",isLoggedin,function(req, res) {
    console.log('testing', req.body.aaa);
    var polling = {
        poll: req.body.aaa,
        option: req.body.voting,
        author: {
            id: req.user._id,
            username: req.user.username
        },
        ips: []
    }
    polling.option.forEach(function(opt) {
        opt.vote = 0;
    })
    console.log(polling);
    Poll.create(polling, function(err, poll) {
        if(err) {
            console.log(err)
        } else {
            console.log(poll)
            res.redirect("/polls");
        }
    })
})
// poll show route
app.get('/polls/:id', function(req, res) {
    Poll.findById(req.params.id).populate("comments").exec(function(err, foundpolls) {
     if(err) {
         console.log(err);
     }  else {
         res.render('show', {polls: foundpolls})
     }  
    })
})
// vote adding logic
app.post('/polls/:id', function(req, res) {
    Poll.update({_id: req.params.id, option: {$elemMatch: {text: req.body.choice}}},
    {$inc: {"option.$.vote": 1}, $push: {ips: uniId}},
    {multi: true, upsert: true}, function(err, updatepoll) {
        if(err) {
            console.log(err)
            res.redirect('/')
        } else {
            console.log(updatepoll)
            res.redirect('/polls/' +req.params.id);
        }
    })
})
// delete poll route 
app.delete('/polls/:id/del', function(req, res) {
    Poll.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err)
        } else {
            res.redirect('/polls')
        }
    })
})
// adding comment logic
app.post('/polls/:id/cmt',isLoggedin, function(req, res) {
    Poll.findById(req.params.id, function(err, polls) {
        if(err) {
            console.log(err)
            res.redirect('/')
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if(err) {
                    console.log(err)
                    res.redirect('/poll')
                } else {
                    comment.created = moment().format("MMM Do YY");
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    polls.comments.unshift(comment);
                    polls.save();
                    console.log(comment);
                    console.log(polls);
                    req.flash('success', 'Comment added successfully')
                    res.redirect('/polls/' + req.params.id)
                }
            })
        }
    })
})
// register route 
app.get('/register', function(req,res) {
    res.render('user/register')
})
// handling register logic
app.post('/register', function(req, res) {
     var newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            req.flash('error', err.message);
            return res.redirect("/register")
        } 
        passport.authenticate("local")(req, res, function() {
            res.redirect("/home");
        })
    })
})
// login route
app.get('/login', function(req, res) {
    res.render('user/login');
})
// handling logic of login
app.post("/login",passport.authenticate("local", {
    successRedirect : "/home",
    failureRedirect : "/login",
    failureFlash: true 
}), function(req, res) {
})
// logout route
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/home");
})
//  Poll.findById(req.params.id).populate("comments").exec(function(err, foundpolls) {
// mypolls route
app.get('/user/polls', function(req, res) {
    var userId = req.user._id;
    Poll.find().where('author.id').equals(userId).exec( function(err, userPolls) {
        if(err) {
            res.redirect('/home');
        } else {
             console.log(userPolls)
            res.render('mypoll', {polls: userPolls});
        }
    })
})
// db.collection('poll').findOneAndUpdate({'_id': ObjectID(req.params.id)}, {$inc: option});
// middlewares
function isLoggedin(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash('error', "you need to sign in or sign up to proceed")
    res.redirect("/login");
}
// server lunch
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("server started");
})

// app.post('/polls/:id', function(req, res) {
//     Poll.update({_id: req.params.id, option: {$elemMatch: {text: req.body.choice}}},
//     {$inc: {"option.$.vote": 1}}, function(err, updatepoll) {
//         if(err) {
//             console.log(err)
//         } else {
//             console.log(updatepoll)
//             res.redirect('/polls/' +req.params.id);
//         }
//     })
// })
// var a
// var data = a;
// function test() {
//     var id = uniqid();
//     id = a
// }