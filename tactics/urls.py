from django.urls import path
from . import views

urlpatterns = [
    path("tactics/", views.tactics_page, name="tactics_page"),
    path("player-tactics/", views.player_tactics_page, name="player_tactics"),
    path(
        "js/tactics-data-player.js",
        views.dynamic_tactics_js,
        name="dynamic_tactics_js",
    ),
]