import json
import uuid
from datetime import datetime
from pathlib import Path
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage
from .models import Todo

# Make sure settings is configured for STATIC_ROOT/MEDIA_ROOT
# In a real Django project, this would be in settings.py,
# but for this simple setup, we'll ensure MEDIA_ROOT exists.
# For simplicity, we are setting MEDIA_ROOT here. In a real project
# settings.py would define this.
if not hasattr(settings, 'MEDIA_ROOT'):
    settings.MEDIA_ROOT = Path(__file__).resolve().parent.parent / 'media'
    settings.MEDIA_URL = '/media/'
    os.makedirs(settings.MEDIA_ROOT / 'pfp', exist_ok=True)

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / 'db.json'

def get_db_data():
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def write_db_data(data):
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing to db.json: {e}")
        return False
    return True

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=400)

    db_data = get_db_data()
    users = db_data.get('users', [])

    for user in users:
        if user['username'] == username and user['password'] == password:
            # Get additional user details based on role
            user_details = {
                'message': 'Login successful',
                'role': user['role'],
                'name': user.get('name', username),
                'username': user['username']
            }
            
            # Add employee_id for employees
            if user['role'] == 'employee':
                db_data = get_db_data()
                for emp in db_data.get('employees', []):
                    if emp['email'] == user['username']:  # Match by email
                        user_details['employee_id'] = emp['employee_id']
                        user_details['email'] = emp['email']
                        break
            
            # Add hod_id for HODs
            elif user['role'] == 'HOD':
                db_data = get_db_data()
                for hod in db_data.get('hods', []):
                    if hod['email'] == user['username']:  # Match by email
                        user_details['hod_id'] = hod['hod_id']
                        user_details['email'] = hod['email']
                        break
            
            return Response(user_details)

    return Response({'error': 'Invalid credentials'}, status=401)


@api_view(['POST'])
def validate_id_view(request):
    role = request.data.get('role')
    id_value = request.data.get('id')
    
    if not role or not id_value:
        return Response({'error': 'Role and ID are required.'}, status=400)
    
    # Default IDs
    default_ids = {
        'HOD': 'hod123',
        'Principal': 'Principal123'
    }
    
    # Check against default IDs
    if id_value == default_ids.get(role):
        return Response({'valid': True, 'message': f'{role} ID validated successfully.'})
    
    # Check against registered HODs or Principals
    db_data = get_db_data()
    
    if role == 'HOD':
        hods = db_data.get('hods', [])
        for hod in hods:
            if hod.get('hod_id') == id_value:
                return Response({'valid': True, 'message': 'HOD ID validated successfully.'})
        return Response({'valid': False, 'message': 'Invalid HOD ID. Access denied.'}, status=401)
    
    elif role == 'Principal':
        # For now, only check default Principal ID
        # In future, you can add registered principal IDs
        return Response({'valid': False, 'message': 'Invalid Principal ID. Access denied.'}, status=401)
    
    return Response({'valid': False, 'message': 'Invalid role specified.'}, status=400)


@api_view(['POST'])
def register_view(request):
    name = request.data.get('name')
    email = request.data.get('email') # Using email as username
    password = request.data.get('password')
    dob = request.data.get('dob')
    pfp_file = request.FILES.get('pfp')

    if not name or not email or not password or not dob:
        return Response({'error': 'Name, Email, Password, and Date of Birth are required.'}, status=400)

    # Basic email format validation
    if '@' not in email or '.' not in email:
        return Response({'error': 'Invalid email format.'}, status=400)

    db_data = get_db_data()
    users = db_data.get('users', [])

    # Check if email is already registered
    for user in users:
        if user['email'] == email:
            return Response({'error': 'Email already registered.'}, status=400)

    pfp_path = None
    if pfp_file:
        pfp_filename = default_storage.save(os.path.join('pfp', f"{uuid.uuid4()}_{pfp_file.name}"), pfp_file)
        pfp_path = os.path.join(settings.MEDIA_URL, pfp_filename) # Store URL path

    new_user_id = str(uuid.uuid4()) # Unique ID for this user entry

    new_user = {
        'user_id': new_user_id, # A dedicated unique ID
        'username': email, # Using email as login username
        'password': password, # In a real app, hash this!
        'role': 'employee', # Default role for new registrations
        'name': name,
        'email': email,
        'dob': dob,
        'pfp': pfp_path
    }
    users.append(new_user)
    db_data['users'] = users # Update the users list in db_data

    # For simplicity, if role is employee, add to employees list too
    new_employee_entry = {
        'employee_id': new_user_id, # Link employee_id to user_id
        'email': email,
        'name': name, # Add name to employee entry
        'password': password,
        'assigned_hod': None # To be assigned later
    }
    db_data.setdefault('employees', []).append(new_employee_entry)


    try:
        write_db_data(db_data)
    except IOError as e:
        print(f"Error writing to db.json: {e}")
        return Response({'error': 'Failed to save data.'}, status=500)

    return Response({'message': 'Registration successful.', 'user': {'name': name, 'email': email, 'role': 'employee', 'employee_id': new_user_id}})


@api_view(['GET', 'POST'])
def admin_page_view(request):
    if request.method == 'GET':
        return Response({'message': 'Welcome to the Admin page. Please select a role.'})
    
    if request.method == 'POST':
        role = request.data.get('role')
        if role not in ['HOD', 'Principal']:
            return Response({'error': 'Invalid role selected.'}, status=400)
        
        return Response({'message': f'You have selected the {role} role.'})

