import type { CSSProperties } from 'react';
import { Apple, BarChart3, Droplets, Plus, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getMealRecommendations, useNutritionStore } from '../stores/nutritionStore';
import { useAuthStore } from '../stores/authStore';
import { mediumImpact } from '../utils/haptics';

function MacroRing({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
    const size = 92;
    const stroke = 8;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

    return (
        <div style={styles.ringItem}>
            <div style={{ ...styles.ringWrap, width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--app-border)" strokeWidth={stroke} />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
                </svg>
                <strong style={styles.ringValue}>{value}</strong>
            </div>
            <span style={styles.ringLabel}>{label}</span>
        </div>
    );
}

export default function Nutrition() {
    const { user } = useAuthStore();
    const { weeklyPlan, dailyGoals, waterIntake, selectedDay, setSelectedDay, addWater, logMealItem, resetDailyIfNeeded } = useNutritionStore();
    const [customOpen, setCustomOpen] = useState(false);
    const [customMeal, setCustomMeal] = useState({
        name: '',
        mealType: 'Meal',
        calories: '420',
        protein: '32',
        carbs: '45',
        fat: '12',
    });
    const today = weeklyPlan[selectedDay] ?? weeklyPlan[0];
    const recommendations = getMealRecommendations(user?.fitnessGoal, today, dailyGoals);
    const weeklyCarbs = useMemo(() => weeklyPlan.reduce((sum, day) => sum + day.totalCarbs, 0), [weeklyPlan]);
    const weeklyCarbGoal = dailyGoals.carbs * 7;
    const carbPeak = Math.max(dailyGoals.carbs, ...weeklyPlan.map((day) => day.totalCarbs), 1);

    useEffect(() => {
        resetDailyIfNeeded();
    }, [resetDailyIfNeeded]);

    const acceptRecommendation = (meal: typeof recommendations[number]) => {
        void mediumImpact();
        logMealItem({
            name: meal.title,
            mealType: meal.timing.includes('Snack') ? 'Snack' : meal.timing.includes('Post') ? 'Post-workout' : 'Meal',
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
        });
    };
    const addCustomMeal = () => {
        void mediumImpact();
        const name = customMeal.name.trim() || 'Custom meal';
        logMealItem({
            name,
            mealType: customMeal.mealType,
            calories: Number(customMeal.calories) || 0,
            protein: Number(customMeal.protein) || 0,
            carbs: Number(customMeal.carbs) || 0,
            fat: Number(customMeal.fat) || 0,
        });
        setCustomMeal((meal) => ({ ...meal, name: '' }));
        setCustomOpen(false);
    };

    return (
        <div style={styles.screen}>
            <div style={styles.bg} />
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <p style={styles.kicker}>Fuel System</p>
                        <h1 style={styles.title}>Nutrition</h1>
                        <p style={styles.copy}>Nutrition logging is parked while the next version is rebuilt around a cleaner coaching flow.</p>
                    </div>
                </header>
                <section style={styles.card}>
                    <div style={styles.row}>
                        <div>
                            <p style={styles.label}>Macro command center</p>
                            <h2 style={styles.cardTitle}>{today.day}</h2>
                        </div>
                        <Apple color="var(--app-secondary)" />
                    </div>
                    <div style={styles.rings}>
                        <MacroRing label="Calories" value={`${Math.round((today.totalCalories / dailyGoals.calories) * 100)}%`} progress={today.totalCalories / dailyGoals.calories} color="var(--app-accent)" />
                        <MacroRing label="Protein" value={`${today.totalProtein}g`} progress={today.totalProtein / dailyGoals.protein} color="var(--app-secondary)" />
                        <MacroRing label="Carbs" value={`${today.totalCarbs}g`} progress={today.totalCarbs / dailyGoals.carbs} color="#38bdf8" />
                        <MacroRing label="Fat" value={`${today.totalFat}g`} progress={today.totalFat / dailyGoals.fat} color="#8b5cf6" />
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={styles.row}>
                        <div>
                            <p style={styles.label}>Weekly carb overview</p>
                            <h2 style={styles.cardTitle}>{weeklyCarbs}g / {weeklyCarbGoal}g</h2>
                        </div>
                        <BarChart3 color="var(--app-accent)" />
                    </div>
                    <div style={styles.carbBars}>
                        {weeklyPlan.map((day, index) => (
                            <motion.button
                                key={day.day}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                style={selectedDay === index ? styles.carbDayActive : styles.carbDay}
                                onClick={() => setSelectedDay(index)}
                                aria-label={`${day.day} carbs ${day.totalCarbs} grams`}
                            >
                                <span style={styles.carbTrack}>
                                    <span style={{ ...styles.carbFill, height: `${Math.max(6, (day.totalCarbs / carbPeak) * 100)}%` }} />
                                </span>
                                <strong>{day.totalCarbs}g</strong>
                                <small>{day.day.slice(0, 1)}</small>
                            </motion.button>
                        ))}
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={styles.row}>
                        <div>
                            <p style={styles.label}>Goal-aware coaching</p>
                            <h2 style={styles.cardTitle}>Recommended next meals</h2>
                        </div>
                        <span style={styles.goalBadge}>{goalCopy[user?.fitnessGoal ?? 'stay_fit']}</span>
                    </div>
                    <div style={styles.recommendations}>
                        {recommendations.map((meal) => (
                            <article key={meal.id} style={styles.recommendation}>
                                <div>
                                    <strong style={styles.mealTitle}>{meal.title}</strong>
                                    <span style={styles.mealMeta}>{meal.timing} · {meal.reason}</span>
                                    <span style={styles.mealMeta}>{meal.items.join(', ')}</span>
                                </div>
                                <div style={styles.recommendationFooter}>
                                    <span style={styles.macroBadge}>{meal.protein}g protein</span>
                                    <span style={styles.macroBadge}>{meal.carbs}g carbs</span>
                                    <span style={styles.macroBadge}>{meal.calories} kcal</span>
                                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.addMeal} onClick={() => acceptRecommendation(meal)}>Add</motion.button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={styles.row}>
                        <div>
                            <p style={styles.label}>Custom meal builder</p>
                            <h2 style={styles.cardTitle}>Add your own fuel</h2>
                        </div>
                        <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.plus} onClick={() => setCustomOpen((open) => !open)}>
                            {customOpen ? <Utensils size={18} /> : <Plus size={18} />}
                        </motion.button>
                    </div>
                    {customOpen ? (
                        <div style={styles.customForm}>
                            <label style={styles.inputLabel}>
                                Meal name
                                <input style={styles.input} value={customMeal.name} placeholder="Chicken rice bowl" onChange={(event) => setCustomMeal((meal) => ({ ...meal, name: event.target.value }))} />
                            </label>
                            <label style={styles.inputLabel}>
                                Slot
                                <select style={styles.input} value={customMeal.mealType} onChange={(event) => setCustomMeal((meal) => ({ ...meal, mealType: event.target.value }))}>
                                    <option>Breakfast</option>
                                    <option>Lunch</option>
                                    <option>Dinner</option>
                                    <option>Snack</option>
                                    <option>Post-workout</option>
                                </select>
                            </label>
                            <div style={styles.macroInputs}>
                                {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
                                    <label key={field} style={styles.inputLabel}>
                                        {field}
                                        <input
                                            style={styles.input}
                                            inputMode="numeric"
                                            value={customMeal[field]}
                                            onChange={(event) => setCustomMeal((meal) => ({ ...meal, [field]: event.target.value.replace(/[^\d]/g, '') }))}
                                        />
                                    </label>
                                ))}
                            </div>
                            <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.submitMeal} onClick={addCustomMeal}>
                                Add custom meal
                            </motion.button>
                        </div>
                    ) : (
                        <p style={styles.mealMeta}>Save anything you type here to today’s log. The weekly overview updates immediately and resets on a new week.</p>
                    )}
                </section>

                <section style={styles.grid}>
                    <article style={styles.card}>
                        <div style={styles.row}><Droplets color="var(--app-accent)" /><motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.plus} onClick={addWater}><Plus size={18} /></motion.button></div>
                        <p style={styles.label}>Hydration load</p>
                        <h2 style={styles.cardTitle}>{waterIntake}/{dailyGoals.water}</h2>
                        <div style={styles.waterGrid}>
                            {Array.from({ length: dailyGoals.water }).map((_, index) => (
                                <motion.button key={index} type="button" whileTap={{ scale: 0.95 }} style={index < waterIntake ? styles.waterOn : styles.waterOff} onClick={addWater} />
                            ))}
                        </div>
                    </article>
                    <article style={styles.card}>
                        <div style={styles.days}>
                            {weeklyPlan.map((day, index) => (
                                <motion.button key={day.day} type="button" whileTap={{ scale: 0.95 }} style={selectedDay === index ? styles.dayOn : styles.dayOff} onClick={() => setSelectedDay(index)}>{day.day.slice(0, 3)}</motion.button>
                            ))}
                        </div>
                        {(today.meals.length ? today.meals : [{ id: 'next', name: 'Protein Anchor', time: 'Next meal', protein: 42, items: ['Lean protein', 'slow carb', 'produce'] }]).map((meal) => (
                            <div key={meal.id} style={styles.meal}>
                                <strong style={styles.mealTitle}>{meal.name}</strong>
                                <span style={styles.mealMeta}>{meal.time} · {meal.items.join(', ')}</span>
                                <b style={styles.protein}>{meal.protein}g</b>
                            </div>
                        ))}
                    </article>
                </section>
            </main>
        </div>
    );
}

