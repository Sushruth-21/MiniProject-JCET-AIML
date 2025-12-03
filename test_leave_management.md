# Leave Request Management Test Plan

## Test Cases

### 1. Admin Access to Leave Management
1. Login as admin (admin/admin)
2. Navigate to Admin Dashboard
3. Select "Manage HOD" role and enter ID "hod123"
4. Click on "Leave Management" in sidebar
5. **Expected**: Should see all leave requests with color-coded status

### 2. Status Color Verification
- **Granted/Approved**: Should appear as Green
- **Refused/Rejected**: Should appear as Red  
- **Pending**: Should appear as Yellow

### 3. Status Change Functionality
1. Find a pending leave request
2. Change status from dropdown to "Granted"
3. **Expected**: 
   - Status should immediately update to green
   - Success message should appear
   - Notification should be created for the employee

### 4. Employee Notification Verification
1. Login as employee (employee/employee)
2. Check Employee Dashboard
3. **Expected**: Should see notification about leave request status change

### 5. Filter Functionality
1. Click on filter buttons (All, Pending, Granted, Refused)
2. **Expected**: Table should show only filtered requests with correct counts

### 6. Summary Statistics
1. Check summary cards at bottom
2. **Expected**: Numbers should match actual request counts

## Current Database State
- Total leave requests: 4
- Pending: 3
- Approved: 1
- Rejected: 0

## API Endpoints Used
- GET `/api/leave-request/` - Fetch all leave requests
- POST `/api/hod/` - Update leave request status
- GET `/api/notifications/?employee_id={id}` - Get employee notifications

## Features Implemented
✅ Color-coded status display (Green/Red/Yellow)
✅ Real-time status updates
✅ Notification system for employees
✅ Filter functionality
✅ Summary statistics
✅ Responsive design with ResizableBox
✅ Role-based access control
✅ Professional UI with hover effects