const { Between } = require('typeorm');
const User = require('../entities/Donor');
const Project = require('../entities/Project');
const Profile = require('../entities/Profile');
const Payment = require('../entities/Payment');
const AreaRep = require('../entities/AreaRep');
const { hashPassword } = require('../utils/validation');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dataSource = require('../dataSource');
const axios = require('axios');
const stripe = require('../config/stripe');

//payment enable
const moment = require('moment');


const {OtpConnection, verifyOTP} = require('../utils/otp')

const getProjects = async () => {
    const projectRepository = dataSource.getRepository(Project);
    try {
        
        return await projectRepository.find();
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Error retrieving projects');
    }
    
};

const getActiveProjects = async () => {
    try {
        const projectRepository = dataSource.getRepository(Project);
        return await projectRepository.find({ where: { status: 'active' } });
    } catch (error) {
        console.error('Error fetching active projects:', error);
        throw new Error('Error retrieving active projects');
    }
};

const changeLanguage = async (id, language) => {
    try {
        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        user.language = language;
        await userRepository.save(user);
        return user;
    } catch (error) {
        console.error('Error in updating language:', error);
        throw new Error('Error in updating language');
    }
};

const signup = async (name, role, address, pinCode, mobile_no, email, password, language) => {
    console.log('Input Parameters:', { name, role, address, pinCode, mobile_no, email, password, language });
    
    if (!mobile_no) {
        throw new Error('mobile_no is undefined');
    }

    try {
        const userRepository = dataSource.getRepository(User);
        const check = await userRepository.findOne({ where: {mobile_no: mobile_no.trim()} });
        console.log(`Result of findOne: ${JSON.stringify(check, null, 2)}`);

        if (check) {
            return { 
                success: false, 
                message: 'User already exists' 
            };
        }
        //do OTP generate and verify
        const generateOTP = Math.floor(100000 + Math.random() * 900000).toString();
        await OtpConnection({
            email,
            generateOTP
    });
    return{
        success: true,
        message: 'OTP sent to email'
    };

    } catch (error) {
        console.error('Error in SignUp:', error);
        throw new Error('Error in SignUp');
    }
};



