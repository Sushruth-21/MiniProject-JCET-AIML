from django.db import models
from django.contrib.auth.models import User

class Todo(models.Model):
    task_id = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    created_by = models.ForeignKey(User, related_name='todos_created', on_delete=models.CASCADE, null=True, blank=True)
    created_by_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_by = models.ForeignKey(User, related_name='todos_modified', on_delete=models.CASCADE, null=True, blank=True)
    modified_by_name = models.CharField(max_length=255, null=True, blank=True)
    modification_history = models.JSONField(default=list, blank=True)
    modified_at = models.DateTimeField(auto_now=True)
    PROGRESSION_CHOICES = [
        ('completed', 'Completed'),
        ('in_process', 'In Process'),
        ('pending', 'Pending'),
    ]
    progression = models.CharField(
        max_length=20,
        choices=PROGRESSION_CHOICES,
        default='pending',
    )

    def __str__(self):
        return self.description

