const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../entities/Donor');
const {viewProject,projectsById,loginDonor,switchChange,viewActiveProject,register,forgotPassword,paymentLinkEnable,verifyotp,resetPassword,subscribeProjects,unSubscribeProjects,schemeByDonor,
  favouriteProjects,profileCreation,updateProfile,presentVideo,getAreaRepresentatives, authenticateToken} = require("../controllers/donorController");


 
router.route('/projects').get(viewProject);
router.route('/projects/:id').get(asyncHandler(projectsById));

// Serve video file
router.route('/welcome-video').get(presentVideo);

//login
router.route('/projects/active').post(loginDonor).get(viewActiveProject);
//middleware
router.get('/verify_token', authenticateToken, (req, res) => {
  res.status(200).json({
      message: 'You have access to this protected route',
      user: req.user // send user info in response
  });
});
 
  
router.route('/switchLanguage').post(switchChange);
 
router.route('/signup').post(register);
router.route('/verifyotp').post(verifyotp);


router.route('/createProfile').post(profileCreation);

router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').put(asyncHandler(resetPassword));

router.route('/updateProfile').post(updateProfile);

router.route('/:projectId/favourite').post(favouriteProjects);
router.route('/:projectId/subscribe').post(subscribeProjects);
router.route('/:projectId/unSubscribe').post(unSubscribeProjects);

//payment scheme
router.route('/donorPaymentScheme').post(schemeByDonor);

router.route('/paymentLinkEnable').post(paymentLinkEnable);
 
//area-rep
router.route("/area-representatives").get(getAreaRepresentatives);




module.exports = router; 