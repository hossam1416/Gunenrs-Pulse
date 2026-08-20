from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date


class Player(models.Model):
    POSITION_CHOICES = [
        ("GK", "Goalkeeper"),
        ("DEF", "Defender"),
        ("MID", "Midfielder"),
        ("FWD", "Forward"),
    ]

    FOOT_CHOICES = [
        ("Left", "Left"),
        ("Right", "Right"),
        ("Both", "Both"),
    ]

    MEDICAL_STATUS_CHOICES = [
        ("fit", "Fit"),
        ("injured", "Injured"),
        ("doubtful", "Doubtful"),
        ("rehab", "Rehab"),
    ]

    # =========================
    # Basic Info
    # =========================
    name = models.CharField(
        max_length=100,
        verbose_name="Player Name"
    )

    number = models.PositiveIntegerField(
        unique=True,
        verbose_name="Shirt Number"
    )

    image = models.ImageField(
        upload_to="players_images/",
        null=True,
        blank=True,
        verbose_name="Player Image",
        help_text="ارفع صورة اللاعب من Django Admin إذا أردت استبدال صورة static."
    )

    static_image = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="مسار الصورة القادمة من JSON مثل: /static/images/raya.jpg"
    )

    position = models.CharField(
        max_length=3,
        choices=POSITION_CHOICES,
        verbose_name="Main Position"
    )

    secondary_position = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Secondary Position"
    )

    birth_date = models.DateField(
        verbose_name="Birth Date"
    )

    height = models.PositiveIntegerField(
        help_text="Height in cm"
    )

    weight = models.PositiveIntegerField(
        help_text="Weight in kg"
    )

    preferred_foot = models.CharField(
        max_length=10,
        choices=FOOT_CHOICES,
        verbose_name="Preferred Foot"
    )

    market_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Value in million Euro, example: 35.00"
    )

    contract_start = models.DateField(
        verbose_name="Contract Start"
    )

    contract_expiry = models.DateField(
        verbose_name="Contract Expiry"
    )

    # =========================
    # Medical Center
    # =========================
    fitness_percentage = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Fitness percentage from 0 to 100"
    )

    medical_status = models.CharField(
        max_length=20,
        choices=MEDICAL_STATUS_CHOICES,
        default="fit",
        verbose_name="Medical Status"
    )

    injury_meta = models.JSONField(
        null=True,
        blank=True,
        help_text="تفاصيل الإصابة بصيغة JSON لصفحة Medical Center"
    )

    # =========================
    # Performance Stats
    # =========================
    goals = models.PositiveIntegerField(default=0)

    assists = models.PositiveIntegerField(default=0)

    matches_played = models.PositiveIntegerField(default=0)

    minutes_played = models.PositiveIntegerField(default=0)

    yellow_cards = models.PositiveIntegerField(default=0)

    red_cards = models.PositiveIntegerField(default=0)

    shots_on_target_pct = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Shots on target percentage"
    )

    # =========================
    # Tactical Stats
    # =========================
    pass_accuracy = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Pass accuracy percentage"
    )

    key_passes = models.PositiveIntegerField(default=0)

    interceptions = models.PositiveIntegerField(default=0)

    tackles_won = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Tackles won percentage"
    )

    top_speed = models.FloatField(
        default=0.0,
        help_text="Top speed in km/h"
    )

    distance_covered = models.FloatField(
        default=0.0,
        help_text="Average distance covered per match in km"
    )

    sprints = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["number"]
        verbose_name = "Player"
        verbose_name_plural = "Players"

    def __str__(self):
        return f"{self.number} - {self.name}"

    @property
    def age(self):
        today = date.today()
        return (
            today.year
            - self.birth_date.year
            - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        )

    @property
    def image_url(self):
        """
        هذا property اختياري ومفيد:
        يرجع صورة اللاعب بالترتيب:
        1. صورة مرفوعة من admin
        2. صورة static من JSON
        3. صورة افتراضية
        """
        image_value = str(self.image).strip() if self.image else ""

        if image_value and image_value != "players_images/white_gun.jpg":
            return self.image.url

        if self.static_image:
            return self.static_image

        return "/static/images/white_gun.jpg"

    @property
    def is_injured(self):
        return self.medical_status == "injured"

    @property
    def is_fit(self):
        return self.medical_status == "fit"


class MatchPerformance(models.Model):
    RESULT_CHOICES = [
        ("W", "Win"),
        ("D", "Draw"),
        ("L", "Loss"),
    ]

    CARD_CHOICES = [
        ("None", "None"),
        ("Yellow", "Yellow"),
        ("Red", "Red"),
    ]

    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="match_history"
    )

    date = models.DateField()

    opponent = models.CharField(
        max_length=100
    )

    competition = models.CharField(
        max_length=100,
        default="Premier League"
    )

    result = models.CharField(
        max_length=10,
        choices=RESULT_CHOICES
    )

    score = models.CharField(
        max_length=10,
        help_text="Example: 2-1"
    )

    minutes_played = models.PositiveIntegerField()

    goals = models.PositiveIntegerField(default=0)

    assists = models.PositiveIntegerField(default=0)

    card = models.CharField(
        max_length=20,
        choices=CARD_CHOICES,
        default="None"
    )

    rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )

    distance_km = models.FloatField(
        default=0.0
    )

    class Meta:
        ordering = ["-date"]
        verbose_name = "Match Performance"
        verbose_name_plural = "Match Performances"

    def __str__(self):
        return f"{self.player.name} vs {self.opponent} ({self.date})"