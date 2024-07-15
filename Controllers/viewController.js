const Tour = require('../Models/tourModel');
const User=require('../Models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res,next) => {
  //1) get tour data
  const tours = await Tour.find();

  //2) build that template

  //3)3) render the template
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res,next) => {
  //1) Get the data, for the requested tour(including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if(!tour){
    return next(new AppError('There is no tour with that name.', 404));  //if tour not found, return error 404 with message
  }

  //2) build template

  //3) render template using step 1 again
  res.status(200).set(
    'Content-Security-Policy',
    "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  ).render('tour', {
    title:`${tour.name} Tour`,
    tour,
  });
});


exports.getLoginForm= (req,res)=>{
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  //console.log('updating the user', req.body);
  const updatedUser=await User.findByIdAndUpdate(req.user.id,{
    name: req.body.name,
    email: req.body.email
  },{
    new:true,
    runValidators:true
  });
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });


})
