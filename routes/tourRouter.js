const express = require('express');
const tourController = require('../Controllers/tourController');
const authController = require('../Controllers/authController');
const reviewController = require('../Controllers/reviewController');
const reviewRouter = require('./reviewRouter');

const router = express.Router();

//router.param('id',tourController.callId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router.route('/').get(tourController.getAllTours).post(
  /*tourController.checkBody,*/
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.createTour
);

router
  .route('/:id')
  .get(tourController.getTourbyId)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//POST /tour/263636(id)/reviews
//GET  /tour/263636(id)/reviews
//GET /tour/263636(id)/reviews/2636(REVIEW_ID)

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
