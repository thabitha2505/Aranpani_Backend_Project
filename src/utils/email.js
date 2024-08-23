const nodemailer = require('nodemailer');
require('dotenv').config();

//MAILTRAP API

//options is for where gng to send email and from email
const sendEmail = async(options)=>{
    //create a transporter - service for sending email (nodejs will not send email,the TRANSPORTER WILL BE RESPONSIBLE FOR THIS EG:GMAIL)
    const transporter = nodemailer.createTransport({
        //service: "gmail",
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

    //define options for email gng to send
    const emailOptions = {
        from: 'aranpani support<support@aranpani.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    //it is a asynchronous function so it is gng to return a promise and we wait to resolve 
    await transporter.sendMail(emailOptions);
}





module.exports = {sendEmail};