@api_view(['GET', 'POST', 'DELETE', 'PUT'])
def hod_page_view(request):
    if request.method == 'GET':
        hod_email = request.query_params.get('hod_email')
        db_data = get_db_data()
        
        all_employees = db_data.get('employees', [])
        all_leave_requests = db_data.get('leave_requests', [])

        if hod_email:
            # Filter employees by assigned_hod
            filtered_employees = [emp for emp in all_employees if emp.get('assigned_hod') == hod_email]
            
            # Get IDs of filtered employees
            filtered_employee_ids = {emp['employee_id'] for emp in filtered_employees}

            # Filter leave requests for these employees
            filtered_leave_requests = [
                req for req in all_leave_requests 
                if req.get('status') == 'pending' and 
                   req.get('role') == 'employee' and
                   req.get('employee_id') in filtered_employee_ids
            ]
        else:
            # If no hod_email is provided, return all employees and all pending employee leave requests
            # (or an empty list depending on desired behavior for unauthenticated/unspecified HOD)
            # For now, let's return all employees and all pending employee leave requests
            filtered_employees = all_employees
            filtered_leave_requests = [req for req in all_leave_requests if req.get('status') == 'pending' and req.get('role') == 'employee']
            
        return Response({'employees': filtered_employees, 'leave_requests': filtered_leave_requests})

    if request.method == 'POST':
        # Logic for HOD to approve/reject leave requests
        request_id = request.data.get('request_id')
        status = request.data.get('status')
        if request_id and status and status in ['approved', 'rejected']:
            db_data = get_db_data()
            for req in db_data['leave_requests']:
                if req['request_id'] == request_id:
                    req['status'] = status
                    if status == 'approved':
                        db_data['notifications'].append({
                            'id': str(uuid.uuid4()),
                            'employee_id': req['employee_id'],
                            'message': f"✅ Your leave request (Reason: {req['reason']}) has been GRANTED.",
                            'timestamp': str(datetime.now()),
                            'read_status': False,
                            'type': 'leave_status_update',
                            'related_request_id': request_id
                        })
                    else:
                         db_data['notifications'].append({
                            'id': str(uuid.uuid4()),
                            'employee_id': req['employee_id'],
                            'message': f"❌ Your leave request (Reason: {req['reason']}) has been REFUSED.",
                            'timestamp': str(datetime.now()),
                            'read_status': False,
                            'type': 'leave_status_update',
                            'related_request_id': request_id
                        })

                    try:
                        write_db_data(db_data)
                    except IOError as e:
                        print(f"Error writing to db.json: {e}")
                        return Response({'error': 'Failed to save data.'}, status=500)
                    status_text = 'granted' if status == 'approved' else 'refused'
                    return Response({'message': f'Leave request {status_text} successfully.'})
            return Response({'error': 'Leave request not found.'}, status=404)



        return Response({'error': 'Invalid request for POST (no leave action or employee data).'}, status=400)




@api_view(['GET', 'POST', 'DELETE', 'PUT'])


