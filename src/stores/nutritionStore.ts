import { create } from 'zustand';

export interface Meal {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    items: string[];
}

export interface DayMeals {
    day: string;
    meals: Meal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
}

export interface LogMealItemInput {
    name: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface NutritionState {
    weeklyPlan: DayMeals[];
    dailyGoals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        water: number;
    };
    waterIntake: number;
    selectedDay: number;
    setSelectedDay: (day: number) => void;
    addWater: () => void;
    logMealItem: (item: LogMealItemInput) => void;
    reset: () => void;
}

const weeklyMealPlan: DayMeals[] = [
    {
        day: 'Monday',
        meals: [
            { id: 'm1', name: 'Breakfast', calories: 450, protein: 35, carbs: 45, fat: 15, time: '7:30 AM', items: ['Oatmeal with berries', 'Protein shake', '2 eggs'] },
            { id: 'm2', name: 'Lunch', calories: 650, protein: 45, carbs: 60, fat: 22, time: '12:30 PM', items: ['Grilled chicken breast', 'Brown rice', 'Mixed vegetables', 'Avocado'] },
            { id: 'm3', name: 'Snack', calories: 200, protein: 15, carbs: 20, fat: 8, time: '3:30 PM', items: ['Greek yogurt', 'Almonds', 'Apple'] },
            { id: 'm4', name: 'Dinner', calories: 600, protein: 40, carbs: 50, fat: 20, time: '7:00 PM', items: ['Salmon fillet', 'Sweet potato', 'Broccoli', 'Olive oil drizzle'] },
        ],
        totalCalories: 1900, totalProtein: 135, totalCarbs: 175, totalFat: 65,
    },
    {
        day: 'Tuesday',
        meals: [
            { id: 'm5', name: 'Breakfast', calories: 500, protein: 40, carbs: 50, fat: 14, time: '7:30 AM', items: ['Protein pancakes', 'Banana', 'Maple syrup'] },
            { id: 'm6', name: 'Lunch', calories: 620, protein: 42, carbs: 55, fat: 20, time: '12:30 PM', items: ['Turkey wrap', 'Hummus', 'Side salad'] },
            { id: 'm7', name: 'Snack', calories: 180, protein: 20, carbs: 15, fat: 6, time: '3:30 PM', items: ['Protein bar', 'Orange'] },
            { id: 'm8', name: 'Dinner', calories: 580, protein: 38, carbs: 55, fat: 18, time: '7:00 PM', items: ['Lean beef stir-fry', 'Jasmine rice', 'Bok choy'] },
        ],
        totalCalories: 1880, totalProtein: 140, totalCarbs: 175, totalFat: 58,
    },
    {
        day: 'Wednesday',
        meals: [
            { id: 'm9', name: 'Breakfast', calories: 420, protein: 32, carbs: 40, fat: 16, time: '7:30 AM', items: ['Smoothie bowl', 'Granola', 'Chia seeds'] },
            { id: 'm10', name: 'Lunch', calories: 680, protein: 48, carbs: 58, fat: 24, time: '12:30 PM', items: ['Grilled steak salad', 'Quinoa', 'Feta cheese'] },
            { id: 'm11', name: 'Snack', calories: 220, protein: 18, carbs: 22, fat: 8, time: '3:30 PM', items: ['Cottage cheese', 'Berries', 'Walnuts'] },
            { id: 'm12', name: 'Dinner', calories: 560, protein: 36, carbs: 48, fat: 20, time: '7:00 PM', items: ['Baked cod', 'Roasted vegetables', 'Couscous'] },
        ],
        totalCalories: 1880, totalProtein: 134, totalCarbs: 168, totalFat: 68,
    },
    {
        day: 'Thursday',
        meals: [
            { id: 'm13', name: 'Breakfast', calories: 480, protein: 38, carbs: 42, fat: 18, time: '7:30 AM', items: ['Egg white omelette', 'Whole wheat toast', 'Avocado'] },
            { id: 'm14', name: 'Lunch', calories: 640, protein: 44, carbs: 62, fat: 20, time: '12:30 PM', items: ['Chicken burrito bowl', 'Black beans', 'Salsa'] },
            { id: 'm15', name: 'Snack', calories: 190, protein: 16, carbs: 18, fat: 7, time: '3:30 PM', items: ['Trail mix', 'Protein shake'] },
            { id: 'm16', name: 'Dinner', calories: 590, protein: 42, carbs: 52, fat: 18, time: '7:00 PM', items: ['Grilled chicken thighs', 'Mashed sweet potato', 'Green beans'] },
        ],
        totalCalories: 1900, totalProtein: 140, totalCarbs: 174, totalFat: 63,
    },
    {
        day: 'Friday',
        meals: [
            { id: 'm17', name: 'Breakfast', calories: 460, protein: 34, carbs: 48, fat: 14, time: '7:30 AM', items: ['Overnight oats', 'Protein powder', 'Peanut butter'] },
            { id: 'm18', name: 'Lunch', calories: 660, protein: 46, carbs: 56, fat: 22, time: '12:30 PM', items: ['Tuna poke bowl', 'Edamame', 'Sesame dressing'] },
            { id: 'm19', name: 'Snack', calories: 210, protein: 14, carbs: 24, fat: 8, time: '3:30 PM', items: ['Rice cakes', 'Almond butter', 'Honey'] },
            { id: 'm20', name: 'Dinner', calories: 620, protein: 40, carbs: 54, fat: 22, time: '7:00 PM', items: ['Turkey meatballs', 'Whole wheat pasta', 'Marinara sauce'] },
        ],
        totalCalories: 1950, totalProtein: 134, totalCarbs: 182, totalFat: 66,
    },
    {
        day: 'Saturday',
        meals: [
            { id: 'm21', name: 'Breakfast', calories: 520, protein: 36, carbs: 55, fat: 16, time: '9:00 AM', items: ['French toast', 'Berries', 'Turkey bacon'] },
            { id: 'm22', name: 'Lunch', calories: 600, protein: 40, carbs: 52, fat: 22, time: '1:00 PM', items: ['Grilled chicken Caesar', 'Croutons', 'Parmesan'] },
            { id: 'm23', name: 'Snack', calories: 180, protein: 12, carbs: 20, fat: 6, time: '4:00 PM', items: ['Fruit smoothie', 'Granola bar'] },
            { id: 'm24', name: 'Dinner', calories: 650, protein: 44, carbs: 58, fat: 24, time: '7:30 PM', items: ['Ribeye steak', 'Baked potato', 'Asparagus'] },
        ],
        totalCalories: 1950, totalProtein: 132, totalCarbs: 185, totalFat: 68,
    },
    {
        day: 'Sunday',
        meals: [
            { id: 'm25', name: 'Breakfast', calories: 480, protein: 30, carbs: 52, fat: 16, time: '9:30 AM', items: ['Acai bowl', 'Granola', 'Coconut flakes'] },
            { id: 'm26', name: 'Lunch', calories: 580, protein: 38, carbs: 50, fat: 20, time: '1:00 PM', items: ['Mediterranean bowl', 'Falafel', 'Tzatziki'] },
            { id: 'm27', name: 'Snack', calories: 200, protein: 16, carbs: 18, fat: 8, time: '4:00 PM', items: ['Cheese & crackers', 'Grapes'] },
            { id: 'm28', name: 'Dinner', calories: 540, protein: 36, carbs: 48, fat: 18, time: '7:00 PM', items: ['Grilled shrimp', 'Zucchini noodles', 'Pesto sauce'] },
        ],
        totalCalories: 1800, totalProtein: 120, totalCarbs: 168, totalFat: 62,
    },
];

