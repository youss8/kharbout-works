const outings = [
    {
        title: 'Sketch the botanical garden',
        interest: 'Creative',
        duration: 45,
        cost: 6,
        indoor: false,
    },
    {
        title: 'Browse a small print exhibition',
        interest: 'Creative',
        duration: 35,
        cost: 4,
        indoor: true,
    },
    {
        title: 'Make a two-person drawing zine',
        interest: 'Creative',
        duration: 30,
        cost: 2,
        indoor: true,
    },
    {
        title: 'Walk the riverside loop',
        interest: 'Outdoors',
        duration: 40,
        cost: 0,
        indoor: false,
    },
    { title: 'Visit a greenhouse', interest: 'Outdoors', duration: 35, cost: 6, indoor: true },
    {
        title: 'Try the market tasting counter',
        interest: 'Food',
        duration: 30,
        cost: 12,
        indoor: true,
    },
    { title: 'Pack a picnic for two', interest: 'Food', duration: 45, cost: 10, indoor: false },
    { title: 'Share tea and a puzzle', interest: 'Food', duration: 25, cost: 4, indoor: true },
];
function datePlanner() {
    return {
        step: 1,
        interest: 'Creative',
        indoor: false,
        limit: 100,
        budget: 20,
        start: '15:00',
        variant: 0,
        get matches() {
            const eligible = outings.filter((stop) => !this.indoor || stop.indoor);
            const pairs = [];
            for (let i = 0; i < eligible.length; i++) {
                for (const other of eligible.slice(i + 1)) {
                    const first = eligible[i];
                    const score =
                        Number(first.interest === this.interest) +
                        Number(other.interest === this.interest);
                    if (
                        score &&
                        first.duration + other.duration + 10 <= this.limit &&
                        first.cost + other.cost <= this.budget
                    ) {
                        pairs.push({
                            stops:
                                first.interest === this.interest ? [first, other] : [other, first],
                            score,
                        });
                    }
                }
            }
            return pairs.sort((a, b) => b.score - a.score);
        },
        get route() {
            return this.matches[this.variant % this.matches.length]?.stops ?? [];
        },
        get cost() {
            return this.route.reduce((total, stop) => total + stop.cost, 0);
        },
        get duration() {
            return this.route.reduce((total, stop) => total + stop.duration, 10);
        },
        time(offset) {
            const [h, m] = this.start.split(':').map(Number);
            const minutes = h * 60 + m + offset;
            return (
                [Math.floor(minutes / 60) % 24, minutes % 60]
                    .map((part) => String(part).padStart(2, '0'))
                    .join(':') + (minutes >= 1440 ? ' (+1 day)' : '')
            );
        },
    };
}

function dayKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}
function shiftDay(date, offset) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 12);
}
function habitTracker() {
    const legacyKey = 'yok-lab-habits-v1';
    const prefix = 'yok-lab-habits-v2:';
    const names = ['Read', 'Walk', 'Practice'];
    let midnightTimer;
    return {
        names,
        active: 'Read',
        history: {},
        offset: 0,
        localOnly: false,
        today: shiftDay(new Date(), 0),
        init() {
            this.syncHistory();
            this.scheduleMidnight();
        },
        destroy() {
            window.clearTimeout(midnightTimer);
        },
        scheduleMidnight() {
            this.refreshToday();
            window.clearTimeout(midnightTimer);
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            midnightTimer = window.setTimeout(
                () => this.scheduleMidnight(),
                midnight.getTime() - now.getTime(),
            );
        },
        refreshToday() {
            const now = shiftDay(new Date(), 0);
            if (dayKey(now) !== this.todayKey) this.today = now;
        },
        syncHistory(event) {
            if (
                this.localOnly ||
                (event?.key && !event.key.startsWith(prefix) && event.key !== legacyKey)
            )
                return;
            this.refreshToday();
            try {
                let saved;
                try {
                    saved = JSON.parse(localStorage.getItem(legacyKey) || '{}');
                } catch {
                    saved = {};
                }
                const validDate = (key) =>
                    typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
                const entries = Object.fromEntries(
                    names.map((name) => [
                        name,
                        new Set(Array.isArray(saved?.[name]) ? saved[name].filter(validDate) : []),
                    ]),
                );
                for (const storageKey of Object.keys(localStorage)) {
                    if (!storageKey.startsWith(prefix)) continue;
                    const [name, day] = storageKey.slice(prefix.length).split(':');
                    if (!names.includes(name) || !validDate(day)) continue;
                    const value = localStorage.getItem(storageKey);
                    if (value === '1') entries[name].add(day);
                    else if (value === '0') entries[name].delete(day);
                }
                this.history = Object.fromEntries(names.map((name) => [name, [...entries[name]]]));
            } catch {
                this.localOnly = true;
            }
        },
        get todayKey() {
            return dayKey(this.today);
        },
        get checked() {
            return this.history[this.active] ?? [];
        },
        get days() {
            return Array.from({ length: 28 }, (_, i) =>
                dayKey(shiftDay(this.today, i - 27 + this.offset)),
            );
        },
        get streak() {
            let length = 0,
                cursor = this.checked.includes(this.todayKey) ? 0 : -1;
            while (this.checked.includes(dayKey(shiftDay(this.today, cursor--)))) length++;
            return length;
        },
        moveDays(delta) {
            this.refreshToday();
            this.offset = Math.min(0, this.offset + delta);
        },
        toggleToday() {
            this.refreshToday();
            this.offset = 0;
            this.toggle(this.todayKey);
        },
        toggle(key) {
            this.refreshToday();
            if (!this.days.includes(key) && key !== this.todayKey) return;
            const check = !this.checked.includes(key);
            const next = check
                ? [...this.checked, key]
                : this.checked.filter((item) => item !== key);
            this.history = { ...this.history, [this.active]: next };
            if (this.localOnly) return;
            // Each write changes one habit/day, so another tab's independent edits are preserved.
            try {
                localStorage.setItem(prefix + this.active + ':' + key, check ? '1' : '0');
            } catch {
                this.localOnly = true;
            }
        },
    };
}

