"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = __importDefault(require("../src/lib/prisma.js"));
async function main() {
    console.log('🌱 Starting database seed with RBAC Users...');
    // 1. Clean up existing data in reverse order of foreign keys
    await prisma_js_1.default.user.deleteMany();
    await prisma_js_1.default.attendance.deleteMany();
    await prisma_js_1.default.shiftAssignment.deleteMany();
    await prisma_js_1.default.employee.deleteMany();
    await prisma_js_1.default.role.deleteMany();
    await prisma_js_1.default.department.deleteMany();
    await prisma_js_1.default.shift.deleteMany();
    console.log('🧹 Cleaned existing records.');
    // Common password hashes
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin123!', 10);
    const managerPasswordHash = await bcryptjs_1.default.hash('Manager123!', 10);
    const staffPasswordHash = await bcryptjs_1.default.hash('Staff123!', 10);
    // 2. Seed Super Admin User
    const adminUser = await prisma_js_1.default.user.create({
        data: {
            email: 'admin@noruhotel.com',
            passwordHash: adminPasswordHash,
            role: client_1.UserRole.ADMIN,
            mustChangePassword: false,
        },
    });
    console.log(`👑 Created Super Admin: ${adminUser.email}`);
    // 3. Seed Departments
    const departmentsData = [
        { name: 'Front Desk', description: 'Guest check-in, concierge, reservations and front-of-house operations.' },
        { name: 'Housekeeping', description: 'Room cleaning, laundry, sanitization and floor management.' },
        { name: 'Kitchen & F&B', description: 'Culinary preparation, room service, banquet and restaurant dining.' },
        { name: 'Maintenance', description: 'HVAC, plumbing, electrical, carpentry and facilities upkeep.' },
    ];
    const departments = {};
    for (const dept of departmentsData) {
        departments[dept.name] = await prisma_js_1.default.department.create({ data: dept });
    }
    console.log(`✅ Created ${Object.keys(departments).length} departments.`);
    // 4. Seed Roles
    const rolesData = [
        { title: 'Front Desk Agent', description: 'Handles check-ins, guest inquiries, and billing.' },
        { title: 'Head Concierge', description: 'Coordinates VIP services, transportation, and tours.' },
        { title: 'Housekeeping Supervisor', description: 'Inspects guest rooms and coordinates daily cleaning.' },
        { title: 'Room Attendant', description: 'Cleans guest suites and replenishes guest amenities.' },
        { title: 'Head Chef', description: 'Leads kitchen brigade, menu planning, and food safety.' },
        { title: 'Line Cook', description: 'Prepares restaurant orders and banquet dishes.' },
        { title: 'Chief Engineer', description: 'Supervises mechanical and physical infrastructure.' },
        { title: 'Maintenance Technician', description: 'Executes rapid facility repairs and equipment maintenance.' },
    ];
    const roles = {};
    for (const role of rolesData) {
        roles[role.title] = await prisma_js_1.default.role.create({ data: role });
    }
    console.log(`✅ Created ${Object.keys(roles).length} roles.`);
    // 5. Seed Shifts
    const shiftsData = [
        { name: 'Morning Shift', startTime: '07:00', endTime: '15:00' },
        { name: 'Evening Shift', startTime: '15:00', endTime: '23:00' },
        { name: 'Night Shift', startTime: '23:00', endTime: '07:00' },
    ];
    const shifts = {};
    for (const shift of shiftsData) {
        shifts[shift.name] = await prisma_js_1.default.shift.create({ data: shift });
    }
    console.log(`✅ Created ${Object.keys(shifts).length} shifts.`);
    // 6. Seed 18 Employees across departments
    const employeesData = [
        // Front Desk
        { firstName: 'Arthur', lastName: 'Pendelton', email: 'manager.frontdesk@noruhotel.com', phone: '+1-555-0101', hireDate: new Date('2023-01-15'), dept: 'Front Desk', role: 'Head Concierge', isManager: true },
        { firstName: 'Elena', lastName: 'Rostova', email: 'elena.r@hotelhrms.com', phone: '+1-555-0102', hireDate: new Date('2023-04-10'), dept: 'Front Desk', role: 'Front Desk Agent' },
        { firstName: 'Marcus', lastName: 'Vance', email: 'marcus.v@hotelhrms.com', phone: '+1-555-0103', hireDate: new Date('2024-02-01'), dept: 'Front Desk', role: 'Front Desk Agent' },
        { firstName: 'Chloe', lastName: 'Dupont', email: 'chloe.d@hotelhrms.com', phone: '+1-555-0104', hireDate: new Date('2024-06-15'), dept: 'Front Desk', role: 'Front Desk Agent' },
        // Housekeeping
        { firstName: 'Maria', lastName: 'Santos', email: 'manager.housekeeping@noruhotel.com', phone: '+1-555-0201', hireDate: new Date('2022-08-01'), dept: 'Housekeeping', role: 'Housekeeping Supervisor', isManager: true },
        { firstName: 'Rosa', lastName: 'Morales', email: 'rosa.m@hotelhrms.com', phone: '+1-555-0202', hireDate: new Date('2023-03-12'), dept: 'Housekeeping', role: 'Room Attendant' },
        { firstName: 'Javier', lastName: 'Gutierrez', email: 'javier.g@hotelhrms.com', phone: '+1-555-0203', hireDate: new Date('2023-09-05'), dept: 'Housekeeping', role: 'Room Attendant' },
        { firstName: 'Fatima', lastName: 'Al-Mansoor', email: 'fatima.m@hotelhrms.com', phone: '+1-555-0204', hireDate: new Date('2024-01-20'), dept: 'Housekeeping', role: 'Room Attendant' },
        { firstName: 'Liam', lastName: 'O’Connor', email: 'liam.o@hotelhrms.com', phone: '+1-555-0205', hireDate: new Date('2024-05-11'), dept: 'Housekeeping', role: 'Room Attendant' },
        // Kitchen & F&B
        { firstName: 'Laurent', lastName: 'Mercier', email: 'manager.kitchen@noruhotel.com', phone: '+1-555-0301', hireDate: new Date('2021-11-01'), dept: 'Kitchen & F&B', role: 'Head Chef', isManager: true },
        { firstName: 'Kenji', lastName: 'Takahashi', email: 'kenji.t@hotelhrms.com', phone: '+1-555-0302', hireDate: new Date('2023-02-14'), dept: 'Kitchen & F&B', role: 'Line Cook' },
        { firstName: 'Amara', lastName: 'Okafor', email: 'amara.o@hotelhrms.com', phone: '+1-555-0303', hireDate: new Date('2023-10-18'), dept: 'Kitchen & F&B', role: 'Line Cook' },
        { firstName: 'Siddharth', lastName: 'Patel', email: 'siddharth.p@hotelhrms.com', phone: '+1-555-0304', hireDate: new Date('2024-03-01'), dept: 'Kitchen & F&B', role: 'Line Cook' },
        { firstName: 'Sofia', lastName: 'Lindqvist', email: 'sofia.l@hotelhrms.com', phone: '+1-555-0305', hireDate: new Date('2024-07-01'), dept: 'Kitchen & F&B', role: 'Line Cook' },
        // Maintenance
        { firstName: 'David', lastName: 'Kowalski', email: 'manager.maintenance@noruhotel.com', phone: '+1-555-0401', hireDate: new Date('2022-05-20'), dept: 'Maintenance', role: 'Chief Engineer', isManager: true },
        { firstName: 'Carlos', lastName: 'Herrera', email: 'carlos.h@hotelhrms.com', phone: '+1-555-0402', hireDate: new Date('2023-06-15'), dept: 'Maintenance', role: 'Maintenance Technician' },
        { firstName: 'Nadia', lastName: 'Novak', email: 'nadia.n@hotelhrms.com', phone: '+1-555-0403', hireDate: new Date('2023-12-01'), dept: 'Maintenance', role: 'Maintenance Technician' },
        { firstName: 'Tariq', lastName: 'Zayed', email: 'tariq.z@hotelhrms.com', phone: '+1-555-0404', hireDate: new Date('2024-04-18'), dept: 'Maintenance', role: 'Maintenance Technician' },
    ];
    const createdEmployees = [];
    for (const emp of employeesData) {
        const created = await prisma_js_1.default.employee.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                phone: emp.phone,
                hireDate: emp.hireDate,
                status: client_1.EmployeeStatus.ACTIVE,
                departmentId: departments[emp.dept].id,
                roleId: roles[emp.role].id,
            },
        });
        // Create User account for employee
        const userRole = emp.isManager ? client_1.UserRole.MANAGER : client_1.UserRole.STAFF;
        const passwordHash = emp.isManager ? managerPasswordHash : staffPasswordHash;
        await prisma_js_1.default.user.create({
            data: {
                email: emp.email,
                passwordHash,
                role: userRole,
                mustChangePassword: false,
                employeeId: created.id,
            },
        });
        createdEmployees.push({ ...created, deptName: emp.dept });
    }
    console.log(`✅ Created ${createdEmployees.length} employees with linked User accounts.`);
    // 8. Generate 30 days of ShiftAssignments & Attendance records
    const today = new Date();
    const shiftKeys = ['Morning Shift', 'Evening Shift', 'Night Shift'];
    let totalAssignments = 0;
    let totalAttendance = 0;
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
        const currentDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - dayOffset));
        const dayOfWeek = currentDate.getUTCDay(); // 0 = Sun, 6 = Sat
        for (let i = 0; i < createdEmployees.length; i++) {
            const emp = createdEmployees[i];
            // Give each employee 2 rest days per week
            const isRestDay = (i + dayOfWeek) % 7 === 0 || (i + dayOfWeek) % 7 === 6;
            if (isRestDay)
                continue;
            // Assign rotating shifts
            const shiftIndex = (i + dayOffset) % 3;
            const shiftName = shiftKeys[shiftIndex];
            const shift = shifts[shiftName];
            // Create Shift Assignment
            const assignment = await prisma_js_1.default.shiftAssignment.create({
                data: {
                    employeeId: emp.id,
                    shiftId: shift.id,
                    date: currentDate,
                },
            });
            totalAssignments++;
            const seedRandom = ((emp.id * 31 + dayOffset * 17) % 100);
            let status = client_1.AttendanceStatus.PRESENT;
            let checkIn = null;
            let checkOut = null;
            const [startH, startM] = shift.startTime.split(':').map(Number);
            const [endH, endM] = shift.endTime.split(':').map(Number);
            if (seedRandom < 4) {
                status = client_1.AttendanceStatus.ON_LEAVE;
            }
            else if (seedRandom < 10) {
                status = client_1.AttendanceStatus.ABSENT;
            }
            else if (seedRandom < 22) {
                status = client_1.AttendanceStatus.LATE;
                const lateMinutes = 15 + ((emp.id + dayOffset) % 30);
                checkIn = new Date(currentDate);
                checkIn.setUTCHours(startH, startM + lateMinutes, 0);
                checkOut = new Date(currentDate);
                checkOut.setUTCHours(endH, endM, 0);
            }
            else {
                status = client_1.AttendanceStatus.PRESENT;
                const earlyOrOnTimeMins = ((emp.id + dayOffset) % 10) - 5;
                checkIn = new Date(currentDate);
                checkIn.setUTCHours(startH, startM + earlyOrOnTimeMins, 0);
                checkOut = new Date(currentDate);
                checkOut.setUTCHours(endH, endM, 0);
            }
            await prisma_js_1.default.attendance.create({
                data: {
                    employeeId: emp.id,
                    date: currentDate,
                    status,
                    checkIn,
                    checkOut,
                    shiftAssignmentId: assignment.id,
                },
            });
            totalAttendance++;
        }
    }
    console.log(`✅ Created ${totalAssignments} shift assignments and ${totalAttendance} attendance records.`);
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_js_1.default.$disconnect();
});