def principal_page_view(request):


    if request.method == 'GET':


        db_data = get_db_data()


        hods = db_data.get('hods', [])


        employees = db_data.get('employees', [])


        hod_leave_requests = [req for req in db_data.get('leave_requests', []) if req.get('status') == 'pending' and req.get('role') == 'HOD']


        return Response({'hods': hods, 'employees': employees, 'hod_leave_requests': hod_leave_requests})


    


    if request.method == 'POST':


        # Logic for principal to approve/reject HOD leave requests


        request_id = request.data.get('request_id')


        status = request.data.get('status')


        if request_id and status and status in ['approved', 'rejected']:


            db_data = get_db_data()


            for req in db_data['leave_requests']:


                if req['request_id'] == request_id:


                    req['status'] = status


                    if status == 'approved':
                        db_data['notifications'].append({
                            'id': str(uuid.uuid4()),
                            'employee_id': req['employee_id'],
                            'message': f"✅ Your HOD leave request (Reason: {req['reason']}) has been GRANTED by Principal.",
                            'timestamp': str(datetime.now()),
                            'read_status': False,
                            'type': 'hod_leave_status_update',
                            'related_request_id': request_id
                        })
                    else:
                        db_data['notifications'].append({
                            'id': str(uuid.uuid4()),
                            'employee_id': req['employee_id'],
                            'message': f"❌ Your HOD leave request (Reason: {req['reason']}) has been REFUSED by Principal.",
                            'timestamp': str(datetime.now()),
                            'read_status': False,
                            'type': 'hod_leave_status_update',
                            'related_request_id': request_id
                        })


                    try:


                        write_db_data(db_data)


                    except IOError as e:


                        print(f"Error writing to db.json: {e}")


                        return Response({'error': 'Failed to save data.'}, status=500)


                    status_text = 'granted' if status == 'approved' else 'refused'
                    return Response({'message': f'Leave request {status_text} successfully.'})


            return Response({'error': 'Leave request not found.'}, status=404)





        # Logic for Principal to register HOD or Employee - THIS WILL BE REMOVED/REFACTORED LATER


        role_to_register = request.data.get('role')


        email = request.data.get('email')


        password = request.data.get('password')
        name = request.data.get('name')
        hod_id = request.data.get('hod_id')
        dob = request.data.get('dob')
        phone = request.data.get('phone')
        action = request.data.get('action')

        # Handle role promotion/demotion
        if action == 'promote_to_hod':
            employee_id = request.data.get('employee_id')
            db_data = get_db_data()
            employee_found = False
            for emp in db_data.get('employees', []):
                if emp['employee_id'] == employee_id:
                    emp_name = emp.get('name', '')
                    emp_email = emp.get('email', '')
                    employee_found = True
                    break
            
            if not employee_found:
                return Response({'error': 'Employee not found.'}, status=404)
            
            db_data['employees'] = [e for e in db_data['employees'] if e['employee_id'] != employee_id]
            
            new_hod_promo = {
                'hod_id': str(uuid.uuid4()),
                'name': emp_name,
                'email': emp_email,
                'password': 'default_pass',
                'dob': '',
                'phone': ''
            }
            db_data['hods'].append(new_hod_promo)
            
            for user in db_data['users']:
                if user['username'] == emp_email:
                    user['role'] = 'HOD'
                    break
            
            try:
                write_db_data(db_data)
            except IOError as e:
                print(f"Error writing to db.json: {e}")
                return Response({'error': 'Failed to save data.'}, status=500)
            return Response({'message': 'Employee promoted to HOD successfully.'})
        
        elif action == 'demote_to_employee':
            hod_id_to_demote = request.data.get('hod_id')
            db_data = get_db_data()
            hod_found = False
            for hod in db_data.get('hods', []):
                if hod['hod_id'] == hod_id_to_demote:
                    hod_name = hod.get('name', '')
                    hod_email = hod.get('email', '')
                    hod_password = hod.get('password', '')
                    hod_dob = hod.get('dob', '')
                    hod_phone = hod.get('phone', '')
                    hod_found = True
                    break
            
            if not hod_found:
                return Response({'error': 'HOD not found.'}, status=404)
            
            db_data['hods'] = [h for h in db_data['hods'] if h['hod_id'] != hod_id_to_demote]
            
            new_emp_demote = {
                'employee_id': str(uuid.uuid4()),
                'name': hod_name,
                'email': hod_email,
                'password': hod_password,
                'dob': hod_dob,
                'phone': hod_phone
            }
            db_data['employees'].append(new_emp_demote)
            
            for user in db_data['users']:
                if user['username'] == hod_email:
                    user['role'] = 'employee'
                    break
            
            try:
                write_db_data(db_data)
            except IOError as e:
                print(f"Error writing to db.json: {e}")
                return Response({'error': 'Failed to save data.'}, status=500)
            return Response({'message': 'HOD demoted to Employee successfully.'})





        if role_to_register and email and password:


            if role_to_register not in ['HOD', 'employee']:


                return Response({'error': 'Invalid role specified.'}, status=400)





            db_data = get_db_data()





            if role_to_register == 'HOD':


                for hod in db_data['hods']:


                    if hod['email'] == email:


                        return Response({'error': 'HOD with this email already exists.'}, status=400)


                


                new_hod = {


                    'hod_id': hod_id or str(uuid.uuid4()),

                    'name': name,

                    'email': email,

                    'password': password,

                    'dob': dob,

                    'phone': phone,

                }


                db_data['hods'].append(new_hod)


                db_data['users'].append({


                    'username': email,


                    'password': password,


                    'role': 'HOD',

                    'name': name

                })


                try:


                    write_db_data(db_data)


                except IOError as e:


                    print(f"Error writing to db.json: {e}")


                    return Response({'error': 'Failed to save data.'}, status=500)


                return Response({'message': 'HOD registered successfully.', 'hod': new_hod}, status=201)





            


        return Response({'error': 'Invalid request for POST (no leave action or user registration data).'}, status=400)


            


    if request.method == 'DELETE':


        role_to_remove = request.data.get('role')


        user_id = request.data.get('id')





        if not role_to_remove or not user_id:


            return Response({'error': 'Role and ID are required for removal.'}, status=400)


            


        if role_to_remove not in ['HOD', 'employee']:


            return Response({'error': 'Invalid role specified for removal.'}, status=400)





        db_data = get_db_data()


        


        if role_to_remove == 'HOD':


            hod_found = False


            for i, hod in enumerate(db_data['hods']):


                if hod['hod_id'] == user_id:


                    del db_data['hods'][i]


                    hod_found = True


                    for j, user in enumerate(db_data['users']):


                        if user['username'] == hod['email']:


                            del db_data['users'][j]


                            break


                    break


            


            if not hod_found:


                return Response({'error': 'HOD not found.'}, status=404)





        if role_to_remove == 'employee':


            employee_found = False


            for i, emp in enumerate(db_data['employees']):


                if emp['employee_id'] == user_id:


                    del db_data['employees'][i]


                    employee_found = True


                    for j, user in enumerate(db_data['users']):


                        if user['username'] == emp['email']:


                            del db_data['users'][j]


                            break


                    break


            


            if not employee_found:


                return Response({'error': 'Employee not found.'}, status=404)





        try:


            write_db_data(db_data)


        except IOError as e:


            print(f"Error writing to db.json: {e}")


            return Response({'error': 'Failed to save data.'}, status=500)


        return Response({'message': f'{role_to_remove} removed successfully.'})





    if request.method == 'PUT':


        role_to_edit = request.data.get('role')


        user_id = request.data.get('id')


        email = request.data.get('email')


        password = request.data.get('password')





        if not role_to_edit or not user_id:


            return Response({'error': 'Role and ID are required for editing.'}, status=400)





        if role_to_edit not in ['HOD', 'employee']:


            return Response({'error': 'Invalid role specified for editing.'}, status=400)


        


        db_data = get_db_data()


        updated_user = None





        if role_to_edit == 'HOD':


            for hod in db_data['hods']:


                if hod['hod_id'] == user_id:

                    if email:

                        # Check if new email already exists for another user

                        for other_hod in db_data['hods']:

                            if other_hod['hod_id'] != user_id and other_hod['email'] == email:

                                return Response({'error': 'Email already in use by another HOD.'}, status=400)

                        hod['email'] = email

                        for user in db_data['users']:

                            if user['role'] == 'HOD' and user['username'] == hod['email']:

                                user['username'] = email

                                break

                    if request.data.get('name'):
                        hod['name'] = request.data.get('name')

                    if request.data.get('dob'):
                        hod['dob'] = request.data.get('dob')

                    if request.data.get('phone'):
                        hod['phone'] = request.data.get('phone')

                    if password:

                        hod['password'] = password

                        for user in db_data['users']:

                            if user['role'] == 'HOD' and user['username'] == email:

                                user['password'] = password

                                break

                    updated_user = hod

                    break





        elif role_to_edit == 'employee':


            for emp in db_data['employees']:


                if emp['employee_id'] == user_id:


                    if email:


                        # Check if new email already exists for another user


                        for other_emp in db_data['employees']:


                            if other_emp['employee_id'] != user_id and other_emp['email'] == email:


                                return Response({'error': 'Email already in use by another employee.'}, status=400)


                        emp['email'] = email


                        for user in db_data['users']:


                            if user['role'] == 'employee' and user['username'] == emp['email']:


                                user['username'] = email


                                break

                    if request.data.get('name'):
                        emp['name'] = request.data.get('name')

                    if request.data.get('dob'):
                        emp['dob'] = request.data.get('dob')

                    if request.data.get('phone'):
                        emp['phone'] = request.data.get('phone')

                    if password:


                        emp['password'] = password


                        for user in db_data['users']:


                            if user['role'] == 'employee' and user['username'] == email:


                                user['password'] = password


                                break


                    updated_user = emp


                    break


        


        if not updated_user:


            return Response({'error': f'{role_to_edit} not found.'}, status=404)


        


        try:


            write_db_data(db_data)


        except IOError as e:


            print(f"Error writing to db.json: {e}")


            return Response({'error': 'Failed to save data.'}, status=500)


        return Response({'message': f'{role_to_edit} updated successfully.', role_to_edit: updated_user})


    


    return Response({'error': 'Invalid request method.'}, status=405)