export const useNutritionStore = create<NutritionState>((set) => ({
    weeklyPlan: weeklyMealPlan,
    dailyGoals: {
        calories: 2000,
        protein: 140,
        carbs: 180,
        fat: 65,
        water: 8,
    },
    waterIntake: 5,
    selectedDay: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,

    setSelectedDay: (day: number) => set({ selectedDay: day }),

    addWater: () =>
        set((state) => ({
            waterIntake: Math.min(state.waterIntake + 1, 12),
        })),

    logMealItem: (item: LogMealItemInput) =>
        set((state) => {
            const dayIndex = state.selectedDay;
            const updated = state.weeklyPlan.map((day, idx) => {
                if (idx !== dayIndex) return day;
                const existingMeal = day.meals.find((m) => m.name === item.mealType);
                let updatedMeals: Meal[];
                if (existingMeal) {
                    updatedMeals = day.meals.map((m) =>
                        m.name === item.mealType
                            ? { ...m, calories: m.calories + item.calories, protein: m.protein + item.protein, carbs: m.carbs + item.carbs, fat: m.fat + item.fat, items: [...m.items, item.name] }
                            : m
                    );
                } else {
                    updatedMeals = [...day.meals, { id: `custom_${Date.now()}`, name: item.mealType, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), items: [item.name] }];
                }
                return {
                    ...day,
                    meals: updatedMeals,
                    totalCalories: day.totalCalories + item.calories,
                    totalProtein: day.totalProtein + item.protein,
                    totalCarbs: day.totalCarbs + item.carbs,
                    totalFat: day.totalFat + item.fat,
                };
            });
            return { weeklyPlan: updated };
        }),

    reset: () =>
        set((state) => ({
            waterIntake: 0,
            weeklyPlan: state.weeklyPlan.map((day) => ({
                ...day,
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
                meals: [],
            })),
        })),
}));
