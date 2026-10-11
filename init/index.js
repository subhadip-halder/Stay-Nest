const mongoose = require("mongoose")
const initData = require("./data.js")
const Listning = require("../models/listing.js")
const User = require("../models/user.js")

const MONGO_URL = "mongodb://127.0.0.1:27017/staynest"
const OWNER_ID = process.env.OWNER_ID || "6ac20a370d0f2f6ab2a35691"

const initDB = async () => {
    const owner = await User.findById(OWNER_ID).select("_id")
    if (!owner) {
        throw new Error(`Owner user ${OWNER_ID} was not found. Set OWNER_ID to an existing User _id.`)
    }

    const listingsWithOwner = initData.data.map((listing) => ({
        ...listing,
        owner: owner._id,
    }))

    await Listning.deleteMany({})
    await Listning.insertMany(listingsWithOwner)
    console.log(`Initialized ${listingsWithOwner.length} listings with owner ${owner._id}.`)
}

async function main() {
    try {
        await mongoose.connect(MONGO_URL)
        console.log("connected to DB")
        await initDB()
    } catch (err) {
        console.error("Failed to initialize database:", err.message)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

main()