@api_view(['POST'])
def add_employee_view(request):
    # Get HOD info from request headers or session
    hod_email = None
    if hasattr(request, 'headers') and 'X-HOD-Email' in request.headers:
        hod_email = request.headers['X-HOD-Email']
    # Alternative: check if there's a selected HOD in localStorage (for admin acting as HOD)
    # For now, we'll use a simpler approach - assign to first HOD if no specific HOD is specified
    
    email = request.data.get('email')
    password = request.data.get('password')
    employee_id = request.data.get('employee_id')
    name = request.data.get('name')
    dob = request.data.get('dob')
    phone = request.data.get('phone')
    hod_email = request.data.get('hod_email')  # HOD email for assignment





    if not email or not password or not name or not employee_id:
        return Response({'error': 'Email, password, name, and employee ID are required.'}, status=400)





    db_data = get_db_data()





    # Check for unique email


    for emp in db_data.get('employees', []):


        if emp['email'] == email:


            return Response({'error': 'Employee with this email already exists.'}, status=400)


    for user_entry in db_data.get('users', []):


        if user_entry['username'] == email:


            return Response({'error': 'A user with this email already exists (as employee, HOD, or admin).'}, status=400)





    # Check for unique employee_id (now mandatory)
    for emp in db_data.get('employees', []):
        if emp['employee_id'] == employee_id:
            return Response({'error': 'Employee with this ID already exists.'}, status=400)


        


    new_employee = {

        'employee_id': employee_id,

        'email': email,

        'password': password,

        'name': name,

        'dob': dob,

        'phone': phone,

        'assigned_hod': hod_email if hod_email else None,  # Assign to HOD if provided

    }


    db_data['employees'].append(new_employee)


    db_data['users'].append({

        'username': email,

        'password': password,

        'role': 'employee',

        'name': name

    })





    try:


        write_db_data(db_data)


    except IOError as e:


        print(f"Error writing to db.json: {e}")


        return Response({'error': 'Failed to save data.'}, status=500)


    return Response({'message': 'Employee registered successfully.', 'employee': new_employee}, status=201)








@api_view(['GET', 'POST'])


def leave_request_view(request):


    if request.method == 'GET':


        db_data = get_db_data()


        return Response({'leave_requests': db_data.get('leave_requests', [])})





    if request.method == 'POST':


        employee_id = request.data.get('employee_id') 


        reason = request.data.get('reason')


        role = request.data.get('role') 

        # For employees, look up employee_id from username/email if not provided
        if not employee_id and role == 'employee':
            username = request.data.get('username')  # Get username from request
            if username:
                db_data = get_db_data()
                # Find employee by email/username
                for emp in db_data.get('employees', []):
                    if emp.get('email') == username:
                        employee_id = emp.get('employee_id')
                        break





        if not employee_id or not reason or not role:


            return Response({'error': 'Employee ID, reason, and role are required.'}, status=400)





        db_data = get_db_data()


        new_request = {


            'request_id': str(uuid.uuid4()),


            'employee_id': employee_id,

            'start_date': request.data.get('start_date'),

            'end_date': request.data.get('end_date'),

            'reason': reason,


            'status': 'pending',


            'role': role


        }


        db_data['leave_requests'].append(new_request)


        try:


            write_db_data(db_data)


        except IOError as e:


            print(f"Error writing to db.json: {e}")


            return Response({'error': 'Failed to save data.'}, status=500)


        return Response({'message': 'Leave request submitted successfully.', 'request': new_request})





@api_view(['GET'])
def employee_page_view(request):
    return Response({'message': 'Welcome to the Employee page.'})

