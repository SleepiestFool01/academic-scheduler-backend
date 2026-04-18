import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import Calendar from "./calendar.model.js";
import Department from "./department.model.js";
import DepartmentAccessRequest from "./departmentAccessRequest.model.js";
import Employee from "./employee.model.js";
import EmployeeUnavailability from "./employeeUnavailability.model.js";
import Event from "./event.model.js";
import PersonalAvailability from "./personalAvailability.model.js";
import Position from "./position.model.js";
import PositionEmployee from "./positionEmployee.model.js";
import PositionTaskList from "./positionTaskList.model.js";
import Session from "./session.model.js";
import Setting from "./setting.model.js";
import SettingValue from "./settingValue.model.js";
import Shift from "./shift.model.js";
import ShiftAssignment from "./shiftAssignment.model.js";
import ShiftTaskList from "./shiftTaskList.model.js";
import ShiftTaskListStatus from "./shiftTaskListStatus.model.js";
import ManagerDepartment from "./managerDepartment.model.js";
import EmployeeDepartment from "./employeeDepartment.model.js";
import SwapRequest from "./swapRequest.model.js";
import Task from "./task.model.js";
import TaskList from "./tasklist.model.js";
import Template from "./template.model.js";
import TemplateShift from "./templateShift.model.js";
import TemplateShiftEmployee from "./templateShiftEmployee.model.js";
import TemplateShiftTaskList from "./templateShiftTaskList.model.js";
import TemplateApplication from "./templateApplication.model.js";
import TemplateApplicationShift from "./templateApplicationShift.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.calendar = Calendar;
db.department = Department;
db.departmentAccessRequest = DepartmentAccessRequest;
db.employee = Employee;
db.event = Event;
db.personalAvailability = PersonalAvailability;
db.position = Position;
db.positionEmployee = PositionEmployee;
db.positionTaskList = PositionTaskList;
db.session = Session;
db.setting = Setting;
db.settingValue = SettingValue;
db.shift = Shift;
db.shiftAssignment = ShiftAssignment;
db.shiftTaskList = ShiftTaskList;
db.shiftTaskListStatus = ShiftTaskListStatus;
db.managerDepartment = ManagerDepartment;
db.employeeDepartment = EmployeeDepartment;
db.employeeUnavailability = EmployeeUnavailability;
db.swapRequest = SwapRequest;
db.task = Task;
db.taskList = TaskList;
db.template                  = Template;
db.templateShift             = TemplateShift;
db.templateShiftEmployee     = TemplateShiftEmployee;
db.templateShiftTaskList     = TemplateShiftTaskList;
db.templateApplication       = TemplateApplication;
db.templateApplicationShift  = TemplateApplicationShift;

// Template → TemplateShift (cascade delete shifts when template is deleted)
TemplateShift.belongsTo(Template, {
  foreignKey: { name: "id_template", allowNull: false },
  as: "template",
  onDelete: "CASCADE",
});
Template.hasMany(TemplateShift, {
  foreignKey: { name: "id_template", allowNull: false },
  as: "shifts",
});

// TemplateShift → TemplateShiftEmployee (cascade)
TemplateShiftEmployee.belongsTo(TemplateShift, {
  foreignKey: { name: "id_templateShift", allowNull: false },
  as: "templateShift",
  onDelete: "CASCADE",
});
TemplateShift.hasMany(TemplateShiftEmployee, {
  foreignKey: { name: "id_templateShift", allowNull: false },
  as: "employees",
});

// TemplateShift → TemplateShiftTaskList (cascade)
TemplateShiftTaskList.belongsTo(TemplateShift, {
  foreignKey: { name: "id_templateShift", allowNull: false },
  as: "templateShift",
  onDelete: "CASCADE",
});
TemplateShift.hasMany(TemplateShiftTaskList, {
  foreignKey: { name: "id_templateShift", allowNull: false },
  as: "taskLists",
});

