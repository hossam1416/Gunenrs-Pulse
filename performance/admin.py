from django.contrib import admin
from .models import Player, MatchPerformance, PlayerPerformanceData


class MatchPerformanceInline(admin.TabularInline):
    model = MatchPerformance
    extra = 1
    fields = ["date", "opponent", "result", "score", "rating"]


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "number",
        "name",
        "position",
        "medical_status",
        "fitness_percentage",
        "market_value",
    )

    search_fields = ("name", "number")

    list_filter = ("position", "medical_status", "preferred_foot")

    fieldsets = (
        (
            "Basic Information (Perform-1)",
            {
                "fields": (
                    ("name", "number"),
                    ("position", "secondary_position"),
                    ("birth_date", "preferred_foot"),
                    ("height", "weight"),
                    "image_url",
                )
            },
        ),
        (
            "Contract & Medical",
            {
                "fields": (
                    ("contract_start", "contract_expiry"),
                    "market_value",
                    "trend",
                    "trend_type",
                    ("medical_status", "fitness_percentage"),
                )
            },
        ),
        (
            "Season Totals (Perform-2)",
            {
                "fields": (
                    ("matches_played", "games_started", "minutes_played"),
                    ("sub_in", "sub_out"),
                    ("goals", "assists"),
                    ("xg", "xa"),
                    ("conversion_rate", "shots"),
                    ("shots_on_target_pct", "shots_in_box", "shots_out_box"),
                    "free_kick_accuracy",
                    ("yellow_cards", "red_cards"),
                    ("fouls_committed", "fouls_suffered", "offsides"),
                )
            },
        ),
        (
            "Tactical & Physical (Perform-3)",
            {
                "fields": (
                    ("pass_accuracy", "key_passes"),
                    ("final_third_passes", "long_balls_accuracy", "through_balls"),
                    ("tackles_won", "interceptions"),
                    ("ball_recoveries", "blocked_shots", "clearances"),
                    ("total_duels_won", "aerial_duels_won", "ground_duels_won"),
                    ("dribbles_success", "distance_covered"),
                    ("top_speed", "sprints", "density"),
                )
            },
        ),
    )

    inlines = [MatchPerformanceInline]


@admin.register(MatchPerformance)
class MatchPerformanceAdmin(admin.ModelAdmin):
    list_display = ("player", "date", "opponent", "result", "rating")
    list_filter = ("result", "competition", "date")
    search_fields = ("player__name", "opponent")


@admin.register(PlayerPerformanceData)
class PlayerPerformanceDataAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")