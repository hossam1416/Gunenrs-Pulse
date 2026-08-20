from django.urls import path
from . import views

urlpatterns = [
    # ... روابطك القديمة ...
    path('medical/', views.medical_center, name='medical_center'),
    path('medical/add/', views.add_injury, name='medical_add'),
    path('medical/update/', views.update_injury, name='medical_update'),
]
