const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('./../../Models/tourModel');
const User = require('./../../Models/userModel');
const Review = require('./../../Models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successful!');
  });

const tourdata = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);
const userdata = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);
const reviewdata = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Tour.create(tourdata);
    await User.create(userdata, {validateBeforeSave:false});
    await Review.create(reviewdata);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// console.log(process.argv);
// process.exit();
