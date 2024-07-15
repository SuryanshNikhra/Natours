const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const appError = require('./utils/appError');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const globalErrorHandler = require('./Controllers/errorController');
const rateLimit = require('express-rate-Limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const viewRouter = require('./routes/viewRouter');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) Global Middleware
//serving static files
app.use(express.static(`${__dirname}/public`));

//set security HTTP headers
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.2/axios.min.js', // Add this line
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'ws://localhost:1234/',
  'ws://localhost:8000/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);
//app.use(helmet.ContentSecurityPolicy());
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.20.0/axios.min.js'],
//       objectSrc: ["'none'"],
//       styleSrc: ["'self'", 'https:', 'unsafe-inline'],
//       upgradeInsecureRequests: [],
//     },
//   })
// );
// const CSP = 'Content-Security-Policy';
// const POLICY =
//   "default-src 'self' https://*.mapbox.com ;" +
//   "base-uri 'self';block-all-mixed-content;" +
//   "font-src 'self' https: data:;" +
//   "frame-ancestors 'self';" +
//   "img-src http://localhost:8000 'self' blob: data:;" +
//   "object-src 'none';" +
//   "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
//   "script-src-attr 'none';" +
//   "style-src 'self' https: 'unsafe-inline';" +
//   'upgrade-insecure-requests;';

// const router = express.Router();

// router.use((req, res, next) => {
//   res.setHeader(CSP, POLICY);
//   next();
// });

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same ip address
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// body parser, reading body data into req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// test middlewares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: "Hello from the server side", app: 'suryansh' });
// });
// app.post('/', (req, res) => {
//     res.send("you can send this to endpoint......");
// })

//app.get('/api/v1/tours',getAllTours);
// app.get('/api/v1/tours/:id', getTourbyId);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
//app.post('/api/v1/tours',createTour);

// 2) routes

//allow map box

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status:'fail',
  //   message:`Can't find ${req.originalUrl} on this server!`
  // });
  // next();

  //  const err=new Error(`Can't find ${req.originalUrl} on this server!`);
  //  err.statusCode=404;
  //  err.status='fail';
  //  next(err);

  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
