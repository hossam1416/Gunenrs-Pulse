from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)

    logo = models.ImageField(
        upload_to="teams/",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class Coach(models.Model):
    name = models.CharField(max_length=100)

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class Player(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    short = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )

    number = models.IntegerField(
        null=True,
        blank=True,
    )

    primary = models.CharField(
        max_length=10,
        null=True,
        blank=True,
    )

    posGroup = models.CharField(
        max_length=10,
        null=True,
        blank=True,
    )

    img = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    nationality = models.CharField(
        max_length=50,
        null=True,
        blank=True,
    )

    age = models.IntegerField(
        null=True,
        blank=True,
    )

    fitness = models.IntegerField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name


class PlayerAttribute(models.Model):
    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
    )

    pace = models.IntegerField(default=50)
    shooting = models.IntegerField(default=50)
    passing = models.IntegerField(default=50)
    dribbling = models.IntegerField(default=50)
    defending = models.IntegerField(default=50)
    physical = models.IntegerField(default=50)

    def __str__(self):
        return f"Attributes: {self.player.name}"


class PerformanceStat(models.Model):
    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
    )

    matches_played = models.IntegerField(default=0)
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)

    expected_goals_xg = models.FloatField(
        default=0.0,
    )

    def __str__(self):
        return f"Stats: {self.player.name}"


class InjuryHistory(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
    )

    injury_type = models.CharField(max_length=100)

    status = models.CharField(max_length=50)

    days_out = models.IntegerField(default=0)

    def __str__(self):
        return f"Injury: {self.player.name}"


class AIInsight(models.Model):
    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
    )

    risk_level = models.CharField(max_length=50)

    def __str__(self):
        return f"AI Insight: {self.player.name}"


class PlayerTacticsData(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Data Name",
    )

    data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Player Tactics JSON Data",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Player Tactics Data"
        verbose_name_plural = "Player Tactics Data"

    def __str__(self):
        return self.name