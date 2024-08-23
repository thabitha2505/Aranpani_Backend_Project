const nodemailer = require('nodemailer');
const redis = require('./redisClient');

const OtpConnection = async(options)=>{
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        secure: false,
        logger: true,
        debug: true,
        secureConnection: false,
        auth:{
            user: "5bfab0f18f552c",
            pass: "aec0203b395029"
        },
        tls:{
            rejectUnauthorized: true
        }
    });
    
        const mailOptions = {
            from: '"Temple Renovation" <noreply@temple.com>',
            to: options.email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${options.generateOTP}`
        }; 
    
        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${options.email}`);

            //store otp in redis
            await redis.setex(`otp:${options.email}`,300,options.generateOTP);  //5 mins
            return true;
        } catch (error) {
            console.error('Error sending OTP:', error);
            return false;
        };

    };
    
    const verifyOTP = async(email,otp)=>{
        try{
            const storedOTP = await redis.get(`otp:${email}`);

            if(storedOTP==otp){
                await redis.del(`otp:${email}`);
                return true;
            }else{
                return false;
            }
        }catch(error){
            console.error('Error verifying OTP:', error);
            return false;
        }
    }
    




module.exports = {OtpConnection, verifyOTP};