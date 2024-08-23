const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const dataSource = require('../dataSource');
const User = require('../entities/Donor'); 
const { getRepository } = require('typeorm');
const Project = require('../entities/Project'); 
const {sendEmail} = require('../utils/email');
const crypto = require('crypto');
const {createResetPasswordToken} = require('../services/adminService');


const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin' && user.role !== 'superadmin'){
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



const verifyAdminToken = asyncHandler(async(req,res,next)=>{
    console.log('Headers:', req.headers);
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            return res.status(401).json('Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];
        console.log('Extracted Token:', token);

        if (!token) {
            return res.status(401).json('Access denied. No token provided.');
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
                return res.status(403).json({ message: 'Access denied.' });
            }
    
            req.user = decoded;
            next();
        } catch (ex) {
            res.status(400).json({ message: 'Invalid token.' });
        }

})



const adminForgotPassword = asyncHandler(async(req,res)=>{
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const resetToken = await createResetPasswordToken(email);
        const resetURL = `${req.protocol}://${req.get('host')}/api/adminRoutes/resetPassword/${resetToken}`;
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
})



const adminResetPassword = asyncHandler(async(req,res)=>{
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
            message: 'Password reset successful. Login successful',
            user
        });

    } catch (error) {
        console.error('Error saving:', error);
        return res.status(500).json({ message: 'Error saving', error });
    }
})


const createProject = async (req, res) => {
    const { temple_name, temple_addr, google_map_url, start_date, end_date, person_in_charge, estimated_value, status, contact_details, photos, documents, activity_date, activity_desc } = req.body;

    try {
        const projectRepository = dataSource.getRepository(Project);

        const newProject = projectRepository.create({
            temple_name,
            temple_addr,
            google_map_url,
            start_date,
            end_date,
            person_in_charge,
            estimated_value,
            status,
            contact_details,
            photos,
            documents,
            activity_date,
            activity_desc,
        });

        await projectRepository.save(newProject);

        return res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error('Create project error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const editProject = async (req, res) => {
    const { id } = req.params;
    const { temple_name, temple_addr, google_map_url, start_date, end_date, person_in_charge, estimated_amt, status, contact_details, photos, documents, activity_date, activity_desc } = req.body;

    try {
        const projectRepository = dataSource.getRepository(Project);
        const project = await projectRepository.findOne({ where: { id } });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.temple_name = temple_name || project.temple_name;
        project.temple_addr = temple_addr || project.temple_addr;
        project.google_map_url = google_map_url || project.google_map_url;
        project.start_date = start_date || project.start_date;
        project.end_date = end_date || project.end_date;
        project.person_in_charge = person_in_charge || project.person_in_charge;
        project.estimated_amt = estimated_amt || project.estimated_amt;
        project.status = status || project.status;
        project.contact_details = contact_details || project.contact_details;
        project.photos = photos || project.photos;
        project.documents = documents || project.documents;
        project.activity_date = activity_date || project.activity_date;
        project.activity_desc = activity_desc || project.activity_desc;

        await projectRepository.save(project);

        return res.json({ message: 'Project updated successfully', project });
    } catch (error) {
        console.error('Edit project error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const projectRepository = dataSource.getRepository(Project);
        const result = await projectRepository.delete(id);

        if (result.affected === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        return res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};



module.exports = { adminLogin,verifyAdminToken,adminForgotPassword,adminResetPassword,createProject, editProject, deleteProject};
