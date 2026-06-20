from django.urls import path
from . import views

urlpatterns = [
    path("basic/", views.perform_basic_info, name="basic"),
    path("stats/", views.perform_stats, name="stats"),
    path("tact/", views.perform_tactical, name="tact"),
    path("history/", views.perform_history, name="history"),

    path("player-performance/", views.player_performance, name="player_performance"),
]