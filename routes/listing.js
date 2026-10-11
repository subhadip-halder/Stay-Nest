const express = require("express")
const router = express.Router()
const wrapAsync = require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js")
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js")

const listingController = require("../controllers/listing.js")
const multer  = require('multer')
const {storage} = require("../cloudConfig.js")
const ExpressError = require("../utils/ExpressError.js")
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 12, parts: 14 },
    fileFilter(req, file, cb) {
        const allowedTypes = new Set(["image/jpeg", "image/png"])
        cb(allowedTypes.has(file.mimetype) ? null : new ExpressError(400, "Only PNG and JPEG images are allowed."), allowedTypes.has(file.mimetype))
    },
})


router.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn,
     upload.single('listing[image]'),
     validateListing, 
     wrapAsync(listingController.createListing))

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm)

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm))

router.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn,
     isOwner,
     upload.single("listing[image]"),
      validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing)
)


module.exports = router
