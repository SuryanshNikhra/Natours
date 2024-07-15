const express = require('express');

const userController = require('../Controllers/userController');
const authController = require('../Controllers/authController');
const reviewController = require('../Controllers/reviewController');




const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//all action mention under this will run this middleware first
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);

router.patch('/updateMe', userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);
router.get('/me', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