const glass: CSSProperties = { background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow)' };
const goalCopy = {
    lose_weight: 'Lean out',
    build_muscle: 'Build muscle',
    stay_fit: 'Maintain',
    improve_endurance: 'Endurance',
};
const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', color: 'var(--app-text)', background: 'var(--app-bg)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 16% 0%, rgba(26,115,232,.10), transparent 30%), radial-gradient(circle at 88% 15%, rgba(0,191,165,.12), transparent 34%)' },
    main: { position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '28px 18px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 },
    header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
    scanActions: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    title: { margin: '8px 0 0', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    copy: { margin: '12px 0 0', maxWidth: 560, color: 'var(--app-muted)', fontSize: 16, lineHeight: 1.45 },
    primary: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 46, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 8, font: 'inherit', fontWeight: 800, boxShadow: '0 10px 24px rgba(26,115,232,.18)' },
    card: { ...glass, borderRadius: 30, padding: 18 },
    row: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
    label: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    cardTitle: { margin: '8px 0 0', color: 'var(--app-text)', fontSize: 26, lineHeight: 1, fontWeight: 850, letterSpacing: -0.5 },
    rings: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginTop: 22 },
    ringItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 0 },
    ringWrap: { position: 'relative', display: 'grid', placeItems: 'center' },
    ringValue: { position: 'absolute', color: 'var(--app-text)', fontSize: 17, fontWeight: 850 },
    ringLabel: { color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 14 },
    plus: { border: 0, width: 44, height: 44, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' },
    waterGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 18 },
    waterOn: { border: 0, height: 36, borderRadius: 999, background: 'var(--app-accent)' },
    waterOff: { border: 0, height: 36, borderRadius: 999, background: 'var(--app-border)' },
    days: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 },
    dayOn: { border: 0, borderRadius: 999, background: 'var(--app-text)', color: 'var(--app-bg)', padding: '9px 14px', fontWeight: 800 },
    dayOff: { border: 0, borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-muted)', padding: '9px 14px', fontWeight: 700 },
    meal: { position: 'relative', borderRadius: 26, background: 'var(--app-bg)', padding: 16, marginTop: 10 },
    mealTitle: { display: 'block', color: 'var(--app-text)', fontSize: 18, fontWeight: 800 },
    mealMeta: { display: 'block', marginTop: 6, color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.4 },
    protein: { position: 'absolute', right: 16, top: 16, color: 'var(--app-secondary)' },
    resultCard: { ...glass, borderRadius: 26, padding: 16 },
    scannedAdd: { marginTop: 12, border: 0, borderRadius: 999, background: 'var(--app-secondary)', color: '#fff', minHeight: 42, padding: '0 16px', font: 'inherit', fontWeight: 850 },
    goalBadge: { borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '8px 12px', fontSize: 12, fontWeight: 850 },
    recommendations: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 16 },
    recommendation: { borderRadius: 26, background: 'var(--app-bg)', padding: 16 },
    recommendationFooter: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
    macroBadge: { borderRadius: 999, background: 'var(--app-border)', color: 'var(--app-muted)', padding: '7px 10px', fontSize: 12, fontWeight: 800 },
    addMeal: { marginLeft: 'auto', border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', padding: '8px 14px', font: 'inherit', fontWeight: 850 },
    carbBars: { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8, marginTop: 18, alignItems: 'end' },
    carbDay: { border: 0, borderRadius: 22, background: 'var(--app-bg)', color: 'var(--app-muted)', padding: 8, minHeight: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, font: 'inherit', fontWeight: 850 },
    carbDayActive: { border: 0, borderRadius: 22, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: 8, minHeight: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, font: 'inherit', fontWeight: 850 },
    carbTrack: { width: 10, height: 70, borderRadius: 999, background: 'var(--app-border)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' },
    carbFill: { display: 'block', width: '100%', borderRadius: 999, background: 'var(--app-accent)' },
    customForm: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
    macroInputs: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
    inputLabel: { display: 'grid', gap: 6, color: 'var(--app-muted)', fontSize: 12, fontWeight: 850, textTransform: 'capitalize' },
    input: { width: '100%', minWidth: 0, boxSizing: 'border-box', border: 0, outline: 'none', borderRadius: 18, background: 'var(--app-bg)', color: 'var(--app-text)', padding: '13px 14px', font: 'inherit', fontSize: 15, fontWeight: 800 },
    submitMeal: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 48, padding: '0 18px', font: 'inherit', fontWeight: 900 },
};