@api_view(['GET', 'POST', 'DELETE'])
def announcement_view(request):
    if request.method == 'GET':
        db_data = get_db_data()
        announcements = db_data.get('announcements', [])
        return Response({'announcements': announcements})

    if request.method == 'POST':
        title = request.data.get('title')
        content = request.data.get('content')
        created_by = request.data.get('created_by')
        created_by_role = request.data.get('created_by_role')
        
        if not title or not content:
            return Response({'error': 'Title and content are required.'}, status=400)

        db_data = get_db_data()
        new_announcement = {
            'announcement_id': str(uuid.uuid4()),
            'title': title,
            'content': content,
            'created_by': created_by or 'admin',
            'created_by_role': created_by_role or 'admin',
        }
        db_data['announcements'].append(new_announcement)
        try:
            write_db_data(db_data)
        except IOError as e:
            print(f"Error writing to db.json: {e}")
            return Response({'error': 'Failed to save data.'}, status=500)
        return Response({'message': 'Announcement created successfully.', 'announcement': new_announcement})

    if request.method == 'DELETE':
        announcement_id = request.data.get('announcement_id')
        if not announcement_id:
            return Response({'error': 'Announcement ID is required.'}, status=400)

        db_data = get_db_data()
        announcement_found = False
        for i, announcement in enumerate(db_data['announcements']):
            if announcement['announcement_id'] == announcement_id:
                del db_data['announcements'][i]
                announcement_found = True
                break
        
        if not announcement_found:
            return Response({'error': 'Announcement not found.'}, status=404)

        try:
            write_db_data(db_data)
        except IOError as e:
            print(f"Error writing to db.json: {e}")
            return Response({'error': 'Failed to save data.'}, status=500)
        return Response({'message': 'Announcement deleted successfully.'})

@api_view(['GET'])
def dashboard_view(request):
    db_data = get_db_data()
    total_employees = len(db_data.get('employees', []))
    on_leave_count = len([req for req in db_data.get('leave_requests', []) if req.get('status') == 'approved'])
    total_announcements = len(db_data.get('announcements', []))
    total_todos = Todo.objects.count()
    
    # Calculate actual attendance percentage
    attendance_records = db_data.get('attendance', [])
    if attendance_records:
        total_attendance_days = len(attendance_records)
        present_days = len([r for r in attendance_records if r.get('status') == 'present'])
        leave_days = len([r for r in attendance_records if r.get('status') == 'leave'])
        working_days = total_attendance_days - leave_days
        attendance_percentage = f"{round((present_days / working_days * 100), 1) if working_days > 0 else 0}%"
    else:
        attendance_percentage = "0%"

    dashboard_data = {
        'total_employees': total_employees,
        'on_leave_count': on_leave_count,
        'attendance_percentage': attendance_percentage,
        'total_announcements': total_announcements,
        'total_todos': total_todos,
    }
    return Response(dashboard_data)

@api_view(['POST'])
def logout_view(request):
    username = request.query_params.get('username') or request.data.get('username')
    
    try:
        if username:
            # Optional: Log the logout event
            print(f"User {username} logged out")
    except Exception as e:
        print(f"Logout logging error: {e}")
    
    return Response({'message': 'Logout successful.'})

@api_view(['GET'])
def welcome_view(request):
    return Response({'message': 'Welcome to the HRMS Backend API!'})

@api_view(['GET'])
def employees_view(request):
    db_data = get_db_data()
    employees = db_data.get('employees', [])
    return Response({'employees': employees})

def mark_absent_employees():
    """Automatically mark employees as absent for days they haven't marked attendance"""
    from datetime import date, timedelta
    
    db_data = get_db_data()
    attendance_records = db_data.get('attendance', [])
    users = db_data.get('users', [])
    
    # Get all employee users
    employee_users = [user for user in users if user.get('role') == 'employee']
    
    # Mark absent for yesterday and today if not already marked
    today = date.today()
    dates_to_check = [today, today - timedelta(days=1)]
    
    for employee in employee_users:
        employee_id = employee['username']
        
        for check_date in dates_to_check:
            date_str = check_date.strftime('%Y-%m-%d')
            
            # Check if attendance already exists for this date
            existing_record = None
            for record in attendance_records:
                if (record.get('employee_id') == employee_id and 
                    record.get('date') == date_str):
                    existing_record = record
                    break
            
            # If no record exists, mark as absent
            if not existing_record:
                absent_record = {
                    'id': str(uuid.uuid4()),
                    'employee_id': employee_id,
                    'date': date_str,
                    'status': 'absent',
                    'marked_at': str(datetime.now()),
                    'auto_marked': True
                }
                attendance_records.append(absent_record)
    
    # Update the database
    db_data['attendance'] = attendance_records
    try:
        write_db_data(db_data)
    except IOError as e:
        print(f"Error writing to db.json: {e}")

