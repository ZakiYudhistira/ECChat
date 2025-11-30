const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// GET /contacts - Get all contacts for a user
router.get('/:username', verifyToken, async function(req, res, next) {
  try {
    const { username } = req.params;
    
    // Find the user's contact list
    const userContacts = await Contact.findOne({ username });
    
    if (!userContacts) {
      return res.json({
        success: true,
        contacts: [],
        message: 'No contacts found'
      });
    }
    
    // Get user details for each contact
    const contactsWithDetails = await Promise.all(
      userContacts.contactList.map(async (contact) => {
        const contactUser = await User.findOne({ username: contact.username }).select('username');
        return {
          username: contact.username,
          addedAt: contact.addedAt,
          exists: !!contactUser
        };
      })
    );
    
    res.json({
      success: true,
      contacts: contactsWithDetails,
      totalContacts: contactsWithDetails.length
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts',
      error: error.message
    });
  }
});

// POST /addcontact - Add a new contact
router.post('/add', verifyToken, async function(req, res, next) {
  try {
    const { username, contactUsername } = req.body;
    
    // Verify the username matches the authenticated user
    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot add contacts for other users'
      });
    }
    
    // Validate input
    if (!username || !contactUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username and contact username are required'
      });
    }
    
    // Check if trying to add themselves
    if (username === contactUsername) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a contact'
      });
    }
    
    // Check if contact user exists
    const contactUser = await User.findOne({ username: contactUsername });
    if (!contactUser) {
      return res.status(404).json({
        success: false,
        message: 'Contact user not found'
      });
    }
    
    // Find user's contact list
    let userContacts = await Contact.findOne({ username });
    
    // If no contact list exists, create one
    if (!userContacts) {
      userContacts = await Contact.create({
        username,
        contactList: []
      });
    }
    
    // Check if contact already exists
    const existingContact = userContacts.contactList.find(
      contact => contact.username === contactUsername
    );
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact already exists'
      });
    }
    
    // Add new contact
    await Contact.updateOne(
      { username },
      { 
        $push: { 
          contactList: { 
            username: contactUsername 
          } 
        } 
      }
    );
    
    console.log(`Contact added: ${username} added ${contactUsername}`);
    
    res.json({
      success: true,
      message: 'Contact added successfully',
      contact: {
        username: contactUsername,
        addedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add contact',
      error: error.message
    });
  }
});

// DELETE /removecontact - Remove a contact
router.delete('/remove', verifyToken, async function(req, res, next) {
  try {
    const { username, contactUsername } = req.body;
    
    // Verify the username matches the authenticated user
    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Cannot remove contacts for other users'
      });
    }
    
    // Validate input
    if (!username || !contactUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username and contact username are required'
      });
    }
    
    // Remove contact from list
    const result = await Contact.updateOne(
      { username },
      { 
        $pull: { 
          contactList: { username: contactUsername } 
        } 
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found or already removed'
      });
    }
    
    console.log(`Contact removed: ${username} removed ${contactUsername}`);
    
    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
    
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove contact',
      error: error.message
    });
  }
});

module.exports = router;
