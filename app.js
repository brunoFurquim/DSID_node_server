const express = require('express');
const path = require('path');
const mainRoutes = require('./routes/index');

const bp = require('body-parser');

const app = express();
const cors = require('cors');

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')))
app.use(mainRoutes);


app.listen(4000);