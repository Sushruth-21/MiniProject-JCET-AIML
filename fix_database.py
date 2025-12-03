#!/usr/bin/env python3
"""
Script to fix database records and ensure proper separation of username, email, and employee_id
"""

import json
import uuid

def fix_database():
    """Fix database to have proper user-employee relationships"""
    
    with open('hrms_backend/db.json', 'r') as f:
        db_data = json.load(f)
    
    users = db_data.get('users', [])
    employees = db_data.get('employees', [])
    
    print("Current database state:")
    print(f"Users: {len(users)}")
    print(f"Employees: {len(employees)}")
    
    # Find users that don't have corresponding employee records
    users_to_add = []
    
    for user in users:
        if user['role'] == 'employee':
            # Check if user has corresponding employee record
            has_employee = False
            for emp in employees:
                if emp.get('email') == user.get('username'):
                    has_employee = True
                    break
            
            if not has_employee:
                users_to_add.append(user)
                print(f"Missing employee record for user: {user['username']}")
    
    # Add missing employee records
    for user in users_to_add:
        new_employee = {
            'employee_id': str(uuid.uuid4()),
            'email': user['username'],
            'password': user['password'],
            'name': user.get('name', user['username'].split('@')[0]),
            'dob': '',
            'phone': '',
            'assigned_hod': None
        }
        employees.append(new_employee)
        print(f"Added employee record for {user['username']} with employee_id: {new_employee['employee_id']}")
    
    # Update database
    db_data['employees'] = employees
    
    with open('hrms_backend/db.json', 'w') as f:
        json.dump(db_data, f, indent=2)
    
    print(f"\nUpdated database:")
    print(f"Users: {len(users)}")
    print(f"Employees: {len(employees)}")
    print("Database fixed successfully!")

if __name__ == "__main__":
    fix_database()