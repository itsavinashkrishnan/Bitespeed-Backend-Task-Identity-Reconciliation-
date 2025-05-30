const express = require('express');
const app = express();
const identifyRouter = require('./routes/identify');
require('dotenv').config();

app.use(express.json());

app.use('/identify', identifyRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
    