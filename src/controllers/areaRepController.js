const asyncHandler = require("express-async-handler");
const {req,res} = require('express');
const bcrypt = require('bcryptjs');
const User = require('../entities/Donor');
const AreaRep = require('../entities/AreaRep')
const dataSource = require('../dataSource');
const {hashPassword} = require('../utils/validation');
const {getPaymentsByMonth,getUnpaidPaymentsByMonth,getDonorsByRegNo} = require('../services/areaRepService');



const getPaidUser = asyncHandler(async(req,res)=>{
    
    const {month, year } = req.params;
    console.log(month);
    console.log(year);
    if (!month || !year) {
        return res.status(400).json({ error: "Month and year are required" });
    }
    try {
        const payments = await getPaymentsByMonth(month, year);
        if (payments.length === 0) {
            return res.status(404).json({ message: "No payments found for this month and year" });
        }

        return res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments by month:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})



const getUnpaidUser = asyncHandler(async(req,res)=>{

    const {month, year } = req.params;
    console.log(month);
    console.log(year);
    if (!month || !year) {
        return res.status(400).json({ error: "Month and year are required" });
    }
    try {
        const payments = await getUnpaidPaymentsByMonth(month, year);
        if (payments.length === 0) {
            return res.status(404).json({ message: "No payments found for this month and year" });
        }

        return res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments by month:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})


const getAllDonors = asyncHandler(async(req,res)=>{
    
    try {
        const {reg_no} = req.query;
        console.log(`Received reg_no: ${reg_no}`);
        const donors = await getDonorsByRegNo(reg_no);
        res.json(donors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})




module.exports = {getPaidUser,getUnpaidUser,getAllDonors};