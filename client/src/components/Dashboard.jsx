import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';

import EmployeeEditor from '../containers/EmployeeEditor.jsx';
import ScheduleEditor from '../containers/ScheduleEditor.jsx';
import ScheduleGenerator from '../containers/ScheduleGenerator.jsx';
import ScheduleActual from './ScheduleActual.jsx';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentView: 'scheduleEditor',
    };
  }

  render() {
    let editorView;
    let employeeStyle = 'ratio-col-2 editor-tab clickable';
    let scheduleStyle ='ratio-col-2 editor-tab clickable';
    if(this.state.currentView === 'employeeEditor') {
      editorView = <EmployeeEditor />;
      employeeStyle = 'ratio-col-2 editor-tab selected-tab';
    } else {
      editorView = <ScheduleEditor />;
      scheduleStyle = 'ratio-col-2 editor-tab selected-tab';
    }

    return (
      <div className="dashboard-container">
        <div className="ratio-col-4 major-component">
          <div className="component-block">
            <div className="editor-header">
              <div className="container clear-fix">
                <div className={employeeStyle} onClick={() => { this.setState({currentView: 'employeeEditor' })}}>Employees</div>
                <div className={scheduleStyle} onClick={() => { this.setState({currentView: 'scheduleEditor' })}}>Shifts</div>
              </div>
            </div>
          {editorView}
          </div>
        </div>
        <div className="ratio-col-4-3 major-component">
          <div className="component-block">
            <ScheduleGenerator
              selectedWeek={this.props.selectedWeek}
              weekHasActualSchedule={this.props.weekHasActualSchedule}
              weekHasAtLeastOneNeededEmployee={this.props.weekHasAtLeastOneNeededEmployee}
            />
            <ScheduleActual
              selectedWeek={this.props.selectedWeek}
              weekHasActualSchedule={this.props.weekHasActualSchedule}
              weekHasAtLeastOneNeededEmployee={this.props.weekHasAtLeastOneNeededEmployee}
              selectedWeekActualSchedule={this.props.selectedWeekActualSchedule}
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  let scheduleId = null;
  let weekHasActualSchedule = false;
  let weekHasAtLeastOneNeededEmployee = false;
  let actualSchedule = null;
  
  if (state.scheduleDates) {
    const selectedWeekObj = state.scheduleDates.find((el) => {
        return el.monday_dates.toString().substr(0, 10) === state.selectedWeek;
      });
      scheduleId = selectedWeekObj ? selectedWeekObj.id : null;
  }

  if (scheduleId) {
    const scheduleFound = state.scheduleActual.find((el) => {
      return el.schedule_id === scheduleId
    });
    if (scheduleFound) {
      weekHasActualSchedule = true;
      actualSchedule = state.scheduleActual.filter((el) => {
        return el.schedule_id === scheduleId;
      });
    }
    if(state.neededEmployees) {
      const countOfNeededEmployees = state.neededEmployees.filter((el) => {
        return el.schedule_id === scheduleId;
      }).reduce((acc, el) => {
        return acc + el.employees_needed;
      }, 0);
      if (countOfNeededEmployees > 0) {
        weekHasAtLeastOneNeededEmployee = true;
      }
    }
  }


  const schedules = {};
  const scheduleArr = [];
  if (actualSchedule) {
    actualSchedule.forEach((e) => {
      if (e.user_id === null) {
        schedules['HOUSE'] = schedules['HOUSE'] || [];
        schedules['HOUSE'].push(e.day_part_id);
      } else {
        schedules[e.user_id] = schedules[e.user_id] || [];
        schedules[e.user_id].push(e.day_part_id);
      }
    });

    for (let sched in schedules) {
      const schedObj = {};
      if (sched === 'HOUSE') {
        schedObj.name = 'HOUSE';
        schedObj.schedule = schedules[sched];
      } else {
        schedObj.name = state.users.filter( (user) => {
          return user.id == sched;
        })[0].name;

        schedObj.schedule = schedules[sched];
      }

      scheduleArr.push(schedObj);
    }
  }

  return {
    selectedWeek: state.selectedWeek,
    selectedWeekScheduleId: scheduleId,
    weekHasActualSchedule: weekHasActualSchedule,
    weekHasAtLeastOneNeededEmployee: weekHasAtLeastOneNeededEmployee,
    selectedWeekActualSchedule: scheduleArr,
  }
}

  Dashboard.propTypes = {
  selectedWeekScheduleId: PropTypes.number,
  weekHasActualSchedule: PropTypes.bool.isRequired,
  weekHasAtLeastOneNeededEmployee: PropTypes.bool.isRequired,
  selectedWeekActualSchedule: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedWeek: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(Dashboard);
