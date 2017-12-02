import { combineReducers } from 'redux';
import EmployeeAvailabilitiesReducer from './reducer-employee-availabilities.js';
import UsersReducer from './reducer-users.js';
import DayPartsReducer from './reducer-day-parts.js';
import NeededEmployeesReducer from './reducer-needed-employees.js';
import ScheduleDatesReducer from './reducer-schedule-dates.js';
import ScheduleActual from './reducer-schedule-actual.js';
import SelectedWeekReducer from './reducer-selected-week.js';
import View from './reducer-view.js';
import FlashMessage from './reducer-flash-message.js';
import User from './reducer-user.js';

const rootReducer = combineReducers({
  user: User,
  flashMessage: FlashMessage,
  employeeAvailabilities: EmployeeAvailabilitiesReducer,
  scheduleActual: ScheduleActual,
  users: UsersReducer,
  dayParts: DayPartsReducer,
  neededEmployees: NeededEmployeesReducer,
  scheduleDates: ScheduleDatesReducer,
  selectedWeek: SelectedWeekReducer,
  view: View,
});

export default rootReducer;
