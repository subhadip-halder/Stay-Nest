const Listing = require("../models/listing")
const mongoose = require("mongoose")
const ExpressError = require("../utils/ExpressError.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const geocodeLocation = async (location, country) => {
    if (!mapToken) {
        throw new ExpressError(503, "Mapbox is not configured. Add a MAP_TOKEN before creating or moving a listing.")
    }

    const response = await geocodingClient.forwardGeocode({
        query: [location, country].filter(Boolean).join(", "),
        limit: 1,
    }).send()

    return response.body.features[0]?.geometry || null
}

module.exports.index = async (req, res) => {
    const searchQuery = String(req.query.q || "").trim().slice(0, 100)
    const filter = {}

    if (searchQuery) {
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const searchRegex = new RegExp(escapedQuery, "i")
        filter.$or = [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex },
        ]
    }

    const allListings = await Listing.find(filter).sort({ _id: -1 }).limit(100).lean()
    res.render("listings/index.ejs", { allListings, searchQuery })
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs")
}

module.exports.showListing = async (req, res) => {
    let {id} = req.params
    if (!mongoose.isValidObjectId(id)) throw new ExpressError(404, "Listing not found.")
    const listing = await Listing.findById(id)
    .populate({path: "reviews", 
        populate: {
            path: "author",
        },
    })
    .populate("owner")
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!!")
        return res.redirect("/listings")
    }
    let mapAvailable = Array.isArray(listing.geometry?.coordinates)
        && listing.geometry.coordinates.length === 2

    // Older listings may predate map coordinates. Geocode and save them once
    // so every listing with a resolvable location gets its own map.
    if (!mapAvailable && process.env.MAP_TOKEN) {
        try {
            const geometry = await geocodeLocation(listing.location, listing.country)
            if (geometry) {
                listing.geometry = geometry
                await listing.save()
                mapAvailable = true
            }
        } catch (error) {
            console.error(`Could not geocode listing ${listing._id}:`, error.message)
        }
    }
    res.render("listings/show.ejs", {
        listing,
        mapAvailable,
        mapToken: process.env.MAP_TOKEN || "",
    })
}

module.exports.createListing = async(req, res) => {
    if (!req.file) {
        throw new ExpressError(400, "Please choose a listing image.")
    }

    const geometry = await geocodeLocation(req.body.listing.location, req.body.listing.country)
    if (!geometry) {
        throw new ExpressError(400, "Could not find that listing location. Please enter a more specific place.")
    }

    let url = req.file.path
    let filename = req.file.filename

    const newListing = new Listing(req.body.listing)
    newListing.owner = req.user._id
    newListing.image = {url, filename}

    newListing.geometry = geometry
    
    let savedListing =  await newListing.save()
    console.log(savedListing)
    req.flash("success", "New Listing Created!")
    res.redirect("/listings")
}

module.exports.renderEditForm = async(req, res) => {
    let {id} = req.params
    if (!mongoose.isValidObjectId(id)) throw new ExpressError(404, "Listing not found.")
    const listing = await Listing.findById(id)
    if(!listing){
        req.flash("error", "Listing you requested for does not exist")
        return res.redirect("/listings")
    }

    let originalImageUrl = listing.image.url
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250")
    res.render("listings/edit.ejs", {listing, originalImageUrl})
}

module.exports.updateListing = async (req, res) => {
    let {id} = req.params
    if (!mongoose.isValidObjectId(id)) throw new ExpressError(404, "Listing not found.")
    let listing = await Listing.findById(id)
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist")
        return res.redirect("/listings")
    }

    const locationChanged = req.body.listing.location !== listing.location
        || req.body.listing.country !== listing.country
    const { title, description, price, location, country } = req.body.listing
    Object.assign(listing, { title, description, price, location, country })
    if (locationChanged) {
        const geometry = await geocodeLocation(req.body.listing.location, req.body.listing.country)
        if (!geometry) {
            throw new ExpressError(400, "Could not find that listing location. Please enter a more specific place.")
        }
        listing.geometry = geometry
    }

    if(typeof req.file != "undefined"){
    let url = req.file.path
    let filename = req.file.filename
    listing.image = {url, filename}
    }
    await listing.save()

    req.flash("success", "Listing Updated!")
    res.redirect("/listings")
}

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params
    if (!mongoose.isValidObjectId(id)) throw new ExpressError(404, "Listing not found.")
    let deletedListings = await Listing.findByIdAndDelete(id)
    console.log(deletedListings);
    req.flash("success", "Listing Deleted!")
    res.redirect("/listings")
}
