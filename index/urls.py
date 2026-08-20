from django.urls import path
from . import views

urlpatterns = [
    path("home/", views.home_view, name="home"),
    path("player-home/", views.player_home_view, name="player_home"),
]