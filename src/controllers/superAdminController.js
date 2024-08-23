const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const dataSource = require('../dataSource');
const User = require('../entities/Donor'); 
const {createResetPasswordToken} = require('../services/superAdminService');
const {sendEmail} = require('../utils/email');
const { getRepository } = require('typeorm');
const crypto = require('crypto');


const loginSuperAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'superadmin'){
            return res.status(403).json({ message: 'Access denied' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET, 
            {expiresIn: '1h',}
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};



// Create a new Admin
const createAdmin = async (req, res) => {
    const { name, role, address, pinCode, mobile_no, email, password, language } = req.body;

    try {
        const userRepository = dataSource.getRepository(User);

        const newAdmin = userRepository.create({
            name,
            role: 'admin',
            address,
            pinCode,
            mobile_no,
            email,
            password,
            language            
        });

        await userRepository.save(newAdmin);

        res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });
    } catch (error) {
        console.error('Create Admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Edit an existing Admin
const editAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, role, address, pinCode, mobile_no, email, password, language } = req.body;

    try {
        const userRepository = dataSource.getRepository(User);
        const admin = await userRepository.findOne({ where: { id, role: 'admin' } });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.name = name || admin.name;
        admin.role = role || admin.role;
        admin.address = address || admin.address;
        admin.pinCode = pinCode || admin.pinCode;
        admin.mobile_no = mobile_no || admin.mobile_no;
        admin.email = email || admin.email;
        admin.password = password || admin.password;
        admin.language = language || admin.language;

        await userRepository.save(admin);

        res.status(200).json({ message: 'Admin updated successfully', admin });
    } catch (error) {
        console.error('Edit Admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove an Admin
const deleteAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const userRepository = dataSource.getRepository(User);
        const admin = await userRepository.findOne({ where: { id, role: 'admin' } });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await userRepository.remove(admin);

        res.status(200).json({ message: 'Admin removed successfully' });
    } catch (error) {
        console.error('Remove Admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const resetToken = await createResetPasswordToken(email);
        const resetURL = `${req.protocol}://${req.get('host')}/api/superAdminRoutes/resetPassword/${resetToken}`;
        const message = `We received a password reset request. Please use the link below to reset your password\n\n${resetURL}\n\nThis reset password link will be valid for 10 minutes`;
    
        try {
            await sendEmail({
                email,
                subject: 'Password change request received',
                message: message
            });
            return res.status(200).json({
                status: 'success',
                message: 'Password reset link sent to the user email'
            });
        } catch (error) {
            console.error('Error in sending email:', error);
            return res.status(500).json({ error: 'There was an error sending the password reset email. Please try again later.' });
        }
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


//token vechu user id retrieve pananum
//DB la token encrypt agi than store airuku so
//URL la irukura TOKEN encrypt pani compare with DB and retreive USER
//also check expires value is still valid (> current date and time) or not

async function resetPassword(req, res) {
    console.log('Reset password request received');
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log(token);
    console.log(password);
    console.log(confirmPassword);

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Encrypt the token
    const encryptedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Encrypted token:', encryptedToken);

    const userRepository = dataSource.getRepository(User);

    try {
        const user = await userRepository.findOne({
            where: {
                passwordResetToken: encryptedToken,
                //passwordResetTokenExpires: MoreThan(new Date())
            }
        });
        console.log('User found:', user);

        if (!user) {
            console.log('User not found with this token');
            return res.status(404).json({ message: 'User not found with this token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;

        await userRepository.save(user);
        console.log('Password updated successfully');

        return res.status(200).json({
            message: 'Password reset successful. Login successful'
        });

    } catch (error) {
        console.error('Error saving user or fetching projects:', error);
        return res.status(500).json({ message: 'Error saving user or fetching projects', error });
    }
}




module.exports = {loginSuperAdmin,createAdmin,editAdmin,deleteAdmin,forgotPassword,resetPassword};