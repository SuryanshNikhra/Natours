const User = require('../Models/userModel');
const { promisify } = require('util');
const AsyncHandler = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET_MESSAGE, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = AsyncHandler(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url=`${req.protocol}://${req.get('host')}/me`;
  //console.log(url);

  await new Email(newUser,url).sendWelcome();
  createSendToken(newUser, 201, res);
  // const token= signToken(newUser._id);

  // res.status(201).json({
  //     message:' Successful',
  //     token,
  //     data:{
  //         newUser
  //     }
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // check if email and password is passed or not
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user is presnt or not && password is correct or not
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  //pass the token
  createSendToken(user, 200, res);
  // const token=signToken(user._id);
  // res.status(200).json({
  //     message:'Successful',
  //     token,

  // })
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Getting token and check of it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    //console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_MESSAGE
  );

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) Check if the user has changed the passowrd
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User has recently changed their password. Please log in again.',
        401
      )
    );
  }

  // grant access the user
  req.user = freshUser;
  res.locals.user = freshUser;
  //console.log('passing to next....');
  next();
});

// only for render pages no errors
exports.isLoggedIn = async (req, res, next) => {
  let token;

  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_MESSAGE
      );

      // 3) Check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      //4) Check if the user has changed the passowrd
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // there is logged in user
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)send the reset token on email
 

  
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        'There was an error sending email. Please try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) if token is valid, set the new password
  if (!user) {
    return next(new AppError('Invalid token or token expired.', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) log the user in
  createSendToken(userser, 200, res);
  //    const token=signToken(user._id);
  //    res.status(200).json({
  //        message:'Successful',
  //        token,

  //    })
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from the collection
  console.log('heyyyyy');

  const freshUser = await User.findById(req.user.id).select('+password');
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  
  //console.log(freshUser);
  //2) check if posted current password is correct
  if (
    !(await freshUser.correctPassword(
      req.body.currentPassword,
      freshUser.password
    ))
  ) {
    return next(new AppError('The current password is wrong', 401));
  }

  //3) if so update the password
  
  freshUser.password = req.body.passwordNew;
  freshUser.passwordConfirm = req.body.passwordConfirmNew;
  await freshUser.save();

  //4) log user in, send JWT
  createSendToken(freshUser, 200, res);
  // console.log("hii123");
  //  let token=signToken(freshUser._id);
  // res.status(200).json({
  //     message:'Successful',
  //     token,

  // })
});
