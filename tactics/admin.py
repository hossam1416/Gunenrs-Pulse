from django.contrib import admin

from .models import (
    Team,
    Coach,
    Player,
    PlayerAttribute,
    PerformanceStat,
    InjuryHistory,
    AIInsight,
    PlayerTacticsData,
)


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "number",
        "primary",
        "posGroup",
        "nationality",
        "age",
        "fitness",
    )

    search_fields = (
        "name",
        "number",
        "nationality",
    )

    list_filter = (
        "posGroup",
        "primary",
        "nationality",
    )

    ordering = ("number",)


@admin.register(PlayerAttribute)
class PlayerAttributeAdmin(admin.ModelAdmin):
    list_display = (
        "player",
        "pace",
        "shooting",
        "passing",
        "dribbling",
        "defending",
        "physical",
    )

    search_fields = (
        "player__name",
    )


@admin.register(PerformanceStat)
class PerformanceStatAdmin(admin.ModelAdmin):
    list_display = (
        "player",
        "matches_played",
        "goals",
        "assists",
        "expected_goals_xg",
    )

    search_fields = (
        "player__name",
    )

    ordering = ("-goals",)


@admin.register(InjuryHistory)
class InjuryHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "player",
        "injury_type",
        "status",
        "days_out",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "player__name",
        "injury_type",
    )


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = (
        "player",
        "risk_level",
    )

    list_filter = (
        "risk_level",
    )

    search_fields = (
        "player__name",
    )


@admin.register(PlayerTacticsData)
class PlayerTacticsDataAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "name",
    )

    search_fields = (
        "name",
    )


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "team",
    )

    search_fields = (
        "name",
        "team__name",
    )

    list_filter = (
        "team",
    )