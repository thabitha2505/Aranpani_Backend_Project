const User = require('../entities/Donor');
const crypto = require('crypto');
const dataSource = require('../dataSource');


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

module.exports = {createResetPasswordToken}; 