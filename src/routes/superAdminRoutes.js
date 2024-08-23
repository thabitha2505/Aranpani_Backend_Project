const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const {loginSuperAdmin,createAdmin,editAdmin,deleteAdmin,forgotPassword,resetPassword} = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');


router.route('/SuperAdmin/login').post(loginSuperAdmin);

//admin creation
router.route('/admins')
  .post(authMiddleware.protect,authMiddleware.restrict('superadmin'),asyncHandler(createAdmin));
//authorization
router.route('/:id')
  .patch(authMiddleware.protect, authMiddleware.restrict('superadmin'),asyncHandler(editAdmin)) // Authentication only
  .delete(authMiddleware.protect, authMiddleware.restrict('superadmin'), asyncHandler(deleteAdmin)); // Authentication and Admin authorization


router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').put(asyncHandler(resetPassword));


module.exports = router;