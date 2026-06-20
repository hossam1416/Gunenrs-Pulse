from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Player(models.Model):
    # ─────────────────────────────────────────────
    # Perform-1: Basic Info
    # ─────────────────────────────────────────────
    name = models.CharField(max_length=100, verbose_name="Player Name")
    number = models.PositiveIntegerField(unique=True)

    POSITION_CHOICES = [
        ("GK", "Goalkeeper"),
        ("DEF", "Defender"),
        ("MID", "Midfielder"),
        ("FWD", "Forward"),
    ]

    position = models.CharField(max_length=3, choices=POSITION_CHOICES)
    secondary_position = models.CharField(
        max_length=50,
        blank=True,
        default="—",
    )

    birth_date = models.DateField()
    height = models.PositiveIntegerField(help_text="Height in cm")
    weight = models.PositiveIntegerField(help_text="Weight in kg")

    FOOT_CHOICES = [
        ("Left", "Left"),
        ("Right", "Right"),
        ("Both", "Both"),
    ]

    preferred_foot = models.CharField(max_length=10, choices=FOOT_CHOICES)

    market_value = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Market value in million Euro, e.g. 35.00 means €35m",
    )

    trend = models.CharField(max_length=20, default="€0", blank=True)

    TREND_CHOICES = [
        ("up", "Up"),
        ("down", "Down"),
        ("neutral", "Neutral"),
    ]

    trend_type = models.CharField(
        max_length=10,
        choices=TREND_CHOICES,
        default="neutral",
    )

    contract_start = models.DateField()
    contract_expiry = models.DateField()

    fitness_percentage = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    MEDICAL_CHOICES = [
        ("fit", "Fit"),
        ("injured", "Injured"),
    ]

    medical_status = models.CharField(
        max_length=20,
        choices=MEDICAL_CHOICES,
        default="fit",
    )

    image = models.ImageField(
        upload_to="players/",
        blank=True,
        null=True,
    )

    image_url = models.CharField(
        max_length=255,
        blank=True,
        default="/static/images/white_gun.jpg",
        help_text="Static image path from JSON, e.g. /static/images/raya.jpg",
    )

    # ─────────────────────────────────────────────
    # Perform-2: Performance Stats
    # ─────────────────────────────────────────────
    matches_played = models.PositiveIntegerField(default=0)
    games_started = models.PositiveIntegerField(default=0)
    minutes_played = models.PositiveIntegerField(default=0)

    sub_in = models.PositiveIntegerField(default=0)
    sub_out = models.PositiveIntegerField(default=0)

    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)

    xg = models.FloatField(default=0.0, verbose_name="Expected Goals")
    xa = models.FloatField(default=0.0, verbose_name="Expected Assists")

    conversion_rate = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    shots = models.PositiveIntegerField(default=0)

    shots_on_target_pct = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    shots_in_box = models.PositiveIntegerField(default=0)
    shots_out_box = models.PositiveIntegerField(default=0)

    free_kick_accuracy = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    yellow_cards = models.PositiveIntegerField(default=0)
    red_cards = models.PositiveIntegerField(default=0)

    fouls_committed = models.PositiveIntegerField(default=0)
    fouls_suffered = models.PositiveIntegerField(default=0)
    offsides = models.PositiveIntegerField(default=0)

    # ─────────────────────────────────────────────
    # Perform-3: Tactical Analysis
    # ─────────────────────────────────────────────
    pass_accuracy = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    key_passes = models.FloatField(default=0.0)
    final_third_passes = models.PositiveIntegerField(default=0)

    long_balls_accuracy = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    through_balls = models.PositiveIntegerField(default=0)

    tackles_won = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    interceptions = models.FloatField(default=0.0)
    ball_recoveries = models.FloatField(default=0.0)
    blocked_shots = models.FloatField(default=0.0)
    clearances = models.FloatField(default=0.0)

    total_duels_won = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    aerial_duels_won = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    ground_duels_won = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    dribbles_success = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    distance_covered = models.FloatField(
        default=0.0,
        help_text="km per match average",
    )

    sprints = models.PositiveIntegerField(default=0)

    top_speed = models.FloatField(
        default=0.0,
        help_text="km/h",
    )

    density = models.PositiveIntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    class Meta:
        ordering = ["number"]
        verbose_name = "Player"
        verbose_name_plural = "Players"

    def __str__(self):
        return f"{self.number} - {self.name}"

    @property
    def age(self):
        import datetime

        today = datetime.date.today()

        return (
            today.year
            - self.birth_date.year
            - (
                (today.month, today.day)
                < (self.birth_date.month, self.birth_date.day)
            )
        )


class MatchPerformance(models.Model):
    # ─────────────────────────────────────────────
    # Perform-4: Match History
    # ─────────────────────────────────────────────
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="match_history",
    )

    date = models.DateField()
    opponent = models.CharField(max_length=100)
    competition = models.CharField(max_length=100, default="Premier League")

    HOME_AWAY_CHOICES = [
        (True, "Home"),
        (False, "Away"),
    ]

    home = models.BooleanField(default=True, choices=HOME_AWAY_CHOICES)

    RESULT_CHOICES = [
        ("W", "Win"),
        ("D", "Draw"),
        ("L", "Loss"),
    ]

    result = models.CharField(max_length=1, choices=RESULT_CHOICES)
    score = models.CharField(max_length=10, help_text="e.g. 2-1")

    minutes_played = models.PositiveIntegerField(default=0)
    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)

    CARD_CHOICES = [
        ("None", "None"),
        ("Yellow", "Yellow"),
        ("Red", "Red"),
    ]

    card = models.CharField(
        max_length=20,
        choices=CARD_CHOICES,
        default="None",
    )

    rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )

    distance_km = models.FloatField(default=0.0)

    # GK
    saves = models.PositiveIntegerField(default=0)
    punches = models.PositiveIntegerField(default=0)

    # DEF
    tackles = models.PositiveIntegerField(default=0)
    clearances = models.PositiveIntegerField(default=0)

    # MID
    chances_created = models.PositiveIntegerField(default=0)
    interceptions = models.PositiveIntegerField(default=0)

    # FWD
    shots = models.PositiveIntegerField(default=0)
    dribbles = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Match Performance"
        verbose_name_plural = "Match Performances"

    def __str__(self):
        return f"{self.player.name} vs {self.opponent} ({self.date})"


class PlayerPerformanceData(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Data Name",
    )

    data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Performance JSON Data",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Player Performance Data"
        verbose_name_plural = "Player Performance Data"

    def __str__(self):
        return self.name