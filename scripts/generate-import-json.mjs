import fs from "node:fs";
import path from "node:path";

const products = [
  ["chicken-breast", "Chicken Breast", "protein", 165, 31, 3.6, 0, 0, ["turkey-breast", "tofu-firm"]],
  ["turkey-breast", "Turkey Breast", "protein", 135, 29, 1.5, 0, 0, ["chicken-breast", "tofu-firm"]],
  ["salmon", "Salmon", "protein", 208, 20, 13, 0, 0, ["cod", "tuna-canned"]],
  ["tuna-canned", "Tuna (Canned)", "protein", 116, 26, 1, 0, 0, ["cod", "salmon"]],
  ["cod", "Cod", "protein", 82, 18, 0.7, 0, 0, ["tuna-canned", "salmon"]],
  ["lean-beef", "Lean Beef", "protein", 170, 26, 7, 0, 0, ["turkey-breast", "chicken-breast"]],
  ["egg", "Egg", "protein", 155, 13, 11, 1.1, 0, ["egg-white", "tofu-firm"]],
  ["egg-white", "Egg White", "protein", 52, 11, 0.2, 0.7, 0, ["egg", "tofu-firm"]],
  ["tofu-firm", "Tofu (Firm)", "protein", 144, 17, 8, 3, 2, ["tempeh", "chicken-breast"]],
  ["tempeh", "Tempeh", "protein", 193, 20, 11, 8, 6, ["tofu-firm", "chicken-breast"]],
  ["greek-yogurt", "Greek Yogurt", "dairy", 97, 10, 5, 3.5, 0, ["skyr", "cottage-cheese"]],
  ["skyr", "Skyr", "dairy", 63, 11, 0.2, 4, 0, ["greek-yogurt", "cottage-cheese"]],
  ["cottage-cheese", "Cottage Cheese", "dairy", 98, 11, 4, 3.4, 0, ["skyr", "greek-yogurt"]],
  ["whey-protein", "Whey Protein", "supplement", 400, 80, 6, 8, 0, ["skyr", "greek-yogurt"]],
  ["oats", "Oats", "carb", 389, 16.9, 6.9, 66.3, 10.6, ["quinoa", "whole-wheat-pasta"]],
  ["rice", "Rice", "carb", 130, 2.7, 0.3, 28, 0.4, ["potato", "quinoa"]],
  ["quinoa", "Quinoa", "carb", 120, 4.4, 1.9, 21.3, 2.8, ["rice", "bulgur"]],
  ["whole-wheat-pasta", "Whole Wheat Pasta", "carb", 124, 5, 1.1, 25, 3.2, ["rice", "quinoa"]],
  ["bulgur", "Bulgur", "carb", 83, 3.1, 0.2, 18.6, 4.5, ["quinoa", "rice"]],
  ["potato", "Potato", "carb", 77, 2, 0.1, 17, 2.2, ["sweet-potato", "rice"]],
  ["sweet-potato", "Sweet Potato", "carb", 86, 1.6, 0.1, 20.1, 3, ["potato", "rice"]],
  ["wholegrain-bread", "Wholegrain Bread", "carb", 247, 13, 4.2, 41, 7, ["sourdough-bread", "oats"]],
  ["sourdough-bread", "Sourdough Bread", "carb", 250, 8.5, 1.6, 49, 2.7, ["wholegrain-bread", "rice"]],
  ["banana", "Banana", "fruit", 89, 1.1, 0.3, 23, 2.6, ["apple", "berries-mix"]],
  ["apple", "Apple", "fruit", 52, 0.3, 0.2, 14, 2.4, ["banana", "pear"]],
  ["berries-mix", "Berries Mix", "fruit", 57, 0.7, 0.3, 14, 5, ["apple", "pear"]],
  ["pear", "Pear", "fruit", 57, 0.4, 0.1, 15, 3.1, ["apple", "berries-mix"]],
  ["broccoli", "Broccoli", "vegetable", 34, 2.8, 0.4, 7, 2.6, ["zucchini", "spinach"]],
  ["spinach", "Spinach", "vegetable", 23, 2.9, 0.4, 3.6, 2.2, ["broccoli", "kale"]],
  ["zucchini", "Zucchini", "vegetable", 17, 1.2, 0.3, 3.1, 1, ["broccoli", "bell-pepper"]],
  ["bell-pepper", "Bell Pepper", "vegetable", 31, 1, 0.3, 6, 2.1, ["zucchini", "tomato"]],
  ["tomato", "Tomato", "vegetable", 18, 0.9, 0.2, 3.9, 1.2, ["bell-pepper", "zucchini"]],
  ["cucumber", "Cucumber", "vegetable", 15, 0.7, 0.1, 3.6, 0.5, ["tomato", "zucchini"]],
  ["carrot", "Carrot", "vegetable", 41, 0.9, 0.2, 10, 2.8, ["bell-pepper", "tomato"]],
  ["onion", "Onion", "vegetable", 40, 1.1, 0.1, 9.3, 1.7, ["leek", "shallot"]],
  ["garlic", "Garlic", "vegetable", 149, 6.4, 0.5, 33, 2.1, ["onion", "ginger"]],
  ["avocado", "Avocado", "fat", 160, 2, 14.7, 8.5, 6.7, ["olive-oil", "nuts-mix"]],
  ["olive-oil", "Olive Oil", "fat", 884, 0, 100, 0, 0, ["canola-oil", "avocado"]],
  ["canola-oil", "Canola Oil", "fat", 884, 0, 100, 0, 0, ["olive-oil", "avocado"]],
  ["nuts-mix", "Nuts Mix", "fat", 607, 20, 54, 21, 8, ["almonds", "peanut-butter"]],
  ["almonds", "Almonds", "fat", 579, 21, 50, 22, 12.5, ["nuts-mix", "walnuts"]],
  ["walnuts", "Walnuts", "fat", 654, 15, 65, 14, 6.7, ["almonds", "nuts-mix"]],
  ["peanut-butter", "Peanut Butter", "fat", 588, 25, 50, 20, 6, ["almonds", "nuts-mix"]],
  ["chia-seeds", "Chia Seeds", "seed", 486, 17, 31, 42, 34, ["flax-seeds", "oats"]],
  ["flax-seeds", "Flax Seeds", "seed", 534, 18, 42, 29, 27, ["chia-seeds", "oats"]],
  ["hummus", "Hummus", "spread", 166, 8, 10, 14, 6, ["avocado", "cottage-cheese"]],
  ["chickpeas", "Chickpeas", "legume", 164, 8.9, 2.6, 27.4, 7.6, ["lentils", "black-beans"]],
  ["lentils", "Lentils", "legume", 116, 9, 0.4, 20, 8, ["chickpeas", "black-beans"]],
  ["black-beans", "Black Beans", "legume", 132, 8.9, 0.5, 24, 8.7, ["lentils", "chickpeas"]],
  ["shrimp", "Shrimp", "protein", 99, 24, 0.3, 0.2, 0, ["cod", "tuna-canned"]],
  ["milk-1-5", "Milk 1.5%", "dairy", 47, 3.4, 1.5, 4.8, 0, ["soy-milk", "almond-milk"]],
  ["soy-milk", "Soy Milk", "dairy", 45, 3.2, 1.8, 3.1, 0.6, ["milk-1-5", "almond-milk"]],
  ["almond-milk", "Almond Milk", "dairy", 15, 0.6, 1.2, 0.5, 0.2, ["soy-milk", "milk-1-5"]],
  ["rice-cake", "Rice Cake", "carb", 387, 8, 3, 81, 3.5, ["wholegrain-bread", "sourdough-bread"]],
  ["dark-chocolate", "Dark Chocolate", "snack", 546, 4.9, 31, 61, 7, ["berries-mix", "nuts-mix"]],
  ["honey", "Honey", "sweetener", 304, 0.3, 0, 82, 0.2, ["banana", "apple"]],
  ["parmesan", "Parmesan", "dairy", 431, 38, 29, 4.1, 0, ["cottage-cheese", "greek-yogurt"]],
  ["mozzarella-light", "Light Mozzarella", "dairy", 254, 24, 15, 3, 0, ["cottage-cheese", "parmesan"]],
  ["rocket", "Rocket", "vegetable", 25, 2.6, 0.7, 3.7, 1.6, ["spinach", "lettuce"]],
  ["lettuce", "Lettuce", "vegetable", 15, 1.4, 0.2, 2.9, 1.3, ["rocket", "spinach"]],
  ["mushroom", "Mushroom", "vegetable", 22, 3.1, 0.3, 3.3, 1, ["zucchini", "broccoli"]],
  ["ginger", "Ginger", "vegetable", 80, 1.8, 0.8, 18, 2, ["garlic", "onion"]],
  ["lemon", "Lemon", "fruit", 29, 1.1, 0.3, 9.3, 2.8, ["lime", "apple"]],
  ["lime", "Lime", "fruit", 30, 0.7, 0.2, 10.5, 2.8, ["lemon", "apple"]],
  ["pesto", "Pesto", "sauce", 460, 5, 47, 6, 1, ["olive-oil", "parmesan"]],
  ["tomato-passata", "Tomato Passata", "sauce", 33, 1.6, 0.2, 5.6, 1.2, ["tomato", "bell-pepper"]],
  ["corn", "Corn", "vegetable", 86, 3.3, 1.4, 19, 2.7, ["peas", "chickpeas"]],
  ["peas", "Peas", "vegetable", 81, 5.4, 0.4, 14, 5, ["corn", "green-beans"]],
  ["green-beans", "Green Beans", "vegetable", 31, 1.8, 0.1, 7, 3.4, ["peas", "broccoli"]]
].map(([id, name, category, kcal, protein, fat, carbs, fiber, subs]) => ({
  id,
  name,
  category,
  kcal_per_100g: kcal,
  protein_per_100g: protein,
  fat_per_100g: fat,
  carbs_per_100g: carbs,
  fiber_per_100g: fiber,
  allowed_substitutes: subs
}));

