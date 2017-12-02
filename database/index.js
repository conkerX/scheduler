const Sequelize = require('sequelize');
const config = require('./config.js');
const Promise = require('bluebird');
require('dotenv').config();

const options = { logging: false };

const sequelize = process.env.DATABASE_URL ?
  new Sequelize(process.env.DATABASE_URL, options) :
  new Sequelize(process.env.DB_NAME || 'shiftly', process.env.DB_USER || 'postgres', process.env.DB_PASS || null, { host: process.env.DB_HOST || 'localhost', dialect: 'postgres', logging: false });


const db = config(sequelize);

db.User.hasMany(db.Session, { as: 'session' });

// One-to-Many Relationships
db.User.hasMany(db.Actual_Schedule, { as: 'actual_schedule' });
db.User.hasMany(db.Employee_Availability, { as: 'employee_availability' });

db.Schedule.hasMany(db.Actual_Schedule, { as: 'actual_schedule' });
db.Schedule.hasMany(db.Needed_Employee, { as: 'needed_employee' });

db.Day_Part.hasMany(db.Employee_Availability, { as: 'employee_availability' });
db.Day_Part.hasMany(db.Actual_Schedule, { as: 'actual_schedule' });
db.Day_Part.hasMany(db.Needed_Employee, { as: 'needed_employee' });

db.sequelize = sequelize;
module.exports = db;
