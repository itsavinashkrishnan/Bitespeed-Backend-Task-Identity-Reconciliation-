# Bitespeed-Backend-Task-Identity-Reconciliation

#Contact management API

## Features
  - Create and link contact records based on incoming `email` or `phoneNumber`
  - Deduplicate contacts intelligently using `linkPrecedence` logic
  - Ensures only one **primary contact** per group of related entries
  - Automatically links new entries as **secondary** if overlap is detected
  - Efficient querying and conflict resolution using PostgreSQL

##Techstack used:
  - Node.js
  - Express.js
  - PostgreSQL

##  Project Structure
  => DB.js #PostgreSQL connection pool
  => routes/
      => identify.js #Main contact creation and linking logic 
  => Index.js #Entry point to initialize Express app
  => Package.json

##  Setup Instructions

### 1. Clone the Repository

git clone https://github.com/itsavinashkrishnan/Bitespeed-Backend-Task-Identity-Reconciliation-.git

cd Bitespeed-Backend-Task-Identity-Reconciliation-

### 2. Install Dependencies

npm install

### 3. Configure Database

Ensure you have a PostgreSQL database running. Create a table using the following schema:

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phoneNumber VARCHAR,
  email VARCHAR,
  linkedId INTEGER,
  linkPrecedence VARCHAR CHECK (linkPrecedence IN ('primary', 'secondary')) DEFAULT 'primary',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### 4. Configure DB Connection

Edit the db.js file with your PostgreSQL connection settings:

const { Pool } = require('pg');

const pool = new Pool({
  user: 'yourusername',
  host: 'yourdbhost',
  database: 'yourdbname',
  password: 'yourpassword',
  port: 5432,
  ssl: true, // set to false if not using SSL
});

module.exports = pool;

### 5. Run the Server
  node index.js

  | Test Case          | Input                                          | Description                                  | Expected Result                       |
| ------------------ | ---------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| ✅ New contact      | Email and phone both new                       | Creates a new **primary** contact            | Returns new contact ID                |
| 🔁 Existing email  | Email exists, phone is new                     | Links as **secondary** to existing contact   | Returns existing primary ID           |
| 🔁 Existing phone  | Phone exists, email is new                     | Links as **secondary** to existing contact   | Returns existing primary ID           |
| 🔁 Both exist      | Both match different contacts                  | Links all under earliest **primary** contact | Merges records and updates precedence |
| 🧪 Duplicate entry | Both email and phone match an existing contact | No change made                               | Returns existing data                 |


### Code Style & Quality  
  - Follows async/await pattern
  - Uses parameterized queries to prevent SQL injection
  - Clear separation of concerns between routing and DB logic


  
