from django.contrib import admin
from .models import Player, MatchPerformance, DashboardData

# ──────────────────────────────────────────────────────────
# 1. لوحة تحكم اللاعبين (Player Admin)
# ──────────────────────────────────────────────────────────
@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    # الأعمدة اللي رح تظهر بالجدول الرئيسي
    list_display = ('number', 'name', 'position', 'medical_status', 'fitness_percentage', 'market_value')
    
    # فلاتر البحث الجانبية (عشان تفلتر المدافعين أو المصابين بضغطة زر)
    list_filter = ('position', 'medical_status', 'preferred_foot')
    
    # مربع البحث (بتقدر تبحث بالاسم أو الرقم)
    search_fields = ('name', 'number')
    
    # ترتيب اللاعبين الافتراضي (حسب الرقم)
    ordering = ('number',)

    # 🚀 حركة المحترفين: تقسيم صفحة اللاعب من جوا لأقسام مرتبة
    fieldsets = (
        ('1. Basic Info & Identity', {
            'fields': ('name', 'number', 'image', 'position', 'secondary_position', 'birth_date', 'height', 'weight', 'preferred_foot')
        }),
        ('2. Contract & Value', {
            'fields': ('market_value', 'contract_start', 'contract_expiry'),
            'classes': ('collapse',) # بتخلي هاد القسم قابل للطي
        }),
        ('3. Medical Center', {
            'fields': ('medical_status', 'fitness_percentage', 'injury_meta'),
            'description': 'قم بتحديث الحالة الطبية ونسبة اللياقة وتفاصيل الإصابة بصيغة JSON هنا.'
        }),
        ('4. Overall Stats (Perform-2)', {
            'fields': ('goals', 'assists', 'matches_played', 'minutes_played', 'yellow_cards', 'red_cards', 'shots_on_target_pct'),
            'classes': ('collapse',)
        }),
        ('5. Tactical Analysis (Perform-3)', {
            'fields': ('pass_accuracy', 'key_passes', 'interceptions', 'tackles_won', 'top_speed', 'distance_covered', 'sprints'),
            'classes': ('collapse',)
        }),
    )

# ──────────────────────────────────────────────────────────
# 2. لوحة تحكم أداء المباريات (Match Performance Admin)
# ──────────────────────────────────────────────────────────
@admin.register(MatchPerformance)
class MatchPerformanceAdmin(admin.ModelAdmin):
    list_display = ('player', 'opponent', 'date', 'result', 'rating', 'minutes_played')
    list_filter = ('result', 'competition', 'date', 'player')
    search_fields = ('player__name', 'opponent')
    ordering = ('-date',)
    date_hierarchy = 'date' # بضيف شريط زمني فوق عشان تفلتر المباريات حسب الشهر/السنة

# ──────────────────────────────────────────────────────────
# 3. لوحة تحكم البيانات الضخمة (Dashboard Data Admin)
# ──────────────────────────────────────────────────────────
@admin.register(DashboardData)
class DashboardDataAdmin(admin.ModelAdmin):
    list_display = ('name', 'last_updated')
    search_fields = ('name',)
    readonly_fields = ('last_updated',) # حقل للقراءة فقط لأنه بتحدث لحاله