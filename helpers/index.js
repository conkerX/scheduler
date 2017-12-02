const moment = require('moment');
const db = require('../database');
const Promise = require('bluebird');
const crypto = require('crypto');

const getAllUsers = (req, res, next) => {
  db.User.findAll({})
    .then((allUsers) => {
      req.users = allUsers;
      next();
    }).catch((err) => {
      res.status(500).send('Error getting users');
    });
};

const getUser = (req, res, next) => {
  db.User.findAll({
    where: {
      name: req.session.user,
    },
  }).then((user) => {
    req.user = user[0].dataValues;
    next();
  }).catch((err) => {
    res.status(500).send('Erro getting user');
  });
};

const updateProfile = (req, res, next) => {
  console.log(req.body.data);
  db.User.update(req.body.data, {
    where: {
      name: req.body.data.name,
    },
  }).then((user) => {
    next();
  }).catch((err) => {
    res.status(500).send('Error updating user');
  })
}

const getAllScheduleDates = (req, res, next) => {
  db.Schedule.findAll({})
    .then((allScheduleDates) => {
      req.scheduleDates = allScheduleDates;
      next();
    }).catch((err) => {
      res.status(500).send('Error getting users');
    });
};

const getAllNeededEmployees = (req, res, next) => {
  db.Needed_Employee.findAll({})
    .then((allNeededEmployees) => {
      req.neededEmployees = allNeededEmployees;
      next();
    }).catch((err) => {
      res.status(500).send('Error getting neededEmployees');
    });
};

const getAllEmployeeAvailabilities = (req, res, next) => {
  db.Employee_Availability.findAll({})
    .then((allEmployeeAvailabilities) => {
      req.employeeAvailabilities = allEmployeeAvailabilities;
      next();
    }).catch((err) => {
      res.status(500).send('Error getting users');
    });
};

const getAllDayParts = (req, res, next) => {
  db.Day_Part.findAll({})
    .then((allDayParts) => {
      req.dayParts = allDayParts;
      next();
    }).catch((err) => {
      res.status(500).send('Error getting users');
    });
};

const getAllActualSchedules = (req, res, next) => {
  db.Actual_Schedule.findAll({})
  .then((schedules) => {
    req.actual_schedules = schedules;
    next();
  }).catch((err) => {
    res.status(500).send('Error getting schedules');
  })
};

const addUser = (req, res, next) => {
  db.User.create({
    name: req.body.username,
    role: 'employee',
    password: passHash(req.body.password),
  })
    .then((user) => {
      req.user = user;
      next();
    }).catch((err) => {
      res.json({ flashMessage: { message: 'username already exists', type: 'red'} });
    });
};

const addEmployeeAvailability = (req, res, next) => {
  const parsedUserId = JSON.parse(JSON.stringify(req.user)).id;
  const parsedDayPartsKeys = Object.keys(req.dayParts);
  req.employeeAvailability = {};
  Promise.each(parsedDayPartsKeys, (key) => {
    const id = JSON.parse(key) + 1;
    return db.Employee_Availability.create({
      is_available: true,
      user_id: parsedUserId,
      day_part_id: id,
    })
      .then((availability) => {
        req.employeeAvailability[key] = availability;
      })
      .catch((err) => {
        res.status(500).send(`error adding availability for daypartid ${id}: ${err}`);
      });
  })
    .then(() => {
      next();
    }).catch((err) => {
      res.status(500).send(`error adding availability for user ${parsedUserId}: ${err}`);
    });
};

// Takes new employeeAvailabilities and updates them in the database
const updateEmployeeAvailability = (req, res, next) => {
  return Promise.each(req.body.employeeAvailabilities, (employeeAvail) => {
    const updates = { is_available: employeeAvail.is_available };
    const conditions = {
      where: {
        user_id: employeeAvail.user_id,
        day_part_id: employeeAvail.day_part_id,
      },
    };
    return db.Employee_Availability.update(updates, conditions);
  }).then((updatedAvailabilities) => {
    req.empoloyeeAvailabilities = updatedAvailabilities;
    next();
  });
};

const updateNeededEmployees = (req, res, next) => {
  return Promise.each(req.body.scheduleAvailabilities, (scheduleAvail) => {
    const updates = { employees_needed: scheduleAvail.employees_needed };
    const conditions = {
      where: {
        schedule_id: scheduleAvail.schedule_id,
        day_part_id: scheduleAvail.day_part_id,
      },
    };
    return db.Needed_Employee.update(updates, conditions);
  }).then((updatedTemplate) => {
    req.scheduleTemplate = updatedTemplate;
    next();
  }).catch((err) => {
    res.status(500).send('Error updating needed employees');
  });
};

const createScheduleDate = (req, res, next) => {
  db.Schedule.create({
    monday_dates: moment(req.body.scheduleTemplate[0].monday_dates)
  }).then((scheduleDate)=> {
    req.scheduleTemplate = {};
    req.scheduleTemplate.monday_date = scheduleDate;
    next();
  }).catch((err) => {
    res.status(500).send('Error creating new schedule date');
  });
};