const pools = {
  breakfast: {
    proteins: ["egg", "egg-white", "greek-yogurt", "skyr", "cottage-cheese", "whey-protein", "tofu-firm"],
    carbs: ["oats", "wholegrain-bread", "sourdough-bread", "banana", "berries-mix", "apple", "rice-cake"],
    fats: ["almonds", "peanut-butter", "chia-seeds", "flax-seeds", "nuts-mix"],
    veg: ["spinach", "tomato", "cucumber"]
  },
  lunch: {
    proteins: ["chicken-breast", "turkey-breast", "tuna-canned", "salmon", "tofu-firm", "tempeh", "lean-beef"],
    carbs: ["rice", "quinoa", "whole-wheat-pasta", "bulgur", "potato", "sweet-potato"],
    fats: ["olive-oil", "avocado", "parmesan", "mozzarella-light"],
    veg: ["broccoli", "zucchini", "bell-pepper", "tomato", "onion", "mushroom", "rocket", "lettuce"]
  },
  dinner: {
    proteins: ["salmon", "cod", "shrimp", "chicken-breast", "tofu-firm", "lentils", "chickpeas"],
    carbs: ["quinoa", "rice", "potato", "whole-wheat-pasta", "black-beans"],
    fats: ["olive-oil", "avocado", "pesto"],
    veg: ["broccoli", "spinach", "zucchini", "tomato", "green-beans", "peas", "corn"]
  },
  snack: {
    proteins: ["skyr", "greek-yogurt", "cottage-cheese", "whey-protein", "egg-white"],
    carbs: ["banana", "apple", "berries-mix", "pear", "rice-cake", "honey"],
    fats: ["almonds", "walnuts", "peanut-butter", "dark-chocolate", "chia-seeds"],
    veg: ["cucumber", "tomato", "carrot"]
  }
};