const ingredients = [
    {
        id: 'rice',
        name: 'Brown rice',
        kind: 'base',
        price: 300,
        calories: 216,
        protein: 5,
        carbs: 45,
        fat: 2,
        allergens: [],
    },
    {
        id: 'greens',
        name: 'Garden greens',
        kind: 'base',
        price: 250,
        calories: 35,
        protein: 3,
        carbs: 5,
        fat: 0,
        allergens: [],
    },
    {
        id: 'chickpeas',
        name: 'Spiced chickpeas',
        kind: 'topping',
        price: 180,
        calories: 164,
        protein: 9,
        carbs: 27,
        fat: 3,
        allergens: [],
    },
    {
        id: 'tofu',
        name: 'Grilled tofu',
        kind: 'topping',
        price: 240,
        calories: 140,
        protein: 16,
        carbs: 3,
        fat: 7,
        allergens: ['Soy'],
    },
    {
        id: 'sesame',
        name: 'Sesame crunch',
        kind: 'topping',
        price: 90,
        calories: 57,
        protein: 2,
        carbs: 2,
        fat: 5,
        allergens: ['Sesame'],
    },
    {
        id: 'peppers',
        name: 'Roasted peppers',
        kind: 'topping',
        price: 110,
        calories: 40,
        protein: 1,
        carbs: 9,
        fat: 0,
        allergens: [],
    },
];
function mealBuilder() {
    return {
        ingredients,
        base: 'rice',
        toppings: ['chickpeas'],
        excluded: [],
        servings: 1,
        minimumProtein: null,
        maximumCarbs: null,
        maximumFat: null,
        get selected() {
            return ingredients.filter(
                (item) => item.id === this.base || this.toppings.includes(item.id),
            );
        },
        get totals() {
            return this.selected.reduce(
                (sum, item) => ({
                    price: sum.price + item.price * this.servings,
                    calories: sum.calories + item.calories * this.servings,
                    protein: sum.protein + item.protein * this.servings,
                    carbs: sum.carbs + item.carbs * this.servings,
                    fat: sum.fat + item.fat * this.servings,
                }),
                { price: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
            );
        },
        allowed(item) {
            return !item.allergens.some((allergen) => this.excluded.includes(allergen));
        },
        get hasTargets() {
            return [this.minimumProtein, this.maximumCarbs, this.maximumFat].some(
                (limit) => limit !== null,
            );
        },
        get invalidTargets() {
            return [this.minimumProtein, this.maximumCarbs, this.maximumFat].some(
                (limit) => limit !== null && (!Number.isInteger(limit) || limit < 0),
            );
        },
        get nutritionStatus() {
            if (this.invalidTargets) return 'Enter macro targets in whole grams of 0 or more.';
            const { protein, carbs, fat } = this.totals;
            const issues = [];
            if (this.minimumProtein !== null && protein < this.minimumProtein)
                issues.push(`Add ${this.minimumProtein - protein} g protein`);
            if (this.maximumCarbs !== null && carbs > this.maximumCarbs)
                issues.push(`Reduce carbs by ${carbs - this.maximumCarbs} g`);
            if (this.maximumFat !== null && fat > this.maximumFat)
                issues.push(`Reduce fat by ${fat - this.maximumFat} g`);
            return issues.length ? issues.join(' · ') : 'Meal meets your macro targets.';
        },
        toppingIssue(item) {
            if (!this.allowed(item)) return 'Excluded · ' + item.allergens.join(', ');
            if (this.toppings.includes(item.id) || this.invalidTargets) return '';
            const { carbs, fat } = this.totals;
            if (
                item.carbs > 0 &&
                this.maximumCarbs !== null &&
                carbs + item.carbs * this.servings > this.maximumCarbs
            )
                return 'Over carb limit';
            if (
                item.fat > 0 &&
                this.maximumFat !== null &&
                fat + item.fat * this.servings > this.maximumFat
            )
                return 'Over fat limit';
            return '';
        },
        exclude(allergen) {
            this.excluded = this.excluded.includes(allergen)
                ? this.excluded.filter((x) => x !== allergen)
                : [...this.excluded, allergen];
            this.toppings = this.toppings.filter((id) =>
                this.allowed(ingredients.find((item) => item.id === id)),
            );
        },
        money(cents) {
            return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
                cents / 100,
            );
        },
    };
}

export default function registerLab(Alpine) {
    Alpine.data('datePlanner', datePlanner);
    Alpine.data('habitTracker', habitTracker);
    Alpine.data('mealBuilder', mealBuilder);
}
