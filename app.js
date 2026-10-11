if(process.env.NODE_ENV != "production"){
    require('dotenv').config()
}

const express = require("express")
const app = express()
const mongoose = require("mongoose")
const path = require("path")
const crypto = require("crypto")
const csrfProtection = require("./utils/csrf.js")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const ExpressError = require("./utils/ExpressError.js")
const session = require("express-session")
const { MongoStore } = require('connect-mongo');
const flash = require("./utils/flash.js")
const passport = require("passport")
const localStrategy = require("passport-local")
const User = require("./models/user.js")

const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")

// const MONGO_URL = "mongodb://127.0.0.1:27017/staynest"
const dbUrl = process.env.ATLASDB_URL
const port = Number(process.env.PORT) || 8080

if (!dbUrl || !process.env.SECRET) {
    throw new Error("ATLASDB_URL and SECRET must be configured")
}

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1)
}

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-Frame-Options", "DENY")
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "script-src 'self' https://api.mapbox.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://api.mapbox.com",
        "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com",
        "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://api.mapbox.com https://*.mapbox.com",
        "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
        "worker-src 'self' blob:",
    ].join("; "))
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }
    next()
})
app.use(express.urlencoded({ extended: true, limit: "20kb", parameterLimit: 100 }))
app.use(methodOverride("_method"))
app.engine("ejs", ejsMate) 
app.use(express.static(path.join(__dirname, "/public")))

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
})

store.on("error", (err) => {
    console.error("ERROR in MONGO SESSION STORE", err);
})


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    }
}

// app.get("/", (req, res) => {
//     res.send("Hi, I am root")
// })



app.use(session(sessionOptions))
app.use((req, res, next) => {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex")
    res.locals.csrfToken = req.session.csrfToken
    next()
})
app.use(csrfProtection)
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.currUser = req.user
    next()
})

app.get("/", (req, res) => {
    res.redirect("/listings")
})

app.use("/listings", listingRouter)
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)





// app.get("/testListing", async(req, res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute, Goa",
//         country: "India",
//     })

//     await sampleListing.save()
//     console.log("Sample was saved");
//     res.send("successful testing")
// })

app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page not found"))
})

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    const statusCode = err.name === "MulterError"
        ? (err.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        : Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500
    const message = statusCode >= 500 ? "Something went wrong. Please try again later." : err.message
    if (statusCode >= 500) console.error(err)
    res.status(statusCode).render("error.ejs", {message})
})

async function main() {
    try {
        await mongoose.connect(dbUrl)
        console.log("connected to DB")

        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`)
        })
    } catch (err) {
        console.error("Failed to connect to DB:", err)
        process.exitCode = 1
    }
}

main()
