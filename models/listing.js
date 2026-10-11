const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Review = require("./review.js")
const { required } = require("joi")
const defaultImageUrl = "https://images.unsplash.com/photo-1764365086660-08014a147837?q=80&w=2491&auto=format&fit=crop"

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ], 
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
//   category: {
//     type: String,
//     enum: ["mountains", "arctic", "farms", "deserts"]
//   }
})

listingSchema.post("findOneAndDelete", async (listning) => {
    if(listning){
        await Review.deleteMany({ _id: { $in: listning.reviews}})
    }
})

const listning = mongoose.model("Listning", listingSchema)
module.exports = listning
