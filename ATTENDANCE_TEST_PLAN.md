# Attendance System Test Plan

## 🧪 Test Cases

### 1. Employee Dashboard - Attendance Statistics
**Steps:**
1. Login as employee (employee/employee)
2. Navigate to Employee Dashboard
3. **Expected**: Should see attendance statistics cards
   - Total Days: 0 (initially)
   - Attended Days: 0
   - Leave Days: 0
   - Attendance %: 0%

### 2. Mark Attendance
**Steps:**
1. Click on "Mark Attendance" in sidebar
2. Click "Mark Attendance" button
3. **Expected**: 
   - Success message appears
   - Button changes to "✓ Already Marked"
   - Attendance record created

### 3. Attendance History
**Steps:**
1. In Attendance System page, scroll to history table
2. **Expected**: Should see today's attendance with "Present" status
   - Date: Today's date
   - Status: ✅ Present
   - Marked At: Current time

### 4. Duplicate Prevention
**Steps:**
1. Try to mark attendance again on same day
2. **Expected**: Error message "Attendance for this date already marked"

### 5. Leave Request Page
**Steps:**
1. Click on "Leave Request" in sidebar
2. Fill out leave request form
3. Submit request
4. **Expected**: 
   - Success message
   - Request appears in history table
   - Status shows as "Pending"

### 6. Employee Dashboard - Notifications
**Steps:**
1. After admin approves/rejects leave request
2. Check Employee Dashboard notifications
3. **Expected**: Should see notification with:
   - ✅/❌ emoji indicating status
   - Clear message about leave request
   - "Mark as Read" button

### 7. Statistics Update
**Steps:**
1. Mark attendance for multiple days
2. Check Employee Dashboard statistics
3. **Expected**: 
   - Total Days increases
   - Attended Days increases
   - Percentage updates correctly

## 🔧 API Endpoints to Test

### Attendance API:
- **GET** `/api/attendance/?employee_id=employee`
  - Should return attendance records and statistics
- **POST** `/api/attendance/`
  - Should create new attendance record
  - Body: `{"employee_id": "employee", "date": "2025-12-01", "status": "present"}`

### Leave Request API:
- **GET** `/api/leave-request/`
  - Should return all leave requests
- **POST** `/api/leave-request/`
  - Should create new leave request
  - Body: `{"employee_id": "employee", "start_date": "2025-12-02", "end_date": "2025-12-03", "reason": "Test", "role": "employee"}`

### Notifications API:
- **GET** `/api/notifications/?employee_id=employee`
  - Should return employee notifications
- **POST** `/api/notifications/`
  - Should mark notification as read
  - Body: `{"notification_id": "uuid", "read_status": true}`

## 📊 Expected Database Structure

### Attendance Records:
```json
{
  "id": "uuid",
  "employee_id": "employee",
  "date": "2025-12-01",
  "status": "present",
  "marked_at": "2025-12-01 10:30:00"
}
```

### Statistics Calculation:
- **Working Days** = Total Days - Leave Days
- **Attendance %** = (Attended Days / Working Days) × 100
- **Example**: 20 total days, 2 leave days, 18 attended days
  - Working Days = 20 - 2 = 18
  - Attendance % = (18 / 18) × 100 = 100%

## 🎯 Success Criteria

✅ **Functional Requirements:**
- Employees can mark daily attendance
- Attendance statistics display correctly
- Leave requests work through dedicated page
- Notifications appear for status changes
- Duplicate attendance is prevented

✅ **UI/UX Requirements:**
- Clean, professional interface
- Responsive design works on mobile
- Color-coded status indicators
- Smooth transitions and hover effects

✅ **Technical Requirements:**
- API endpoints respond correctly
- Data persists in database
- Error handling works properly
- Role-based access control enforced

## 🚀 Ready for Testing

The attendance system is now fully implemented and ready for testing. All components, API endpoints, and database structures are in place to provide a complete attendance and leave management experience for employees.