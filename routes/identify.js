const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    // 1. Fetch existing contacts that match the email or phone number
    const { rows: existingContacts } = await pool.query(
      `SELECT * FROM contacts 
       WHERE email = $1 OR phoneNumber = $2`,
      [email, phoneNumber]
    );

    let primaryContact = null;
    let allContacts = [];

    if (existingContacts.length === 0) {
      // 2. No match: create a new primary contact
      const result = await pool.query(
        `INSERT INTO contacts (email, phoneNumber, linkPrecedence)
         VALUES ($1, $2, 'primary') RETURNING *`,
        [email, phoneNumber]
      ); 
      primaryContact = result.rows[0];
      allContacts = [primaryContact];
    } else {
      // 3. At least one contact exists
      allContacts = [...existingContacts];

      // Find the earliest primary contact to make it the true primary
      primaryContact = allContacts
        .filter(c => c.linkprecedence === 'primary')
        .sort((a, b) => new Date(a.createdat) - new Date(b.createdat))[0];

      const primaryId = primaryContact.id;

      // Make sure all others link to the true primary
      const updates = [];

      for (const contact of allContacts) {
        if (
          contact.linkprecedence === 'primary' &&
          contact.id !== primaryId
        ) {
          updates.push(
            pool.query(
              `UPDATE contacts SET linkPrecedence = 'secondary', linkedId = $1 WHERE id = $2`,
              [primaryId, contact.id]
            )
          );
        }
      }

      await Promise.all(updates);

      // Check if the current request's data is already present
      const alreadyPresent = existingContacts.some(
        c => c.email === email && c.phoneNumber === phoneNumber
      );

      if (!alreadyPresent) {
        // Create a new secondary contact if the combination is new
        await pool.query(
          `INSERT INTO contacts (email, phoneNumber, linkPrecedence, linkedId)
           VALUES ($1, $2, 'secondary', $3)`,
          [email, phoneNumber, primaryId]
        );

        // Fetch again after insert
        const { rows: updatedContacts } = await pool.query(
          `SELECT * FROM contacts 
           WHERE id = $1 OR linkedId = $1`,
          [primaryId]
        );
        allContacts = updatedContacts;
      }
    }

    // Build response structure
    const primaryId = primaryContact.id;

    const emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
    const phoneNumbers = [...new Set(allContacts.map(c => c.phonenumber).filter(Boolean))];
    const secondaryIds = allContacts
      .filter(c => c.linkprecedence === 'secondary')
      .map(c => c.id);

    res.json({
      contact: {
        primaryContatctId: primaryId,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryIds,
      },
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
