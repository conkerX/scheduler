const db = require('../database/index.js');
const Promise = require('bluebird');
const Combinatorics = require('js-combinatorics');

const availabilityParser = (availability) => {
  const availObj = {};
  availability.forEach((availPerDayPart) => {
    availPerDayPart.forEach((availByEmp) => {
      if (!availObj[availByEmp.dataValues.day_part_id]) {
        availObj[availByEmp.dataValues.day_part_id] = [availByEmp.dataValues.user_id];
      } else {
        availObj[availByEmp.dataValues.day_part_id].push(availByEmp.dataValues.user_id);
      }
    });
  });
  return availObj;
};

const findAllEmployeeAvailability = () => {
  const availability = [];
  return db.Day_Part.findAll({ attributes: ['id'] })
    .then(dayParts => Promise.each(dayParts, dayPart => db.Employee_Availability.findAll({
      where: {
        day_part_id: dayPart.dataValues.id,
        is_available: true,
      },
    })
      .then((avail) => {
        availability.push(avail);
      })))
    .then(() => availabilityParser(availability));
};

const templateParser = (weekStart) => {
  const tempObj = {};
  return db.Schedule.find({ where: { monday_dates: weekStart } })
    .then((schedule) => {
      const scheduleId = schedule.dataValues.id;
      return db.Needed_Employee.findAll({ where: { schedule_id: scheduleId } })
        .then((template) => {
          template.forEach((dayPart) => {
            tempObj[dayPart.dataValues.day_part_id] = dayPart.dataValues.employees_needed;
          });
          return [tempObj, scheduleId];
        });
    });
};

function scheduleGenerator(allEmployeeAvail, temp) {
  // reduce helpers
  const max = (acc, val) => (val > acc ? val : acc);
  const sum = (acc, val) => acc + val;
  const countTrue = (acc, val) => (val ? acc + 1 : acc);

  // convert objects to arrays to access array methods
  const availabilities = [];
  for (const i in allEmployeeAvail) {
    availabilities[i - 1] = allEmployeeAvail[i];
  }

  const shiftNeeds = [];
  for (const i in temp) {
    shiftNeeds[i - 1] = temp[i];
  }

  const numEmployees = availabilities.map(shift => shift.reduce(max)).reduce(max);

  // sort shifts by diff between num of employees needed and num of employees available
  const diffs = shiftNeeds.map((numEmployeesNeeded, i) => (
    availabilities[i].length - numEmployeesNeeded
  ));

  const houseShifts = (new Array(14)).fill(0);
  diffs.forEach((diff, i) => {
    if (diff < 0) {
      shiftNeeds[i] += diff;
      houseShifts[i] = -diff;
    }
  });

  const shiftsByDiff = diffs
    .map((diff, i) => [diff, i])
    .sort((a, b) => {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    })
    .map(tuple => tuple[1]);

  const shifts = [shiftsByDiff[0]];
  let index = shifts[0] + 1;
  while (index < shiftNeeds.length) {
    shifts.push(index);
    index += 1;
  }
  index = shifts[0] - 1;
  while (index >= 0) {
    shifts.push(index);
    index -= 1;
  }

  // if (diffs.reduce((acc, val) => (acc || val < 0), false)) {
  //   return false;
  // }

  const allCombos = availabilities.map((availability, i) => (
    Combinatorics
      .combination(availability, shiftNeeds[i])
      .toArray()
  ));

  const initialPlan = [];
  for (let i = 0; i < 14; i += 1) {
    initialPlan[i] = (new Array(numEmployees)).fill(false);
  }

  class Schedule {
    constructor(plan = initialPlan, size = 0) {
      this.plan = plan;
      this.size = size;
      this.hasOvertime = false;
      this.hasDoubles = false;
    }

    isComplete() {
      return this.size === shiftNeeds.length;
    }

    hasDoubleShiftConflict(shift, employee) {
      if (this.hasDoubles) return false;
      if (shift === 0) return this.plan[shift + 1][employee];
      if (shift === this.plan.length - 1) return this.plan[shift - 1][employee];
      return this.plan[shift - 1][employee] || this.plan[shift + 1][employee];
    }

    hasOvertimeConflict(employee) {
      if (this.hasOvertime) return false;
      return this.plan.map(shift => shift[employee]).reduce(countTrue) > 5;
    }

    format() {
      return this.plan.map((shift) => {
        const out = [];
        shift.forEach((working, i) => {
          if (working) {
            out.push(i);
          }
        });
        return out;
      });
    }
  }

  const schedule = new Schedule();

  const solve = () => {
    // console.log('\n', schedule.format());
    if (schedule.isComplete()) {
      return schedule;
    }

    const shift = shifts[schedule.size];
    const availability = availabilities[shift];
    const combos = allCombos[shift];

    if (availability.length < shiftNeeds[shift]) {
      return false;
    }

    for (let i = 0; i < combos.length; i += 1) {
      let isValidCombo = true;
      for (let j = 0; j < combos[i].length; j += 1) {
        if (
          schedule.hasDoubleShiftConflict(shift, combos[i][j])
            || schedule.hasOvertimeConflict(combos[i][j])
        ) {
          isValidCombo = false;
          break;
        }
      }

      if (isValidCombo) {
        for (let j = 0; j < combos[i].length; j += 1) {
          schedule.plan[shift][combos[i][j]] = true;
        }
        schedule.size += 1;

        const solution = solve();
        if (solution) {
          return solution;
        }

        for (let j = 0; j < schedule.plan[shift].length; j += 1) {
          schedule.plan[shift][j] = false;
        }
        schedule.size -= 1;
      }
    }

    return false;
  };


  let finalSolution = solve();
  if (!finalSolution) {
    schedule.hasDoubles = true;
    finalSolution = solve();
  }
  if (!finalSolution) {
    schedule.hasOvertime = true;
    finalSolution = solve();
  }
  if (!finalSolution) {
    return false;
  }

  // console.log(schedule.hasDoubles);
  // console.log(schedule.hasOvertime);

  const output = finalSolution
    .plan.map((shift) => {
      const out = [];
      shift.forEach((working, i) => {
        if (working) {
          out.push(i);
        }
      });
      return out;
    });

  houseShifts.forEach((numHouseshifts, i) => {
    let n = numHouseshifts;
    while (n > 0) {
      output[i].push('house');
      n -= 1;
    }
  });

  output.unshift(null);

  return output;
}

const reformatScheduleObj = (actual_schedule, schedule_id) => {
  const reformat = [];
  for (const dayPart in actual_schedule) {
    actual_schedule[dayPart].forEach((employee) => {
      if (employee === 'house') {
        employee = null;
      }
      reformat.push({
        user_id: employee,
        schedule_id: schedule_id,
        day_part_id: parseInt(dayPart),
      });
    });
  }
  return reformat;
};

const generateSchedule = weekStart => findAllEmployeeAvailability()
  .then((availObj) => {
    const avail = availObj;
    return templateParser(weekStart)
      .then((temp) => {
        let template = temp[0];
        let schedule_id = temp[1];

        let actual_schedule = scheduleGenerator(avail, template);
        let reformattedSchedule = reformatScheduleObj(actual_schedule, schedule_id);
        return db.Actual_Schedule.destroy({ where: { schedule_id: schedule_id } })
          .then(() => Promise.each(reformattedSchedule, (scheduleObj) => {
            return db.Actual_Schedule.create(scheduleObj);
          })
            .then(() => reformattedSchedule));
      });
  });

module.exports.generateSchedule = generateSchedule;
// scheduleGenerator is exported for testing puroposes only
module.exports.scheduleGenerator = scheduleGenerator;
