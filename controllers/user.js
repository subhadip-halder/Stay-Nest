const User = require("../models/user")

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs")
}

module.exports.signup = async(req, res, next) => {
    try{
    let {username, email, password} = req.body
    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30
        || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        || typeof password !== "string" || password.length < 10 || password.length > 128) {
        req.flash("error", "Use a username of 3–30 characters, a valid email address, and a password of 10–128 characters.")
        return res.redirect("/signup")
    }
    username = username.trim()
    email = email.trim().toLowerCase()
    const newUser = new User({email, username})
    const registerUser =  await User.register(newUser, password)
    req.login(registerUser, (err) => {
        if(err){
            return next(err)
        }
        req.flash("success", "Welcome to StayNest!")
        res.redirect("/listings")
    })
    } catch (e){
        req.flash("error", "Unable to create the account. Check your details or try a different username or email.")
        res.redirect("/signup")
    }
    
}

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs")
}

module.exports.login = async(req, res) => {
    require("../utils/authRateLimit.js").reset(req, "login")
    req.flash("success", "Welcome back to StayNest!")
    const candidate = res.locals.redirectUrl
    const redirectUrl = typeof candidate === "string" && candidate.startsWith("/") && !candidate.startsWith("//")
        ? candidate
        : "/listings"
    res.redirect(redirectUrl)
}

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err){
            return next(err)
        }
        req.flash("success", "you are logged out!!")
        res.redirect("/listings")
    })
}