const createScheduleTemplate = (req, res, next) => {
  let newTemplate = [];
  return Promise.each(req.body.scheduleTemplate, (key) => {
    return db.Needed_Employee.create({
      employees_needed: key.employees_needed,
      schedule_id: req.scheduleTemplate.monday_date.dataValues.id,
      day_part_id: parseInt(key.day_part_id),
    }).then((entry) => {
      newTemplate.push(entry);
    });
  }).then(() => {
    req.scheduleTemplate.template = newTemplate;
    next();
  }).catch((err) => {
    res.end(err);
  });
};

const newSession = (req, res) => {
  let session = {};
  session.session = crypto.randomBytes(32).toString('hex');
  session.user = null;
  res.cookie('shiftly', session.session);
  return session;
};

const checkSession = (req, res, next) => {
  return new Promise((resolve, reject) => {
    if (req.cookies['shiftly']) {
      resolve(db.Session.findAll( {where: { session: req.cookies['shiftly'] } }));
    } else {
      resolve([]);
    }
  })
  .then((session) => {
    if (session.length > 0) {
      db.User.findAll({ where: { id: session[0].dataValues.user_id}})
      .then((user) => {
        let obj =  { session: session[0].dataValues.session }; 
        if (user.length) {
          obj.user = user[0].dataValues.name;
          obj.role = user[0].dataValues.role;
        }
        req.session = obj;
        next();
      })
    } else {
      req.session = newSession(req, res);
      next();
    }
  })
};

const passHash = (password) => {
  let shasum = crypto.createHash('sha256');
  shasum.update(password);
  return shasum.digest('hex');
}

const authenticate = (req, res, next) => {
  //get user info from user db;
  if (req.session.user) {
    next();
    return;
  }
  db.User.findAll({ where: {name: req.body.creds.username} })
  .then((user) => {
    if (user.length === 0) {
      res.status(201).send({ flashMessage: { message: 'incorrect username or password', type: 'red'}});
      return;
    }
    user = user[0].dataValues;
    if (passHash(req.body.creds.password) === user.password) {
      req.session = newSession(req, res);
      req.session.user = user.name;
      req.session.role = user.role;
      db.Session.create({session: req.session.session, user_id: user.id})
      .then(() => {
        next();
      })
    } else {
      res.status(201).send({ flashMessage: { message: 'incorrect username or password', type: 'red'}});
    }
  })
};

const createUser = (req, res, next) => {
  const user = req.body.creds;
  user.name = user.username;
  user.password = passHash(user.password);
  db.User.create(user).then((data) => {
    req.session = newSession(req, res);
    req.session.user = user.username;
    req.session.role = data.dataValues.role;
    db.Session.create({session: req.session.session, user_id: data.dataValues.id})
    .then(() => {
      next();
    })
  }).catch((err) => {
    res.status(201).send({ flashMessage: {message: `username "${user.username}" already exists`, type: 'red'}})
  })
};

const redirectIfLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    res.send();
    return;
  } 
  console.log('redirecting');
  next();
};

const sendEmployeeInfo = (req, res, next) => {
  if (req.session.role === 'employee') {
    let obj = {};
    obj.user = req.user;
    obj.dayParts = req.dayParts;
    obj.users = req.users.filter((user) => {
      return user.dataValues.name === req.session.user;
    })
    .map((e) => e.dataValues);
    obj.scheduleActual = req.actual_schedules.filter((sched) => {
      return sched.user_id === obj.users[0].id;
    })
    .map((e) => e.dataValues);
    obj.employeeAvailabilities = req.employeeAvailabilities.filter((avail) => {
      return avail.dataValues.user_id === obj.users[0].id;
    })
    .map((e) => e.dataValues);
    obj.scheduleDates = req.scheduleDates;
    obj.view = 'employeeEditor';
    res.json(obj);
    return;
  }
  next();
};

const destroySession = (req, res, next) => {
  console.log('destroying session');
  db.Session.destroy({ where:{session: req.session.session} })
  .then(() => {
    console.log('creating new session');
    req.session = newSession(req, res);
    next();
  })
};


module.exports = {
  passHash,
  updateProfile: updateProfile,
  getUser: getUser,
  destroySession: destroySession,
  sendEmployeeInfo: sendEmployeeInfo,
  getAllActualSchedules: getAllActualSchedules,
  redirectIfLoggedIn: redirectIfLoggedIn,
  createUser: createUser,
  authenticate: authenticate,
  getAllUsers: getAllUsers,
  updateEmployeeAvailability: updateEmployeeAvailability,
  getAllEmployeeAvailabilities: getAllEmployeeAvailabilities,
  getAllDayParts: getAllDayParts,
  getAllNeededEmployees: getAllNeededEmployees,
  getAllScheduleDates: getAllScheduleDates,
  addUser: addUser,
  addEmployeeAvailability: addEmployeeAvailability,
  checkSession: checkSession,
  updateNeededEmployees: updateNeededEmployees,
  createScheduleDate:createScheduleDate,
  createScheduleTemplate: createScheduleTemplate,
};
