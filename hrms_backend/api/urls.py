from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'todos', views.TodoViewSet, basename='todo')

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('admin/', views.admin_page_view, name='admin_page'),
    path('validate-id/', views.validate_id_view, name='validate_id'),
    path('hod/', views.hod_page_view, name='hod_page'),
    path('principal/', views.principal_page_view, name='principal_page'),
    path('employee/', views.employee_page_view, name='employee_page'),
    path('leave-request/', views.leave_request_view, name='leave_request'),
    path('leave-request-action/', views.hod_page_view, name='leave_request_action'),
    path('announcements/', views.announcement_view, name='announcements'),
    path('todos-json/', views.todo_json_view, name='todo-json'),
    path('todos-json/<int:id>/', views.todo_json_view, name='todo-json-detail'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('employees/', views.employees_view, name='employees'),
    path('employees/add/', views.add_employee_view, name='add_employee'),
    path('attendance/', views.attendance_view, name='attendance'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('departments/', views.departments_view, name='departments'),
    path('employee-management/', views.employee_management_view, name='employee_management'),
    path('delete-employee/', views.delete_employee_view, name='delete_employee'),
    path('update-employee/', views.update_employee_view, name='update_employee'),
    path('', include(router.urls)),
]
