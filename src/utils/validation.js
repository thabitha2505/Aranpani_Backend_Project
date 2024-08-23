const bcrypt = require('bcryptjs');

const hashPassword = async(password)=>{
    const pass = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,pass);
    return hashedPassword;
};

module.exports = {hashPassword};