const verification = async (email, otp, name, role, address, pinCode, mobile_no, password, language) => {
    try {
        const userRepository = dataSource.getRepository(User);

        // Verify OTP
        const verified = await verifyOTP(email, otp);
        if (!verified) {
            return {
                success: false,
                message: 'OTP not verified. Try again'
            };
        }

        // Check if user already exists
        const foundUser = await userRepository.findOne({ where: { email } });
        if (foundUser) {
            return { 
                success: false, 
                message: 'User already exists' 
            };
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const newUser = userRepository.create({
            name,
            role,
            address,
            pinCode,
            mobile_no,
            email,
            password: hashedPassword,
            language,
            created_at: new Date(),
            updated_at: new Date(),
        });
        await userRepository.save(newUser);
        return { 
            success: true, 
            user: newUser
        };
    } catch (error) {
        console.error('Error in verification:', error);
        throw new Error('Error in verification');
    }
};
    



const createProfile = async (name, mobile_no, donor_id, father_name, country, state, district, address, pinCode, email) => {
    try {
        const profileRepository = dataSource.getRepository(Profile);

        // Check if the donor exists
        const userRepository = dataSource.getRepository(User);
        const donor = await userRepository.findOne({ where: { id: donor_id, role: 'donor' } });

        if (!donor) {
            return { 
                success: false, 
                message: 'Donor not found or invalid role' 
            };
        }

        // Fetch city and district based on the pin code if district is not provided
        if (!district || !state || !country){
            const response = await axios.get(`https://api.postalpincode.in/pincode/${pinCode}`);
            const locationData = response.data[0];
            
            console.log(locationData);

            if (locationData.Status !== "Success") {
                return { 
                    success: false, 
                    message: 'Invalid pin code' 
                };
            }
            console.log(locationData.PostOffice[0]);
            state = locationData.PostOffice[0].State;
            country = locationData.PostOffice[0].Country;
            district = locationData.PostOffice[0].District;
            
        }

        // Create profile
        const newProfile = profileRepository.create({
            name,
            mobile_no,
            donor_id,
            father_name,
            country,
            state,
            district,
            address,
            pinCode,
            email,
            created_at: new Date(),
            updated_at: new Date(),
        });
        await profileRepository.save(newProfile);

        return { 
            success: true, 
            profile: newProfile 
        };
    } catch (error) {
        console.error('Error in creating profile:', error);
        throw new Error('Error in creating profile');
    }
};




const createResetPasswordToken = async (email) => {
    try {
        if (!email) {
            throw new Error('Email is required');
        }

        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // token valid for 10 minutes
        await userRepository.save(user);
        return resetToken;
    } catch (error) {
        console.error('Error in createResetPasswordToken:', error);
        throw new Error('Error in creating reset password token');
    }
};


const profileUpdation = async(donor_id,address,pinCode)=>{
    const profileRepository = dataSource.getRepository(Profile);
    try{
        const findDonor = await profileRepository.findOne({where:{donor_id}})
        if(!findDonor){
            res.status(404).json('Donor not found');
        }
        findDonor.address = address;
        findDonor.pinCode = pinCode;

            const response = await axios.get(`https://api.postalpincode.in/pincode/${pinCode}`);
            const locationData = response.data[0];
            console.log(locationData);

            if (locationData.Status !== "Success") {
                return { 
                    success: false, 
                    message: 'Invalid pin code' 
                };
            }
            console.log(locationData.PostOffice[0]);
            state = locationData.PostOffice[0].State;
            country = locationData.PostOffice[0].Country;
            district = locationData.PostOffice[0].District;

        findDonor.state = state;
        findDonor.country = country;
        findDonor.district = district;

        await profileRepository.save(findDonor);
        return findDonor;
        
    }catch(error){
        console.error('Error in Updating profile:', error);
        throw new Error('Error in Updating profile');
    }
}


const enablingPayment = async (user_id, projectid, paymentAmount) => {
    try {
        const paymentRepository = dataSource.getRepository(Payment);
        const userRepository = dataSource.getRepository(User);

        const user = await userRepository.findOne({ where: { id: user_id } });
        if (!user) {
            throw new Error('User not found');
        }

        const payment = await paymentRepository.findOne({
            where: { donor_id: user_id, project_id: projectid, trans_status: 'pending' },
            order: { payment_date: 'DESC' },
        });

        if (!payment) {
            return false;
        }

        const currentDate = moment();
        const paymentStartDate = moment(payment.payment_date).startOf('month').date(1);
        const paymentEndDate = paymentStartDate.clone().date(10);

        if (!currentDate.isBetween(paymentStartDate, paymentEndDate, 'days', '[]')) {
            return false;
        }

        if (parseFloat(payment.trans_amt) < paymentAmount) {
            console.log(`Payment amount ${paymentAmount} exceeds the limit ${payment.trans_amt}`);
            return false;
        }

        // Create and confirm the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: paymentAmount * 100, // Amount in cents
            currency: 'inr',
            payment_method: 'pm_card_visa',
            confirm: true, // This will immediately confirm the payment
            payment_method_types: ['card'],
            metadata: { user_id: user.id, project_id: projectid, scheme: payment.scheme }
        });

        if (paymentIntent.status !== 'succeeded') {
            console.log('Unsuccessful payment');
            return false;
        }

        // Mark payment as completed and save it
        payment.trans_status = 'completed';
        payment.project_id = projectid;
        payment.paid_amt = paymentAmount;
        payment.payment_link_enabled = true;
        payment.stripe_payment_intent_id = paymentIntent.id;

        await paymentRepository.save(payment);

        return true;
    } catch (error) {
        console.error('Error in payment enabling:', error);
        if (payment) {
            payment.trans_status = 'failed';
            await paymentRepository.save(payment);
        }
        throw new Error('Error in payment enabling');
    }
};



const findAreaRepresentatives = async(user_id,pinCode)=>{
    try{
        const areaRepresentativeRepository = dataSource.getRepository(AreaRep);
        const userRepository = dataSource.getRepository(User);

        const areaRepresentatives = await areaRepresentativeRepository.find({
        where: { pinCode },
        take: 3,
        order: {id:'ASC'}
    });


    if (areaRepresentatives.length === 0) {
        throw new Error('No area representatives found for the provided pin code.');
    }

    console.log(areaRepresentatives);

    for (let rep of areaRepresentatives) {
        rep.donor_id = user_id;
        await areaRepresentativeRepository.save(rep);
        console.log(rep);
    }
    console.log('Updated area representatives with donor_id:', user_id);

    

    return areaRepresentatives;

    }catch(error){
        throw new Error('Error in selecting Area Representative');
    }

}




module.exports = { getProjects, getActiveProjects, changeLanguage,createProfile, verification,signup,createResetPasswordToken, profileUpdation, enablingPayment, findAreaRepresentatives};
