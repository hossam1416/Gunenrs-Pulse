from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime

# ──────────────────────────────────────────────────────────
# 1. موديل اللاعب (Player Model)
# ──────────────────────────────────────────────────────────
class Player(models.Model):
    # --- الهوية والمعلومات الأساسية ---
    name = models.CharField(max_length=100, verbose_name="Player Name")
    number = models.PositiveIntegerField(unique=True, verbose_name="Shirt Number")
    
    # حقل الصورة المحدث (يتطلب تثبيت مكتبة Pillow)
    image = models.ImageField(
        upload_to='players_images/', 
        default='players_images/white_gun.jpg', 
        null=True, 
        blank=True,
        verbose_name="Player Image"
    )

    POSITION_CHOICES = [
        ('GK', 'Goalkeeper'),
        ('DEF', 'Defender'),
        ('MID', 'Midfielder'),
        ('FWD', 'Forward'),
    ]
    position = models.CharField(max_length=3, choices=POSITION_CHOICES, default='MID')
    secondary_position = models.CharField(max_length=50, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    height = models.PositiveIntegerField(help_text="Height in cm", null=True, blank=True)
    weight = models.PositiveIntegerField(help_text="Weight in kg", null=True, blank=True)
    
    FOOT_CHOICES = [('Left', 'Left'), ('Right', 'Right'), ('Both', 'Both')]
    preferred_foot = models.CharField(max_length=10, choices=FOOT_CHOICES, default='Right')
    
    market_value = models.DecimalField(max_digits=12, decimal_places=2, help_text="Value in Million Euro", default=0.00)
    contract_start = models.DateField(null=True, blank=True)
    contract_expiry = models.DateField(null=True, blank=True)

    # --- القسم الطبي واللياقة (Medical Center) ---
    fitness_percentage = models.PositiveIntegerField(
        default=100, 
        validators=[MaxValueValidator(100)],
        verbose_name="Fitness %"
    )
    
    MEDICAL_CHOICES = [('fit', 'Fit'), ('injured', 'Injured')]
    medical_status = models.CharField(max_length=20, choices=MEDICAL_CHOICES, default='fit')
    
    # حقل JSON لتخزين تفاصيل الإصابة (يستخدم في صفحة Medical)
    injury_meta = models.JSONField(
        null=True, 
        blank=True, 
        help_text="JSON data: { 'type': '...', 'recovery': '...', 'history': [...] }"
    )

    # --- إحصائيات الأداء العامة (Performance - Perform-2) ---
    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)
    matches_played = models.PositiveIntegerField(default=0)
    minutes_played = models.PositiveIntegerField(default=0)
    yellow_cards = models.PositiveIntegerField(default=0)
    red_cards = models.PositiveIntegerField(default=0)
    shots_on_target_pct = models.FloatField(default=0.0, verbose_name="Shots on Target %")

    # --- التحليل التكتيكي (Tactical - Perform-3) ---
    pass_accuracy = models.FloatField(default=0.0, verbose_name="Pass Accuracy %")
    key_passes = models.PositiveIntegerField(default=0)
    interceptions = models.PositiveIntegerField(default=0)
    tackles_won = models.PositiveIntegerField(default=0)
    top_speed = models.FloatField(default=0.0, help_text="km/h")
    distance_covered = models.FloatField(default=0.0, help_text="Avg km per match")
    sprints = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Player"
        verbose_name_plural = "Players"
        ordering = ['number']

    def __str__(self):
        return f"#{self.number} - {self.name}"

    @property
    def age(self):
        if self.birth_date:
            return datetime.date.today().year - self.birth_date.year
        return 0

# ──────────────────────────────────────────────────────────
# 2. موديل تاريخ المباريات (Match Performance Model)
# ──────────────────────────────────────────────────────────
class MatchPerformance(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='match_history')
    date = models.DateField()
    opponent = models.CharField(max_length=100)
    competition = models.CharField(max_length=100, default="Premier League")
    
    RESULT_CHOICES = [('W', 'Win'), ('D', 'Draw'), ('L', 'Loss')]
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    score = models.CharField(max_length=10, help_text="e.g. 2-1")
    
    minutes_played = models.PositiveIntegerField(default=0)
    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)
    
    CARD_CHOICES = [('None', 'None'), ('Yellow', 'Yellow'), ('Red', 'Red')]
    card = models.CharField(max_length=20, choices=CARD_CHOICES, default='None')
    
    rating = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(10)])
    distance_km = models.FloatField(default=0.0)

    class Meta:
        verbose_name = "Match Performance"
        verbose_name_plural = "Match Performances"
        ordering = ['-date']

    def __str__(self):
        return f"{self.player.name} vs {self.opponent} ({self.date})"

# ──────────────────────────────────────────────────────────
# 3. موديل بيانات لوحة التحكم (Dashboard Data Model)
# ──────────────────────────────────────────────────────────
class DashboardData(models.Model):
    """
    هذا الموديل مخصص لتخزين ملفات JSON الضخمة مثل:
    - in_data.json (بيانات الموسم والكوتش)
    - in_matches.json (نتائج الفريق كاملة)
    """
    name = models.CharField(max_length=100, unique=True, help_text="مثال: Home Dashboard أو Matches Data")
    data = models.JSONField(verbose_name="JSON Content")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dashboard Data"
        verbose_name_plural = "Dashboard Data"

    def __str__(self):
        return self.name