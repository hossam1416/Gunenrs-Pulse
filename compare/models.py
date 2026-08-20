from django.db import models

class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='teams/', null=True, blank=True)
    
    def __str__(self):
        return self.name

class Coach(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, default="Head Coach")
    avatar = models.ImageField(upload_to='coaches/', null=True, blank=True)

    def __str__(self):
        return self.name

class Player(models.Model):
    name = models.CharField(max_length=100)
    short = models.CharField(max_length=50, null=True, blank=True)       
    number = models.IntegerField()
    position = models.CharField(max_length=50, null=True, blank=True)
    primary = models.CharField(max_length=50, null=True, blank=True)  
    posGroup = models.CharField(max_length=50, null=True, blank=True)    
    nationality = models.CharField(max_length=50)
    age = models.IntegerField()
    height = models.IntegerField(null=True, blank=True)                
    weight = models.IntegerField(null=True, blank=True)              
    foot = models.CharField(max_length=20, null=True, blank=True)
    valueN = models.FloatField(null=True, blank=True)                    
    fitness = models.IntegerField(default=100)                        
    img = models.ImageField(upload_to='players/', null=True, blank=True)        
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players', null=True, blank=True)

    career_apps = models.IntegerField(default=0)
    career_goals = models.IntegerField(default=0)
    trophies = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.primary or self.position})"

class PlayerAttribute(models.Model):
    player = models.OneToOneField(Player, on_delete=models.CASCADE, related_name='attributes')
    pace = models.IntegerField(default=0)
    shooting = models.IntegerField(default=0)
    passing = models.IntegerField(default=0)
    dribbling = models.IntegerField(default=0)
    defending = models.IntegerField(default=0)
    physical = models.IntegerField(default=0)

    def __str__(self):
        return f"Attributes for {self.player.name}"

class PerformanceStat(models.Model):
    player = models.OneToOneField(Player, on_delete=models.CASCADE, related_name='performance')
    
    matches_played = models.IntegerField(default=0)
    starts = models.IntegerField(default=0)
    minutes = models.IntegerField(default=0)
    
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    expected_goals_xg = models.FloatField(default=0.0)
    expected_assists_xa = models.FloatField(default=0.0)
    conversion_rate = models.IntegerField(default=0, help_text="Percentage %")
    
    total_shots = models.IntegerField(default=0)
    shots_on_target_pct = models.IntegerField(default=0, help_text="Percentage %")
    shots_in_box = models.IntegerField(default=0)
    
    yellow_cards = models.IntegerField(default=0)
    red_cards = models.IntegerField(default=0)
    fouls_committed = models.IntegerField(default=0)
    offsides = models.IntegerField(default=0)
    
    pass_accuracy = models.IntegerField(default=0, help_text="Percentage %")
    key_passes_per_90 = models.FloatField(default=0.0)
    final_third_passes = models.IntegerField(default=0)
    long_ball_pct = models.IntegerField(default=0, help_text="Percentage %")
    through_balls = models.IntegerField(default=0)
    
    tackle_win_pct = models.IntegerField(default=0, help_text="Percentage %")
    interceptions_per_90 = models.FloatField(default=0.0)
    ball_recoveries_per_90 = models.FloatField(default=0.0)
    total_duel_win_pct = models.IntegerField(default=0, help_text="Percentage %")
    aerial_win_pct = models.IntegerField(default=0, help_text="Percentage %")
    dribble_success_pct = models.IntegerField(default=0, help_text="Percentage %")
    
    distance_covered = models.FloatField(default=0.0, help_text="Distance per 90 (km)")
    high_intensity_sprints = models.IntegerField(default=0)
    top_speed = models.FloatField(default=0.0, help_text="Top Speed (km/h)")

    availability_pct = models.IntegerField(default=100, help_text="Percentage %")
    motm_awards = models.IntegerField(default=0)
    season_rating = models.FloatField(default=7.0)

    def __str__(self):
        return f"Performance for {self.player.name}"

class InjuryHistory(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='injuries')
    injury_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=[('Fit', 'Fit'), ('Injured', 'Injured')])
    days_out = models.IntegerField(default=0)
    last_injury_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.status}"

class AIInsight(models.Model):
    player = models.OneToOneField(Player, on_delete=models.CASCADE, related_name='ai_insights')
    strengths = models.TextField(help_text="Separate by commas")
    development_areas = models.TextField()
    risk_level = models.CharField(max_length=20, default="Low", choices=[('Very Low', 'Very Low'), ('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])

    def __str__(self):
        return f"Insights for {self.player.name}"