@api_view(['GET', 'POST'])
def attendance_view(request):
    # Auto-mark absent employees before processing any request
    mark_absent_employees()
    
    if request.method == 'GET':
        employee_id = request.query_params.get('employee_id')
        username = request.query_params.get('username')
        
        db_data = get_db_data()
        attendance_records = db_data.get('attendance', [])
        
        # If username is provided, look up employee_id
        if username and not employee_id:
            for emp in db_data.get('employees', []):
                if emp.get('email') == username:
                    employee_id = emp.get('employee_id')
                    break
        
        if employee_id:
            # Filter attendance for specific employee
            filtered_attendance = [record for record in attendance_records if record.get('employee_id') == employee_id]
            
            # Get employee details
            employee_details = None
            for emp in db_data.get('employees', []):
                if emp['employee_id'] == employee_id:
                    employee_details = emp
                    break
            
            # Calculate statistics for specific employee
            total_days = len(filtered_attendance)
            attended_days = len([r for r in filtered_attendance if r.get('status') == 'present'])
            leave_days = len([r for r in filtered_attendance if r.get('status') == 'leave'])
            absent_days = len([r for r in filtered_attendance if r.get('status') == 'absent'])
            
            # Calculate attendance percentage (excluding leave days)
            working_days = total_days - leave_days
            percentage = round((attended_days / working_days *100), 1) if working_days > 0 else 0
            
            stats = {
                'totalDays': total_days,
                'attendedDays': attended_days,
                'leaveDays': leave_days,
                'absentDays': absent_days,
                'percentage': percentage
            }
            
            return Response({
                'attendance': filtered_attendance, 
                'stats': stats,
                'employee': employee_details  # Include employee details
            })
        else:
            # Return all attendance records for admin
            return Response({'attendance': attendance_records})

    if request.method == 'POST':
        employee_id = request.data.get('employee_id')
        date = request.data.get('date')
        status = request.data.get('status', 'present')
        
        # For employees, look up employee_id from username/email if not provided
        if not employee_id:
            username = request.data.get('username')  # Get username from request
            if username:
                db_data = get_db_data()
                # Find employee by email/username
                for emp in db_data.get('employees', []):
                    if emp.get('email') == username:
                        employee_id = emp.get('employee_id')
                        break
        
        if not employee_id or not date:
            return Response({'error': 'Employee ID and date are required.'}, status=400)
        
        db_data = get_db_data()
        
        # Check if attendance for this date already exists
        existing_attendance = None
        for record in db_data.get('attendance', []):
            if record.get('employee_id') == employee_id and record.get('date') == date:
                existing_attendance = record
                break
        
        if existing_attendance:
            # If it's an auto-marked absent record, allow updating to present
            if existing_attendance.get('auto_marked') and existing_attendance.get('status') == 'absent':
                existing_attendance['status'] = status
                existing_attendance['marked_at'] = str(datetime.now())
                existing_attendance['auto_marked'] = False
                
                try:
                    write_db_data(db_data)
                except IOError as e:
                    print(f"Error writing to db.json: {e}")
                    return Response({'error': 'Failed to update attendance.'}, status=500)
                
                return Response({'message': 'Attendance marked successfully.', 'attendance': existing_attendance})
            else:
                return Response({'error': 'Attendance for this date already marked.'}, status=400)
        
        # Create new attendance record
        new_attendance = {
            'id': str(uuid.uuid4()),
            'employee_id': employee_id,
            'date': date,
            'status': status,
            'marked_at': str(datetime.now()),
            'auto_marked': False
        }
        
        db_data.setdefault('attendance', []).append(new_attendance)
        
        try:
            write_db_data(db_data)
        except IOError as e:
            print(f"Error writing to db.json: {e}")
            return Response({'error': 'Failed to save attendance.'}, status=500)
        
        return Response({'message': 'Attendance marked successfully.', 'attendance': new_attendance})

@api_view(['GET', 'POST'])
def notifications_view(request):
    if request.method == 'GET':
        employee_id = request.query_params.get('employee_id') # Assuming employee_id is passed as a query parameter
        if not employee_id:
            return Response({'error': 'Employee ID is required to fetch notifications.'}, status=400)
        
        db_data = get_db_data()
        employee_notifications = [notif for notif in db_data.get('notifications', []) if str(notif.get('employee_id')) == str(employee_id)]
        return Response({'notifications': employee_notifications})

    if request.method == 'POST':
        notification_id = request.data.get('notification_id')
        read_status = request.data.get('read_status') # Should be a boolean
        
        if not notification_id or read_status is None:
            return Response({'error': 'Notification ID and read_status are required.'}, status=400)
        
        db_data = get_db_data()
        notification_found = False
        for notif in db_data['notifications']:
            if notif['id'] == notification_id:
                notif['read_status'] = read_status
                notification_found = True
                break
        
        if not notification_found:
            return Response({'error': 'Notification not found.'}, status=404)
        
        try:
            write_db_data(db_data)
        except IOError as e:
            print(f"Error writing to db.json: {e}")
            return Response({'error': 'Failed to save data.'}, status=500)
        return Response({'message': 'Notification updated successfully.'})

from rest_framework import viewsets
from .models import Todo
from .serializers import TodoSerializer
from rest_framework.permissions import IsAuthenticated

