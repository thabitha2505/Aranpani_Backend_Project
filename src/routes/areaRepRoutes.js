const express = require("express");
const router = express.Router();
const {getPaidUser,getUnpaidUser,getAllDonors} = require('../controllers/areaRepController')



router.route('/selectMonthForPaid/:month/:year').get(getPaidUser);
router.route('/selectMonthForunpaid/:month/:year').get(getUnpaidUser);

router.route('/getAllDonors').get(getAllDonors);



module.exports = router;

