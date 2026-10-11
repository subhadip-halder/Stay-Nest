const express = require("express")
const router = express.Router()
const User = require("../models/user.js")
const wrapAsync = require("../utils/wrapAsync")
const passport = require("passport")
const { savedRedirectUrl } = require("../middleware.js")
const authRateLimit = require("../utils/authRateLimit.js")

const userController = require("../controllers/user.js")

router.route("/signup")
.get(userController.renderSignupForm)
.post(authRateLimit("signup"), wrapAsync(userController.signup))

router.route("/login")
.get(userController.renderLoginForm)
.post(
    authRateLimit("login"),
    savedRedirectUrl,
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
userController.login
)

router.post("/logout", userController.logout)

module.exports = router