class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    def perform_create(self, serializer):
        serializer.save(created_by_name=self.request.data.get('created_by_name', 'Unknown'))

    def perform_update(self, serializer):
        serializer.save(modified_by_name=self.request.data.get('modified_by_name', 'Unknown'))

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def todo_json_view(request, id=None):
    db_data = get_db_data()
    todos = db_data.get('Todo', [])
    
    if request.method == 'GET':
        return Response(todos)
    
    elif request.method == 'POST':
        try:
            new_todo = request.data
            new_todo['id'] = len(todos) + 1
            new_todo['created_at'] = str(datetime.now())
            new_todo['modified_at'] = str(datetime.now())
            new_todo['progression'] = 'pending'
            new_todo['modification_history'] = []
            
            todos.append(new_todo)
            write_db_data(db_data)
            return Response({'message': 'Todo created successfully.', 'todo': new_todo})
        except Exception as e:
            return Response({'error': f'Failed to create todo: {str(e)}'}, status=400)
    
    elif request.method == 'PUT':
        try:
            # Get ID from function parameter or URL parameter
            if id is not None:
                todo_id = int(id)
            else:
                todo_id = int(request.resolver_match.kwargs['id'])
            
            # Find todo by ID
            todo_found = False
            for i, todo in enumerate(todos):
                if todo['id'] == todo_id:
                    # Update todo with new data
                    todos[i] = {**todo, **request.data, 'modified_at': str(datetime.now()), 'modification_history': todo.get('modification_history', []) + [f"Modified at {datetime.now()}"]}
                    write_db_data(db_data)
                    return Response({'message': 'Todo updated successfully.', 'todo': todos[i]})
                    todo_found = True
                    break
            
            if not todo_found:
                return Response({'error': 'Todo not found.'}, status=404)
                
        except Exception as e:
            return Response({'error': f'Failed to update todo: {str(e)}'}, status=400)
    
    elif request.method == 'DELETE':
        try:
            # Get ID from function parameter or URL parameter
            if id is not None:
                todo_id = int(id)
            else:
                todo_id = int(request.query_params.get('id'))
            
            # Find todo by ID
            todo_found = False
            for i, todo in enumerate(todos):
                if todo['id'] == todo_id:
                    todos.pop(i)
                    write_db_data(db_data)
                    return Response({'message': 'Todo deleted successfully.'})
                    todo_found = True
                    break
            if not todo_found:
                return Response({'error': 'Todo not found.'}, status=404)
        except Exception as e:
            return Response({'error': f'Failed to delete todo: {str(e)}'}, status=400)
        except Exception as e:
            return Response({'error': f'Failed to delete todo: {str(e)}'}, status=400)
    
# Global departments storage (in production, this would be in a database)
# Initialize with default departments
departments_storage = [
    {'id': 1, 'name': 'Engineering', 'description': 'Software development and IT infrastructure'},
    {'id': 2, 'name': 'Human Resources', 'description': 'Employee management and welfare'},
    {'id': 3, 'name': 'Finance', 'description': 'Financial planning and accounting'},
    {'id': 4, 'name': 'Marketing', 'description': 'Brand management and customer outreach'},
    {'id': 5, 'name': 'Operations', 'description': 'Day-to-day business operations'}
]

def initialize_departments():
    """Initialize departments if they don't exist in the database"""
    global departments_storage
    try:
        db_data = get_db_data()
        if 'departments' not in db_data:
            db_data['departments'] = departments_storage.copy()
            write_db_data(db_data)
        else:
            # Load departments from database
            departments_storage = db_data.get('departments', departments_storage)
    except Exception as e:
        print(f"Error initializing departments: {e}")
        # Fallback to default departments
        pass

# Initialize departments on module import
initialize_departments()

@api_view(['GET', 'POST', 'DELETE'])
def departments_view(request):
    global departments_storage
    
    print(f"DEBUG: departments_view called with method: {request.method}")
    
    if request.method == 'GET':
        # Always load from database to get latest data
        db_data = get_db_data()
        print(f"DEBUG: Database data keys: {list(db_data.keys())}")
        departments_storage = db_data.get('departments', departments_storage)
        print(f"DEBUG: Returning departments: {departments_storage}")
        return Response({'departments': departments_storage})
    
    elif request.method == 'POST':
        name = request.data.get('name')
        description = request.data.get('description')
        
        if not name or not description:
            return Response({'error': 'Department name and description are required.'}, status=400)
        
        # Load current departments from database
        db_data = get_db_data()
        current_departments = db_data.get('departments', departments_storage)
        
        # Create new department with unique ID
        new_id = max([dept['id'] for dept in current_departments]) + 1 if current_departments else 1
        new_dept = {
            'id': new_id,
            'name': name,
            'description': description
        }
        
        # Add to storage and database
        current_departments.append(new_dept)
        db_data['departments'] = current_departments
        write_db_data(db_data)
        departments_storage = current_departments
        
        return Response({'message': 'Department created successfully.', 'department': new_dept})
    
    elif request.method == 'DELETE':
        dept_id = request.data.get('id')
        if not dept_id:
            return Response({'error': 'Department ID is required.'}, status=400)
        
        # Load current departments from database
        db_data = get_db_data()
        current_departments = db_data.get('departments', departments_storage)
        
        # Remove department from storage
        current_departments = [dept for dept in current_departments if dept['id'] != dept_id]
        db_data['departments'] = current_departments
        write_db_data(db_data)
        departments_storage = current_departments
        
        return Response({'message': 'Department deleted successfully.'})
    
    return Response({'error': 'Method not allowed.'}, status=405)



