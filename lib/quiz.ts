// Consultation quiz metadata — mirrors the storefront's
// ecommerce/src/data/quizQuestions.ts. The CRM is a separate repo and cannot
// import from the storefront, so the shape needed to render/segment quiz
// answers is duplicated here. Answer values are stored verbatim (the selected
// option text / scale number / grid record) in quiz_results.answers, keyed by
// the question id as a string. Keep option strings byte-identical to the
// storefront or segmentation (exact-match on arrays) will silently miss rows.

export type QuizType =
  | "single-select"
  | "multi-select"
  | "multi-select-other"
  | "scale"
  | "multi-scale-grid"
  | "yes-no"
  | "drag-rank"
  | "free-text";

export type QuizMeta = {
  id: number;
  section: 1 | 2 | 3;
  sectionTitle: string;
  question: string;
  type: QuizType;
  options?: string[];
  scale?: { min: number; max: number; minLabel: string; maxLabel: string };
  gridRows?: { label: string; min: number; max: number; minLabel: string; maxLabel: string }[];
};

export const QUIZ_SECTIONS: Record<1 | 2 | 3, string> = {
  1: "About You",
  2: "Your Skin",
  3: "Your Routine & Preferences",
};

export const QUIZ_SCHEMA: QuizMeta[] = [
  { id: 1, section: 1, sectionTitle: "About You", question: "How old are you?", type: "single-select", options: ["Under 25", "25–34", "35–44", "45–54", "55–64", "65+"] },
  { id: 2, section: 1, sectionTitle: "About You", question: "What is your biological sex?", type: "single-select", options: ["Female", "Male", "Prefer not to say"] },
  { id: 3, section: 1, sectionTitle: "About You", question: "Where do you live?", type: "single-select", options: ["Northern Europe (Scandinavia, Baltics, UK, Ireland)", "Central Europe (Germany, Poland, Czech Rep., Austria, Switzerland)", "Southern Europe (Mediterranean, Balkans)", "Eastern Europe (Romania, Bulgaria, Ukraine, Russia)", "North America", "Asia / Middle East", "Other"] },
  { id: 4, section: 1, sectionTitle: "About You", question: "How would you describe your environment?", type: "single-select", options: ["Urban / City centre", "Suburban", "Rural / Countryside"] },
  { id: 5, section: 1, sectionTitle: "About You", question: "How much water do you drink daily?", type: "scale", scale: { min: 1, max: 5, minLabel: "Less than 1L", maxLabel: "2L+" } },
  { id: 6, section: 1, sectionTitle: "About You", question: "How many hours of sleep do you typically get?", type: "scale", scale: { min: 1, max: 5, minLabel: "<5 hours", maxLabel: "8+ hours" } },
  { id: 7, section: 1, sectionTitle: "About You", question: "How would you rate your daily stress level?", type: "scale", scale: { min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" } },
  { id: 8, section: 1, sectionTitle: "About You", question: "How would you describe your diet?", type: "multi-scale-grid", gridRows: [
    { label: "Vegetables & Fruits", min: 1, max: 5, minLabel: "Rarely", maxLabel: "Daily" },
    { label: "Dairy", min: 1, max: 5, minLabel: "Rarely", maxLabel: "Daily" },
    { label: "Sugar & Processed Foods", min: 1, max: 5, minLabel: "Rarely", maxLabel: "Daily" },
    { label: "Omega-Rich Foods: Fish, Nuts, Seeds", min: 1, max: 5, minLabel: "Rarely", maxLabel: "Daily" },
  ] },
  { id: 9, section: 1, sectionTitle: "About You", question: "How much daily sun exposure do you get?", type: "scale", scale: { min: 1, max: 5, minLabel: "Minimal (<30 min)", maxLabel: "Very high (4+ hrs)" } },
  { id: 10, section: 1, sectionTitle: "About You", question: "Are you currently pregnant or breastfeeding?", type: "yes-no", options: ["Yes", "No"] },
  { id: 11, section: 2, sectionTitle: "Your Skin", question: "How would you describe your skin type?", type: "single-select", options: ["Oily: shiny all over, especially T-zone", "Dry: tight, flaky, sometimes rough", "Combination: oily T-zone, dry cheeks", "Sensitive: easily irritated, reactive to new products"] },
  { id: 12, section: 2, sectionTitle: "Your Skin", question: "What are your biggest skin concerns right now?", type: "multi-select", options: ["Breakouts or blemishes", "Dryness or dehydration", "Oiliness or excess shine", "Fine lines or wrinkles", "Lack of firmness", "Uneven skin tone or dark spots", "Enlarged pores", "Redness or irritation", "Dullness or tired-looking skin", "Sensitivity or reactivity", "Under-eye concerns (dark circles, puffiness)", "Texture irregularities"] },
  { id: 13, section: 2, sectionTitle: "Your Skin", question: "How sensitive is your skin to the sun?", type: "scale", scale: { min: 1, max: 5, minLabel: "Never burns", maxLabel: "Burns very easily" } },
  { id: 14, section: 2, sectionTitle: "Your Skin", question: "How does your skin feel after cleansing with just water?", type: "single-select", options: ["Tight and dry: needs moisture immediately", "Comfortable: feels balanced", "Slightly oily: shine returns quickly", "Irritated or red: even water feels harsh"] },
  { id: 15, section: 2, sectionTitle: "Your Skin", question: "How often do you experience breakouts?", type: "single-select", options: ["Rarely or never", "Occasionally, a few times per year", "Monthly, often around my cycle", "Frequently, multiple times per month", "Constantly, always dealing with some form of breakout"] },
  { id: 16, section: 2, sectionTitle: "Your Skin", question: "Do you experience any of the following?", type: "multi-select", options: ["Rosacea or redness-prone skin", "Eczema or atopic dermatitis", "Psoriasis", "Hormonal acne (jawline, chin)", "Melasma or post-inflammatory hyperpigmentation", "Contact allergies to cosmetic ingredients", "None of the above"] },
  { id: 17, section: 2, sectionTitle: "Your Skin", question: "How visible are your pores?", type: "scale", scale: { min: 1, max: 5, minLabel: "Barely visible", maxLabel: "Extremely visible" } },
  { id: 18, section: 2, sectionTitle: "Your Skin", question: "How would you describe your skin tone?", type: "single-select", options: ["Very fair: burns easily, rarely tans", "Fair: sometimes burns, tans gradually", "Medium: rarely burns, tans well", "Olive: almost never burns", "Dark: never burns", "Very dark"] },
  { id: 19, section: 2, sectionTitle: "Your Skin", question: "Rate the following about your skin right now.", type: "multi-scale-grid", gridRows: [
    { label: "Hydration Level", min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
    { label: "Oiliness Level", min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
    { label: "Redness Level", min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
    { label: "Firmness / Elasticity", min: 1, max: 5, minLabel: "Very low", maxLabel: "Very high" },
  ] },
  { id: 20, section: 2, sectionTitle: "Your Skin", question: "Have you ever had an allergic reaction to a skincare product?", type: "single-select", options: ["No, never", "Yes, to fragrance or essential oils", "Yes, to a specific active ingredient", "Yes, but I’m not sure what caused it", "I have multiple known sensitivities"] },
  { id: 21, section: 3, sectionTitle: "Your Routine & Preferences", question: "How many steps is your current skincare routine?", type: "single-select", options: ["1 step: I just wash my face", "2 steps: cleanser + moisturiser", "3–4 steps: cleanser, serum, moisturiser, SPF", "5+ steps: I have an elaborate routine", "I don’t have a routine yet"] },
  { id: 22, section: 3, sectionTitle: "Your Routine & Preferences", question: "What texture do you prefer in a moisturiser?", type: "single-select", options: ["Lightweight gel: absorbs instantly, no residue", "Lotion: light but hydrating", "Cream: rich and nourishing", "Balm / Oil: very rich, cocooning", "I’m not sure, surprise me"] },
  { id: 23, section: 3, sectionTitle: "Your Routine & Preferences", question: "What type of cleanser do you prefer?", type: "single-select", options: ["Foaming / Gel cleanser: fresh, squeaky-clean feel", "Cream / Milk cleanser: soft, non-stripping", "Oil / Balm cleanser: dissolves everything, luxurious", "Micellar / Lotion: gentle, no-rinse", "I’m not sure, recommend one for me"] },
  { id: 24, section: 3, sectionTitle: "Your Routine & Preferences", question: "Rank these skincare priorities from most to least important.", type: "drag-rank", options: ["Anti-aging (wrinkles, firmness, elasticity)", "Brightening (even tone, radiance)", "Hydration (plump, dewy, moisturised)", "Calming (reduce redness, soothe irritation)", "Clarifying (control oil, minimise breakouts)", "Repair (strengthen barrier, heal damage)"] },
  { id: 25, section: 3, sectionTitle: "Your Routine & Preferences", question: "Which ingredient philosophies matter to you?", type: "multi-select", options: ["Clean beauty: no parabens, SLS, silicones", "Natural / botanical-forward formulas", "Science-first: proven clinical actives", "Fragrance-free", "Vegan / cruelty-free", "Sustainably sourced ingredients", "I don’t have strong preferences"] },
  { id: 26, section: 3, sectionTitle: "Your Routine & Preferences", question: "How adventurous are you with skincare ingredients?", type: "scale", scale: { min: 1, max: 5, minLabel: "Very cautious", maxLabel: "I’ll try anything" } },
  { id: 27, section: 3, sectionTitle: "Your Routine & Preferences", question: "Have you used retinol or retinoids before?", type: "single-select", options: ["No, never", "Tried once or twice, didn’t stick with it", "Yes, occasionally. I use it a few times a month", "Yes, regularly. It’s part of my routine", "I use prescription-strength retinoids"] },
  { id: 28, section: 3, sectionTitle: "Your Routine & Preferences", question: "How much time do you spend on your skincare routine?", type: "single-select", options: ["Under 2 minutes, I want it fast", "2–5 minutes, quick but considered", "5–10 minutes, I enjoy the process", "10+ minutes, skincare is my ritual"] },
  { id: 29, section: 3, sectionTitle: "Your Routine & Preferences", question: "Is there anything you’d like to avoid in your products?", type: "multi-select", options: ["Fragrance / essential oils", "Retinol / retinoids", "Exfoliating acids (AHA, BHA)", "Silicones", "PEGs", "Alcohol (denat.)", "Nothing specific, I’m open to everything"] },
  { id: 30, section: 3, sectionTitle: "Your Routine & Preferences", question: "Do you have any known skin allergies?", type: "multi-select-other", options: ["Fragrance / essential oils", "Lanolin", "Propylene glycol", "Formaldehyde / formaldehyde releasers", "Cocamidopropyl betaine", "Parabens", "Nickel (in cosmetic packaging)", "Latex (natural rubber)", "None that I know of", "Other"] },
  { id: 31, section: 3, sectionTitle: "Your Routine & Preferences", question: "Would you like fragrance in your products?", type: "single-select", options: ["No fragrance", "Light, fresh botanical notes", "Warm, earthy undertones"] },
];

export const QUIZ_BY_ID: Record<number, QuizMeta> = Object.fromEntries(QUIZ_SCHEMA.map((q) => [q.id, q]));

export function quizOptions(id: number): string[] {
  return QUIZ_SCHEMA.find((q) => q.id === id)?.options ?? [];
}
