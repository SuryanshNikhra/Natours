const { MaxKey, ServerDescription } = require('mongodb');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User= require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true,
      minLength: [10, ' A tour must have at least 10 characters'],
      maxLength: [40, 'A tour name must have less or equal then 40 characters'],
      //validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0'],
      max: [5, ' A rating must be less or equal to 5.0'],
      set: val => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      trim: true,
      required: [true, 'A tour must have difficuty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A tour must have difficuty: easy, medium or hard',
      },
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'The price discount ({VALUE}) cannot be greater the the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    startLocation: {
      //geoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
        duration: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({price:1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// this pre run before create and save function - doceument middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embedding example
// tourSchema.pre('save', async function (next) {
//   const guidesPromises= this.guides.map( async id=> await User.findById(id));
//   this.guides= await Promise.all(guidesPromises);
//   next();
// })

// tourSchema.post('save',function(doc,next){
//   console.log(doc);
//   next();
// })

/// query middleware
// genereal way- tourSchema.pre(/^find/,function(next) ( but not working on findOne, findById)
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

//aggregrate middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
