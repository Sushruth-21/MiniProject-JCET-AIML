from rest_framework import serializers
from .models import Todo
from django.contrib.auth.models import User

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ['id', 'task_id', 'description', 'created_by_name', 'created_at', 'modified_by_name', 'modified_at', 'progression', 'modification_history']
