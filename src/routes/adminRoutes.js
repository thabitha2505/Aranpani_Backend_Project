const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../entities/Donor');
const { adminLogin,verifyAdminToken,adminForgotPassword,adminResetPassword ,createProject, deleteProject, editProject} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');


router.route('/admin/login').post(adminLogin);
//middleware
router.get('/verifyadminToken',verifyAdminToken , (req, res) => {
    res.status(200).json({
        message: 'You have access to this protected route',
        user: req.user // send user info in response
    });
  });

router.route('/forgotPassword').post(adminForgotPassword);
router.route('/resetPassword/:token').put(asyncHandler(adminResetPassword));


//project operations
router.route('/projects')
  .post(authMiddleware.protect,authMiddleware.restrict('admin'),asyncHandler(createProject))
//Authorization
router.route('/:id')
  .patch(authMiddleware.protect, authMiddleware.restrict('admin'),asyncHandler(editProject)) // Authentication only
  .delete(authMiddleware.protect, authMiddleware.restrict('admin'), asyncHandler(deleteProject)); // Authentication and Admin authorization

module.exports = router;