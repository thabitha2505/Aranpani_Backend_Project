const User = require('../entities/Donor');
const Payment = require('../entities/Payment');
const AreaRep = require('../entities/AreaRep');
const hashPassword = require('../utils/validation');
const dataSource = require('../dataSource');
const {getRepository} = require('typeorm');

const getPaymentsByMonth = async (month, year) => {
    const paymentRepository = dataSource.getRepository(Payment);
    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
        throw new Error("Invalid month or year provided");
    }

    const startDate = new Date(yearInt, monthInt - 1, 1); // start of the month
    const endDate = new Date(yearInt, monthInt, 0); // end of the month

    console.log("Start Date:", startDate.toISOString());
    console.log("End Date:", endDate.toISOString());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date provided");
    }

    // Find payments within the specified month and year using QueryBuilder
    const payments = await paymentRepository.createQueryBuilder('payment')
        .where('payment.payment_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
        .andWhere('payment.payment_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
        .andWhere('payment.trans_status = :status', { status: 'completed' })
        .getMany();

    // Map payments to desired format
    return payments.map(payment => ({
        donorId: payment.donor_id,
        transAmt: payment.paid_amt,
        paymentDate: payment.payment_date,
        projectId: payment.project_id,
    }));
};


const getUnpaidPaymentsByMonth = async (month, year) => {
    const paymentRepository = dataSource.getRepository(Payment);

    // Convert month and year to integers
    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    // Validate month and year
    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
        throw new Error("Invalid month or year provided");
    }

    // Create start and end dates
    const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the month
    const endDate = new Date(yearInt, monthInt, 0); // End of the month

    // Log dates for debugging
    console.log("Start Date:", startDate.toISOString());
    console.log("End Date:", endDate.toISOString());

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date provided");
    }

    // Find unpaid payments within the specified month and year using QueryBuilder
    const unpaidPayments = await paymentRepository.createQueryBuilder('payment')
        .where('payment.payment_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
        .andWhere('payment.payment_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
        .andWhere('payment.trans_status != :status', { status: 'completed' }) // Find unpaid payments
        .getMany();

    // Map unpaid payments to desired format
    return unpaidPayments.map(payment => ({
        donorId: payment.donor_id,
        transAmt: payment.paid_amt,
        paymentDate: payment.payment_date,
        projectId: payment.project_id,
    }));
};


const getDonorsByRegNo = async(reg_no)=>{
    console.log(`Fetching donors for reg_no: ${reg_no}`);
    const areaRepRepository = dataSource.getRepository(AreaRep);
    
    // Validate reg_no
    const areaRep = await areaRepRepository.findOne({ 
        where: {reg_no}, 
        relations: ['donor']
    });
    console.log(areaRep);
    if (!areaRep) {
        throw new Error("Area Representative not found.");
    }

    // Assuming you have a relationship between AreaRep and User
    const userRepository = dataSource.getRepository(User);
    const donor = await userRepository.findOne({ where: { id: areaRep.donor_id } });

    if (!donor) {
        throw new Error("Donor not found.");
    }

    return {
        areaRep,
        donor
    };
}


module.exports = {getPaymentsByMonth, getUnpaidPaymentsByMonth,getDonorsByRegNo};