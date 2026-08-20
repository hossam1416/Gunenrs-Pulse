from django.urls import path
from . import views

urlpatterns = [
    path('compare/', views.compare_players, name='compare_players'),
]