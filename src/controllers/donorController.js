const asyncHandler = require('express-async-handler');
const { getProjects, getActiveProjects, changeLanguage,createProfile, signup,verification,createResetPasswordToken,profileUpdation, enablingPayment,findAreaRepresentatives} = require('../services/donorService');
const bcrypt = require('bcryptjs');
require('dotenv').config({path:'.env'});

const jwt = require('jsonwebtoken'); 
const User = require('../entities/Donor');
const crypto = require('crypto');
const dataSource = require('../dataSource');
const {sendEmail} = require('../utils/email');
const { MoreThan } = require('typeorm');
const Project = require('../entities/Project');
const Payment = require('../entities/Payment');
const stripe = require('../config/stripe');


const viewProject = asyncHandler(async (req, res) => {
    try {
        const projects = await getProjects();
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error in retrieving projects:', error);
        res.status(404).json({ error: 'Error in retrieving projects' });
    }
});

const viewActiveProject = asyncHandler(async (req, res) => {
    try {
        const projects = await getActiveProjects();
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error in retrieving Active projects:', error);
        res.status(404).json({ error: 'Error in retrieving Active projects' });
    }
});



const loginDonor = asyncHandler(async (req, res) => {
    const { mobile_no, password } = req.body;
    try {   
        const donorRepository = dataSource.getRepository(User);
        const donor = await donorRepository.findOne({ where: { mobile_no } });
        if (!donor) {
            return res.status(404).json('Invalid credentials');
        }

        console.log(process.env.JWT_SECRET);
        console.log('Password from request:', password);
        console.log('Hashed password from donor:', donor.password);

        const isPasswordValid = await bcrypt.compare(password, donor.password);

        if (!isPasswordValid) {
            return res.status(404).json('Invalid credentials');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        
        const token = jwt.sign(
            { id: donor.id, role: donor.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        const projects = await getActiveProjects();
        return res.status(200).json({
            message: 'Login successful',
            token,
            projects
        });
    } catch (error) {
        console.error('Error in logging:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const authenticateToken = asyncHandler(async(req,res,next)=>{
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
    
        jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
            if(err) return res.sendStatus(403);
            req.user = user;
            console.log('Valid token:', req.user);
            next()
        })
})

const switchChange = asyncHandler(async (req, res) => {
    try {
        const { id, language } = req.body;
        const changed = await changeLanguage(id, language);
        res.status(200).json({
            message: 'Language updated successfully',
            user: changed,
        });
    } catch (error) {
        console.error('Error in updating language:', error);
        res.status(500).json({ error: 'Error in updating language' });
    }
});



const register = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { name, role, address, pinCode, mobile_no, email, password, language } = req.body;

    if (!mobile_no) {
        return res.status(400).json({ error: 'mobile_no is required' });
    }

    const existingSuperAdmin = await userRepository.findOne({ where: { role: 'superadmin' } });

        if (existingSuperAdmin) {
            return res.status(400).json({ message: 'A Super Admin already exists' });
        }

    try {
        const result = await signup(name, role, address, pinCode, mobile_no, email, password, language);
        if (!result.success) {
            return res.status(202).json(result.message);
        }
        res.status(201).json(result.user);
    } catch (error) {
        console.error('Error in SignUp:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const verifyotp = asyncHandler(async(req,res)=>{
    const {email, otp, name, role, address, pinCode, mobile_no, password, language} = req.body;
    try{
        const result = await verification(email, otp, name, role, address, pinCode, mobile_no, password, language);
        if (!result.success) {
            return res.status(202).json(result.message);
        }
        res.status(201).json(result);

    }catch(error){
        console.error('Error in OTP verification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})


const profileCreation = asyncHandler(async (req, res) => {
    const { name, mobile_no, donor_id, father_name, country, state, district, address, pinCode, email } = req.body;
 
    try {
        if (!name) {
            return res.status(400).json({ error: "name is a required field" });
        }
        const result = await createProfile(name, mobile_no, donor_id, father_name, country, state, district, address, pinCode, email);
        if (!result.success) {
            return res.status(400).json({ 
                success: false, 
                message: result.message 
            });
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});



const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        } 
        const resetToken = await createResetPasswordToken(email);
        const resetURL = `${req.protocol}://${req.get('host')}/api/donors/resetPassword/${resetToken}`;
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

        // Fetch active projects
        const projects = await getActiveProjects();

        return res.status(200).json({
            message: 'Password reset successful. Login successful',
            projects
        });

    } catch (error) {
        console.error('Error saving user or fetching projects:', error);
        return res.status(500).json({ message: 'Error saving user or fetching projects', error });
    }
}


const updateProfile = asyncHandler(async(req,res)=>{
    const {donor_id,address,pinCode} = req.body;
    try{
        const updatedProfile = await profileUpdation(donor_id,address,pinCode);
        if(updatedProfile){
            return res.status(200).json({ message:'Updating profile completed:'});
        }
        res.status(200).json(updatedProfile);
    }catch(error){
        console.error('Error in Updating profile:', error);
        return res.status(500).json({ message:'Error in Updating profile:', error });
    }
})

//donor puts 5 projects as favourite
const favouriteProjects = asyncHandler(async(req,res)=>{
    const {projectId} = req.params;  // which prjct they want they will give after viewing all the details of project
    const {userId} = req.body;  //the user give their id as to update DB
    

    try{
        const projectRepository = dataSource.getRepository(Project);
        const userRepository = dataSource.getRepository(User);
        const project = await projectRepository.findOne({ where: {id:projectId },relations: ['favouriteBy'] });
        const user = await userRepository.findOne({ where: {id:userId },relations: ['favourite'] });

        if (!project || !user) {
            return res.status(404).json({ message: 'Project or User not found' });
        }

         // only 5 fav projects can be added
         if (user.favourite.length >= 5) {
            return res.status(400).json({ message:'You can add only up to 5 favorite projects' });
        }

        //check if already this project is set as favourite in User
        if(!project.favouriteBy.find(favourite=>favourite.id==userId)){
            project.favouriteBy.push(user);
            await projectRepository.save(project);
        } 

        res.status(200).json({ message: 'Project favourited successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

//donor subcribe to projects
const subscribeProjects = asyncHandler(async(req,res)=>{
    const {projectId} = req.params;  // which prjct they want they will give after viewing all the details of project
    const {userId} = req.body;  //the user give their id as to update DB
    
    try{
        const projectRepository = dataSource.getRepository(Project);
        const userRepository = dataSource.getRepository(User);
        const project = await projectRepository.findOne({ where: {id:Number(projectId) },relations: ['subscribeBy'] });
        const user = await userRepository.findOne({ where: {id:Number(userId) },relations: ['subscribe'] });

        if (!project || !user) {
            return res.status(404).json({ message: 'Project or User not found' });
        }
        

        // Check if the project is already subscribed by the user
        const alreadySubscribed = project.subscribeBy.some(subscribe => subscribe.id === user.id);
        if (alreadySubscribed) {
            return res.status(400).json({ message: 'User is already subscribed to this project' });
        }

         // Subscribe the user to the project
         project.subscribeBy.push(user);
         await projectRepository.save(project);

        res.status(200).json({ message: 'Project subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})



const unSubscribeProjects = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;

    try {
        const userRepository = dataSource.getRepository(User);
        const projectRepository = dataSource.getRepository(Project);

        // Fetch the user with the subscribe relation
        const user = await userRepository.findOneOrFail({
            where: { id: Number(userId) },
            relations: ['subscribe'],
        });

        // Check if the user is subscribed to the project
        const isSubscribed = user.subscribe.some(p => p.id === Number(projectId));
        if (!isSubscribed) {
            return res.status(400).json({ message: 'User is not subscribed to this project.' });
        }

        // Unsubscribe donor from the project
        user.subscribe = user.subscribe.filter(p => p.id !== Number(projectId));
        await userRepository.save(user);

        // Fetch the project again to update subscribeBy array
        const updatedProject = await projectRepository.findOneOrFail({
            where: { id: Number(projectId) },
            relations: ['subscribeBy'],
        });

        // Remove the user from the project's subscribeBy array
        updatedProject.subscribeBy = updatedProject.subscribeBy.filter(subscriber => subscriber.id !== Number(userId));
        await projectRepository.save(updatedProject);

        res.status(200).json({ message: 'Unsubscribed successfully!' });
    } catch (error) {
        console.error('Error unsubscribing from project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});







const projectsById = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const projectRepository = dataSource.getRepository(Project);
    const project = await projectRepository.findOne({where:{id}});
    try{
       
       
       if(!project){
        return res.status(404).json({ message: 'Project not found' });
       }
       res.status(200).json(project);
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})



const schemeByDonor = asyncHandler(async (req, res) => {
    const { user_id, project_id, scheme, paymentMethod } = req.body;

    try {
        const paymentRepository = dataSource.getRepository(Payment);
        const userRepository = dataSource.getRepository(User);

        const user = await userRepository.findOne({ where: { id: user_id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validSchemes = ['monthly', 'half_yearly', 'annual'];
        if (!validSchemes.includes(scheme)) {
            return res.status(400).json('Select a valid scheme');
        }

        const schemeAmounts = {
            monthly: 100,
            half_yearly: 600,
            annual: 1200
        };

        const amount = schemeAmounts[scheme];

        const existingPayment = await paymentRepository.findOne({ where: { donor_id: user_id, project_id: project_id } });
        if (existingPayment) {
            return res.status(400).json({ message: 'User already selected a scheme for this project' });
        }

        // Save payment details initially as pending
        const newPayment = paymentRepository.create({
            donor_id: user.id,
            scheme: scheme,
            trans_amt: amount,
            trans_status: 'pending',
            project_id: project_id,
            payment_date: new Date(),
            payment_method: paymentMethod,
            stripe_payment_intent_id: null // Set initially to null
        });

        await paymentRepository.save(newPayment);

        return res.status(201).json({
            message: 'Payment scheme selected successfully. Please proceed to enable payment.',
            payment: newPayment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});






const paymentLinkEnable = asyncHandler(async(req,res)=>{
    const { user_id, projectid,paymentAmount} = req.body;

  try {
    const isEnabled = await enablingPayment(user_id,projectid,paymentAmount);
    res.json({ enabled: isEnabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})



const getAreaRepresentatives = asyncHandler(async(req,res)=>{
    try{
        const {user_id} = req.body;
        const {pinCode} = req.query;
        const userRepository = dataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: user_id } });

        if (!user) {
            throw new Error('User not found');
        }

        if (!pinCode) {
            return res.status(400).json({ message: 'Pin code is required.' });
        }
        
        const areaRepresentatives = await findAreaRepresentatives(user_id,pinCode);
        return res.status(200).json(areaRepresentatives);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
})



const presentVideo = asyncHandler(async (req, res) => {
    res.sendFile(path.join(__dirname, '/home/thabitha/Downloads/aerial-view-hindu-temple-prambanan-in-yogyakarta-indonesia-SBV-346743351-preview.mp4', 'welcome-video.mp4'));
});


module.exports = { viewProject,projectsById,unSubscribeProjects, loginDonor, viewActiveProject,profileCreation, presentVideo, switchChange, register, verifyotp, 
    forgotPassword,resetPassword,updateProfile,favouriteProjects,subscribeProjects, schemeByDonor, paymentLinkEnable,getAreaRepresentatives, authenticateToken };
