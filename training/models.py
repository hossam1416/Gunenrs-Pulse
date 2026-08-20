from django.db import models
from django.contrib.auth.models import User


class Team(models.Model):
    name = models.CharField(max_length=100, blank=True)
    logo = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "training_team"

    def __str__(self):
        return self.name or f"Team {self.id}"


class Player(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="player",
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="players",
    )

    name = models.CharField(max_length=100)
    short = models.CharField(max_length=50, blank=True, null=True)
    number = models.IntegerField(null=True, blank=True)

    primary = models.CharField(max_length=30, blank=True, null=True)
    posGroup = models.CharField(max_length=30, blank=True, null=True)

    fitness = models.IntegerField(default=100)
    img = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "training_player"

    def __str__(self):
        return self.name


class Coach(models.Model):
    name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    img = models.CharField(max_length=255, blank=True, null=True)
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coaches",
    )

    class Meta:
        db_table = "training_coach"

    def __str__(self):
        return self.name or "Coach"


class TrainingSection(models.Model):
    section_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "training_trainingsection"
        ordering = ["id"]

    def __str__(self):
        return self.name


class TrainingDrill(models.Model):
    section = models.ForeignKey(
        TrainingSection,
        on_delete=models.CASCADE,
        related_name="drills",
    )

    drill_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    short_name = models.CharField(max_length=100, blank=True, null=True)
    focus_label = models.CharField(max_length=100, blank=True, null=True)
    intensity = models.CharField(max_length=50, blank=True, null=True)
    duration = models.IntegerField(default=0)

    # مهم: نخليه TextField مش JSONField عشان ما يصير خطأ JSON_VALID
    attrs = models.TextField(blank=True, null=True)

    video = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "training_trainingdrill"
        ordering = ["id"]

    def __str__(self):
        return self.name


class PublishedTrainingSession(models.Model):
    KEY = "current_training_session"

    name = models.CharField(max_length=100, unique=True)
    session_data = models.JSONField(default=dict, blank=True)
    published_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "training_publishedtrainingsession"

    def __str__(self):
        return self.name


class PlayerTrainingData(models.Model):
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "training_playertrainingdata"

    def __str__(self):
        return f"PlayerTrainingData {self.id}"


class InjuryHistory(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="injuries",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=50, blank=True, null=True)
    last_injury_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "training_injuryhistory"

    def __str__(self):
        return self.status or "Injury"


class PerformanceStat(models.Model):
    player = models.OneToOneField(
        Player,
        on_delete=models.CASCADE,
        related_name="performance",
        null=True,
        blank=True,
    )
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    minutes = models.IntegerField(default=0)

    class Meta:
        db_table = "training_performancestat"

    def __str__(self):
        return f"Stats {self.id}"


class PlayerAttribute(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="attributes",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100, blank=True)
    value = models.IntegerField(default=0)

    class Meta:
        db_table = "training_playerattribute"

    def __str__(self):
        return self.name or "Attribute"


class AIInsight(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="ai_insights",
        null=True,
        blank=True,
    )
    summary = models.TextField(blank=True, null=True)
    development_areas = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "training_aiinsight"

    def __str__(self):
        return f"AIInsight {self.id}"
