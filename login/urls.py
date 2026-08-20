from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("player-login/", views.player_login_view, name="player_login"),
    path("logout/", views.custom_logout, name="logout"),
]