// Template → TemplateApplication (cascade)
TemplateApplication.belongsTo(Template, {
  foreignKey: { name: "id_template", allowNull: false },
  as: "template",
  onDelete: "CASCADE",
});
Template.hasMany(TemplateApplication, {
  foreignKey: { name: "id_template", allowNull: false },
  as: "applications",
});

// TemplateApplication → TemplateApplicationShift (cascade)
TemplateApplicationShift.belongsTo(TemplateApplication, {
  foreignKey: { name: "id_templateApplication", allowNull: false },
  as: "application",
  onDelete: "CASCADE",
});
TemplateApplication.hasMany(TemplateApplicationShift, {
  foreignKey: { name: "id_templateApplication", allowNull: false },
  as: "shiftLinks",
});

// =============================
// Scheduler-specific relations
// =============================

// Department relations
Position.belongsTo(Department, {
  foreignKey: { name: "id_department", allowNull: true },
  as: "department",
  onDelete: "SET NULL",
});
Department.hasMany(Position, {
  foreignKey: { name: "id_department", allowNull: true },
  as: "positions",
});

Event.belongsTo(Department, {
  foreignKey: { name: "id_department", allowNull: false },
  as: "department",
  onDelete: "CASCADE",
});
Department.hasMany(Event, {
  foreignKey: { name: "id_department", allowNull: false },
  as: "events",
});

SettingValue.belongsTo(Department, {
  foreignKey: { name: "id_department", allowNull: false },
  as: "department",
  onDelete: "CASCADE",
});
Department.hasMany(SettingValue, {
  foreignKey: { name: "id_department", allowNull: false },
  as: "settingValues",
});

// Position ↔ TaskList (bridge: auto-assigns task lists to shifts with this position)
PositionTaskList.belongsTo(Position, {
  foreignKey: { name: "id_position", allowNull: false },
  as: "position",
  onDelete: "CASCADE",
});
Position.hasMany(PositionTaskList, {
  foreignKey: { name: "id_position", allowNull: false },
  as: "taskListLinks",
});

PositionTaskList.belongsTo(TaskList, {
  foreignKey: { name: "id_taskList", allowNull: false },
  as: "taskList",
  onDelete: "CASCADE",
});
TaskList.hasMany(PositionTaskList, {
  foreignKey: { name: "id_taskList", allowNull: false },
  as: "positionLinks",
});

// Position ↔ Employee (assignment bridge)
PositionEmployee.belongsTo(Position, {
  foreignKey: { name: "id_position", allowNull: false },
  as: "position",
  onDelete: "CASCADE",
});
PositionEmployee.belongsTo(Employee, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "employee",
  onDelete: "CASCADE",
});
Position.hasMany(PositionEmployee, {
  foreignKey: { name: "id_position", allowNull: false },
  as: "positionEmployees",
});
Employee.hasMany(PositionEmployee, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "positionEmployees",
});

// Employee availability
PersonalAvailability.belongsTo(Employee, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "employee",
  onDelete: "CASCADE",
});
Employee.hasMany(PersonalAvailability, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "availabilities",
});

// Settings
SettingValue.belongsTo(Setting, {
  foreignKey: { name: "id_setting", allowNull: false },
  as: "setting",
  onDelete: "CASCADE",
});
Setting.hasMany(SettingValue, {
  foreignKey: { name: "id_setting", allowNull: false },
  as: "values",
});

// Shifts
ShiftAssignment.belongsTo(Shift, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "shift",
  onDelete: "CASCADE",
});
Shift.hasMany(ShiftAssignment, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "assignments",
});

ShiftAssignment.belongsTo(Employee, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "employee",
  onDelete: "CASCADE",
});
Employee.hasMany(ShiftAssignment, {
  foreignKey: { name: "id_employee", allowNull: false },
  as: "shiftAssignments",
});

