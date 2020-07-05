const express = require('express');
const path = require('path');
const mainRoutes = require('./routes/index');

const bp = require('body-parser');

const app = express();
const cors = require('cors');

const sqlite3 = require('sqlite3').verbose();

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')))
app.use(mainRoutes);


app.listen(process.env.PORT || 5000)
//app.listen(5000)