@api_view(['GET'])
def employee_management_view(request):
    """Get comprehensive employee data for admin management"""
    employee_id = request.query_params.get('employee_id')
    
    db_data = get_db_data()
    
    if employee_id:
        # Get specific employee data
        employee = None
        for emp in db_data.get('employees', []):
            if emp['employee_id'] == employee_id:
                employee = emp
                break
        
        if not employee:
            return Response({'error': 'Employee not found.'}, status=404)
        
        # Get employee's attendance records
        attendance_records = [record for record in db_data.get('attendance', []) 
                           if record.get('employee_id') == employee_id]
        
        # Get employee's leave requests
        leave_requests = [req for req in db_data.get('leave_requests', []) 
                        if req.get('employee_id') == employee_id]
        
        # Get user details for additional info
        user_details = None
        for user in db_data.get('users', []):
            if user.get('username') == employee.get('email'):
                user_details = user
                break
        
        # Calculate attendance statistics
        total_days = len(attendance_records)
        attended_days = len([r for r in attendance_records if r.get('status') == 'present'])
        leave_days = len([r for r in attendance_records if r.get('status') == 'leave'])
        absent_days = len([r for r in attendance_records if r.get('status') == 'absent'])
        working_days = total_days - leave_days
        attendance_percentage = round((attended_days / working_days * 100), 1) if working_days > 0 else 0
        
        return Response({
            'employee': employee,
            'user_details': user_details,
            'attendance': {
                'records': sorted(attendance_records, key=lambda x: x.get('date', ''), reverse=True),
                'stats': {
                    'total_days': total_days,
                    'attended_days': attended_days,
                    'leave_days': leave_days,
                    'absent_days': absent_days,
                    'attendance_percentage': attendance_percentage
                }
            },
            'leave_requests': sorted(leave_requests, key=lambda x: x.get('request_id', ''), reverse=True)
        })
    
    else:
        # Get all employees summary
        employees = db_data.get('employees', [])
        employees_summary = []
        
        for emp in employees:
            # Get attendance stats for each employee
            emp_attendance = [record for record in db_data.get('attendance', []) 
                            if record.get('employee_id') == emp['employee_id']]
            
            total_days = len(emp_attendance)
            attended_days = len([r for r in emp_attendance if r.get('status') == 'present'])
            leave_days = len([r for r in emp_attendance if r.get('status') == 'leave'])
            absent_days = len([r for r in emp_attendance if r.get('status') == 'absent'])
            working_days = total_days - leave_days
            attendance_percentage = round((attended_days / working_days * 100), 1) if working_days > 0 else 0
            
            # Get leave request count
            leave_count = len([req for req in db_data.get('leave_requests', []) 
                             if req.get('employee_id') == emp['employee_id']])
            
            employees_summary.append({
                'employee_id': emp['employee_id'],
                'name': emp.get('name', 'N/A'),
                'email': emp.get('email', 'N/A'),
                'phone': emp.get('phone', 'N/A'),
                'assigned_hod': emp.get('assigned_hod', 'N/A'),
                'attendance_stats': {
                    'total_days': total_days,
                    'attended_days': attended_days,
                    'leave_days': leave_days,
                    'absent_days': absent_days,
                    'attendance_percentage': attendance_percentage
                },
                'leave_requests_count': leave_count
            })
        
        return Response({'employees': employees_summary})

@api_view(['DELETE'])
def delete_employee_view(request):
    """Delete employee and corresponding user record"""
    employee_id = request.data.get('employee_id')
    
    if not employee_id:
        return Response({'error': 'Employee ID is required.'}, status=400)
    
    db_data = get_db_data()
    
    # Find and remove employee
    employee_found = False
    employee_email = None
    
    for emp in db_data.get('employees', []):
        if emp['employee_id'] == employee_id:
            employee_email = emp.get('email')
            db_data['employees'].remove(emp)
            employee_found = True
            break
    
    if not employee_found:
        return Response({'error': 'Employee not found.'}, status=404)
    
    # Remove corresponding user record
    user_found = False
    for user in db_data.get('users', []):
        if user.get('username') == employee_email:
            db_data['users'].remove(user)
            user_found = True
            break
    
    if not user_found:
        return Response({'error': 'User record not found for this employee.'}, status=404)
    
    try:
        write_db_data(db_data)
    except IOError as e:
        print(f"Error writing to db.json: {e}")
        return Response({'error': 'Failed to save data.'}, status=500)
    
    return Response({'message': 'Employee deleted successfully.'})

@api_view(['PUT', 'POST'])
def update_employee_view(request):
    """Update employee details"""
    employee_id = request.data.get('employee_id')
    name = request.data.get('name')
    email = request.data.get('email')
    password = request.data.get('password')
    phone = request.data.get('phone')
    dob = request.data.get('dob')
    assigned_hod = request.data.get('assigned_hod')
    department = request.data.get('department')
    
    if not employee_id:
        return Response({'error': 'Employee ID is required.'}, status=400)
    
    db_data = get_db_data()
    
    # Find and update employee
    employee_found = False
    old_email = None
    
    for emp in db_data.get('employees', []):
        if emp['employee_id'] == employee_id:
            old_email = emp.get('email')
            
            # Check if new email already exists for another employee
            if email and email != old_email:
                for other_emp in db_data.get('employees', []):
                    if other_emp['employee_id'] != employee_id and other_emp.get('email') == email:
                        return Response({'error': 'Email already in use by another employee.'}, status=400)
            
            # Update employee fields
            if name:
                emp['name'] = name
            if email:
                emp['email'] = email
            if password:
                emp['password'] = password
            if phone:
                emp['phone'] = phone
            if dob:
                emp['dob'] = dob
            if assigned_hod is not None:
                emp['assigned_hod'] = assigned_hod
            if department is not None:
                emp['department'] = department
                # Also update assigned_hod to match department for consistency
                emp['assigned_hod'] = department
            
            # Save to database
            write_db_data(db_data)
            
            employee_found = True
            break
    
    if not employee_found:
        return Response({'error': 'Employee not found.'}, status=404)
    
    # Update corresponding user record
    user_found = False
    for user in db_data.get('users', []):
        if user.get('username') == old_email:
            # Update user fields
            if email:
                user['username'] = email
                user['email'] = email
            if password:
                user['password'] = password
            if name:
                user['name'] = name
            
            user_found = True
            break
    
    if not user_found:
        return Response({'error': 'User record not found for this employee.'}, status=404)
    
    try:
        write_db_data(db_data)
    except IOError as e:
        print(f"Error writing to db.json: {e}")
        return Response({'error': 'Failed to save data.'}, status=500)
    
    return Response({'message': 'Employee updated successfully.'})