// Task ↔ TaskList
// constraints:false prevents Sequelize from managing the FK during sync,
// avoiding a MySQL error when altering the column + adding a SET NULL FK atomically.
Task.belongsTo(TaskList, {
  foreignKey: { name: "id_taskList", allowNull: true },
  as: "taskList",
  onDelete: "SET NULL",
  constraints: false,
});
TaskList.hasMany(Task, {
  foreignKey: { name: "id_taskList", allowNull: true },
  as: "tasks",
  constraints: false,
});

// ShiftTaskList: Shift ↔ TaskList bridge
ShiftTaskList.belongsTo(Shift, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "shift",
  onDelete: "CASCADE",
});
Shift.hasMany(ShiftTaskList, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "shiftTaskLists",
});

ShiftTaskList.belongsTo(TaskList, {
  foreignKey: { name: "id_taskList", allowNull: false },
  as: "taskList",
  onDelete: "CASCADE",
});
TaskList.hasMany(ShiftTaskList, {
  foreignKey: { name: "id_taskList", allowNull: false },
  as: "shiftAssignments",
});

// ShiftTaskListStatus: per-task completion per ShiftTaskList assignment
ShiftTaskListStatus.belongsTo(ShiftTaskList, {
  foreignKey: { name: "id_shiftTaskList", allowNull: false },
  as: "shiftTaskList",
  onDelete: "CASCADE",
});
ShiftTaskList.hasMany(ShiftTaskListStatus, {
  foreignKey: { name: "id_shiftTaskList", allowNull: false },
  as: "statuses",
});

ShiftTaskListStatus.belongsTo(Task, {
  foreignKey: { name: "id_task", allowNull: false },
  as: "task",
  onDelete: "CASCADE",
});
Task.hasMany(ShiftTaskListStatus, {
  foreignKey: { name: "id_task", allowNull: false },
  as: "shiftStatuses",
});

// Swap requests
SwapRequest.belongsTo(Shift, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "shift",
  onDelete: "CASCADE",
});
Shift.hasMany(SwapRequest, {
  foreignKey: { name: "id_shift", allowNull: false },
  as: "swapRequests",
});

SwapRequest.belongsTo(Employee, {
  foreignKey: { name: "id_employeeRequester", allowNull: false },
  as: "requester",
  onDelete: "CASCADE",
});
SwapRequest.belongsTo(Employee, {
  foreignKey: { name: "id_employeeRequested", allowNull: true },
  as: "requested",
  onDelete: "CASCADE",
});

// ManagerDepartment: Manager ↔ Department (multi-dept access)
ManagerDepartment.belongsTo(Employee, {
    foreignKey: { name: "id_employee", allowNull: false },
    as: "employee",
    onDelete: "CASCADE",
});
Employee.hasMany(ManagerDepartment, {
    foreignKey: { name: "id_employee", allowNull: false },
    as: "managerDepartments",
});

ManagerDepartment.belongsTo(Department, {
    foreignKey: { name: "id_department", allowNull: false },
    as: "department",
    onDelete: "CASCADE",
});
Department.hasMany(ManagerDepartment, {
    foreignKey: { name: "id_department", allowNull: false },
    as: "managerDepartments",
});

// Calendar entries (hours of operation)
Calendar.belongsTo(Department, {
    foreignKey: { name: "id_department", allowNull: true },
    as: "department",
    onDelete: "CASCADE",
    constraints: false,
});
Department.hasMany(Calendar, {
    foreignKey: { name: "id_department", allowNull: true },
    as: "calendarEntries",
    constraints: false,
});

// DepartmentAccessRequest: Manager requests access to an additional Department
DepartmentAccessRequest.belongsTo(Employee, {
    foreignKey: { name: "id_employeeRequester", allowNull: false },
    as: "requester",
    onDelete: "CASCADE",
});
DepartmentAccessRequest.belongsTo(Department, {
    foreignKey: { name: "id_department", allowNull: false },
    as: "department",
    onDelete: "CASCADE",
});

export default db;