function pick(arr, index) {
  return arr[index % arr.length];
}

function ingredient(product_id, amount_g) {
  return { product_id, amount_g };
}

const recipes = [];
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

for (let i = 1; i <= 100; i += 1) {
  const mealType = mealTypes[(i - 1) % mealTypes.length];
  const pool = pools[mealType];

  const p1 = pick(pool.proteins, i);
  const c1 = pick(pool.carbs, i * 2);
  const f1 = pick(pool.fats, i * 3);
  const v1 = pick(pool.veg, i * 5);
  const v2 = pick(pool.veg, i * 7 + 1);

  const baseProtein = mealType === "snack" ? 120 : mealType === "breakfast" ? 140 : 180;
  const baseCarb = mealType === "snack" ? 80 : mealType === "breakfast" ? 90 : 160;
  const baseFat = mealType === "snack" ? 20 : 15;
  const baseVeg = mealType === "snack" ? 40 : 100;

  const ingredients = [
    ingredient(p1, baseProtein + (i % 3) * 20),
    ingredient(c1, baseCarb + (i % 4) * 15),
    ingredient(f1, baseFat + (i % 3) * 5),
    ingredient(v1, baseVeg + (i % 4) * 20),
    ingredient(v2, baseVeg - 20 + (i % 3) * 10)
  ];

  recipes.push({
    id: `recipe-${String(i).padStart(3, "0")}`,
    name: `${mealType[0].toUpperCase()}${mealType.slice(1)} Power Meal ${String(i).padStart(3, "0")}`,
    description: `Balanced ${mealType} recipe with high protein and controlled calories.`,
    mealType,
    tags: [mealType, "high-protein", i % 2 === 0 ? "quick" : "batch"],
    instructions: [
      "Prepare all ingredients and weigh portions.",
      `Cook the main protein (${p1}) and carbohydrate source (${c1}).`,
      `Add vegetables (${v1}, ${v2}) and finish with ${f1}.`,
      "Taste, adjust seasoning, and serve warm."
    ],
    ingredients
  });
}

const payload = {
  products,
  recipes
};

const outPath = path.join(process.cwd(), "public", "data", "import-100-recipes.json");
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Products: ${products.length}, Recipes: ${recipes.length}`);
