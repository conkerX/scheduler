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

// const scheduleGenerator = (allEmployeeAvail, temp) => {
//   const allCombinations = {};
//   // fill allCombinations with all the possible combinations of employees for each day
//   for (const dayPart in temp) {
//     // if no one is needed for the shift
//     if (temp[dayPart] === 0) {
//       allCombinations[dayPart] = [[]];
//     } else {
//       // if employees needed but no one is available, add blank arr
//       if (!allEmployeeAvail[dayPart]) {
//         allEmployeeAvail[dayPart] = [];
//       }
//       if (allEmployeeAvail[dayPart].length < temp[dayPart]) {
//         const numOfAvailEmployees = allEmployeeAvail[dayPart].length;
//         for (let i = 0; i < temp[dayPart] - numOfAvailEmployees; i++) {
//           allEmployeeAvail[dayPart].push('house');
//         }
//       }
//       allCombinations[dayPart] = Combinatorics
//         .combination(allEmployeeAvail[dayPart], temp[dayPart])
//         .toArray();
//     }
//   }

//   let schedule = {};
//   const cheapSolution = [];
//   const completedSchedules = [];

//   const findCheapSolution = (possibilities) => {
//     let rocker = true;
//     for (const dayPart in possibilities) {
//       schedule[dayPart] = rocker ?
//         possibilities[dayPart][0] :
//         possibilities[dayPart][possibilities[dayPart].length - 1];
//       rocker = !rocker;
//     }
//     const completed = Object.assign({}, schedule);
//     cheapSolution.push(completed);
//   };
//   const findSolution = (possibilities, empShifts, dayPart) => {
//     // for every dayPart
//     const currentDayPossibilities = possibilities[dayPart];
//     // iterate over all possibilites
//     // for every possibility
//     for (let i = 0; i < currentDayPossibilities.length; i++) {
//       if (completedSchedules.length >= 10) { return; }
//       const thisTry = currentDayPossibilities[i];
//       // add employee shifts to the counter
//       if (!willAnyEmployeeBeInOvertime(empShifts, thisTry) && !willHaveDouble(schedule[dayPart-1], thisTry)) {
//         thisTry.forEach((e) => {
//           empShifts[e] = empShifts[e] ? empShifts[e] + 1 : 1;
//         });
//         schedule[dayPart] = thisTry;
//         if (dayPart < 14) {
//          findSolution(possibilities, empShifts, dayPart+1);
//         } else {
//           const completed = Object.assign({}, schedule);
//           completedSchedules.push(completed);
//         }
//         schedule[dayPart] = [];
//         thisTry.forEach((e) => {
//           empShifts[e]--;
//         });
//       }
//     }
//   };
//   findCheapSolution(allCombinations);
//   schedule = {};
//   findSolution(allCombinations, {}, 1);
//   return completedSchedules.length ?
//     completedSchedules[Math.floor(Math.random() * completedSchedules.length)] :
//     cheapSolution[0];
// };

// const willAnyEmployeeBeInOvertime = (shiftCounts, proposedShift) => {
//   let overtime = false;
//   proposedShift.forEach((e) => {
//     if (shiftCounts[e] >= 6) {
//       overtime = true;
//     }
//   });
//   return overtime;
// };

// const willHaveDouble = (amShift = [], pmShift) => {
//   for (let i = 0; i < amShift.length; i++) {
//     if (pmShift.includes(amShift[i])) {
//       return true;
//     }
//   }
//   return false;
// };

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
  // console.log(shifts);

  if (diffs.reduce((acc, val) => (acc || val < 0), false)) {
    return false;
  }

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

  // console.log(schedule.hasDoubles);
  // console.log(schedule.hasOvertime);

  return finalSolution && finalSolution
    .plan.map((shift) => {
      const out = [];
      shift.forEach((working, i) => {
        if (working) {
          out.push(i);
        }
      });
      return out;
    });
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
