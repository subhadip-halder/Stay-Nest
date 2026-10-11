const Listing = require("../models/listing")
const Review = require("../models/review")
const ExpressError = require("../utils/ExpressError")
const mongoose = require("mongoose")

module.exports.createReview = async(req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ExpressError(404, "Listing not found.")
    let listing = await Listing.findById(req.params.id)
    if (!listing) {
        throw new ExpressError(404, "The listing you are reviewing could not be found.")
    }
    let newReview = new Review(req.body.review)
    newReview.author = req.user._id
    listing.reviews.push(newReview)

    await newReview.save()
    await listing.save()

    // console.log("new review saved");
    // res.send("new review send")
    req.flash("success", "New Review Created!")
    res.redirect(`/listings/${listing._id}`)
}

module.exports.destroyReview = async(req, res) => {
    let {id, reviewId} = req.params
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reviewId)) throw new ExpressError(404, "Review not found.")

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId)

    req.flash("success", "Review Deleted!")
    res.redirect(`/listings/${id}`)
}
