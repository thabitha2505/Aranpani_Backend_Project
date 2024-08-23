const express = require('express');
const path = require('path');
const upload = require('../config/multerConfig');
const { getRepository } = require('typeorm');
const User = require('../entities/Donor'); 
const Profile = require('../entities/Profile'); 
const dataSource = require('../dataSource');

const router = express.Router();
 


router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  console.log('File:', req.file);

  const userId = req.body.userId; 
  console.log(userId);
  const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

  try {
    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(Profile);

    const userExists = await userRepository.findOne({ where: { id: userId } });
    if (!userExists) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await profileRepository.findOne({ where: { donor_id: userId } });
    if (!profile) {
      console.log('Profile not found');
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.profilePicture = profilePictureUrl;
    await profileRepository.save(profile);

    console.log('Profile picture updated successfully');
    res.status(200).json({ message: 'Profile picture updated successfully', profilePictureUrl });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
