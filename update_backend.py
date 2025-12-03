#!/usr/bin/env python3
import re

filePath = r"D:\Projects\MiniProj\Trail 2\hrms_backend\api\views.py"

with open(filePath, 'r') as f:
    content = f.read()

# First replacement: Update function signature
old_sig = """def add_employee_view(request):


    email = request.data.get('email')


    password = request.data.get('password')


    employee_id = request.data.get('employee_id')




    if not email or not password:


        return Response({'error': 'Email and password are required.'}, status=400)"""

new_sig = """def add_employee_view(request):

    email = request.data.get('email')
    password = request.data.get('password')
    employee_id = request.data.get('employee_id')
    name = request.data.get('name')
    dob = request.data.get('dob')
    phone = request.data.get('phone')

    if not email or not password or not name:
        return Response({'error': 'Email, password, and name are required.'}, status=400)"""

content = content.replace(old_sig, new_sig)

# Second replacement: Update employee object
old_emp = """    new_employee = {


        'employee_id': employee_id,


        'email': email,


        'password': password, # In a real app, hash this!


    }"""

new_emp = """    new_employee = {

        'employee_id': employee_id,

        'email': email,

        'password': password,

        'name': name,

        'dob': dob or None,

        'phone': phone or None,

    }"""

content = content.replace(old_emp, new_emp)

# Third replacement: Update users list append
old_users = """    db_data['users'].append({


        'username': email,


        'password': password,


        'role': 'employee'


    })"""

new_users = """    db_data['users'].append({

        'username': email,

        'password': password,

        'role': 'employee',

        'name': name

    })"""

content = content.replace(old_users, new_users)

with open(filePath, 'w') as f:
    f.write(content)

print("Backend updated successfully!")
