// Nutritionix API credentials
const APP_ID = 'ab18fb15';
const API_KEY = '413db1803e4c117b023991f9dcea88b4';

async function fetchNutritionInfo(query) {
    try {
        const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': APP_ID,
                'x-app-key': API_KEY,
            },
            body: JSON.stringify({ query: query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('Error in fetchNutritionInfo:', error);
        throw error;
    }
}

function generateRecipe(ingredients, mealType, targetCalories) {
    const recipes = {
        breakfast: [
            { name: "Protein-Packed Omelette", template: "Beat 3 eggs, add {0} and {1}, cook in a pan until set. Serve with a slice of whole grain toast." },
            { name: "Power Smoothie Bowl", template: "Blend {0}, {1}, Greek yogurt, and milk. Top with {2} and a drizzle of honey." },
            { name: "Savory Breakfast Burrito", template: "Wrap scrambled eggs, {0}, {1}, and {2} in a large tortilla. Serve with salsa on the side." }
        ],
        lunch: [
            { name: "Nutrient-Dense Salad", template: "Mix chopped {0}, {1}, and {2} with leafy greens. Top with grilled chicken and light dressing." },
            { name: "Hearty Grain Bowl", template: "Combine quinoa, roasted {0}, sautéed {1}, and {2}. Drizzle with olive oil and lemon juice." },
            { name: "Protein-Rich Wrap", template: "Fill a large wrap with grilled {0}, {1}, {2}, and hummus. Serve with a side of mixed nuts." }
        ],
        dinner: [
            { name: "Balanced Plate", template: "Grill {0}, serve with roasted {1} and steamed {2}. Add a small baked sweet potato on the side." },
            { name: "Stir-Fry Delight", template: "Stir-fry {0}, {1}, and {2} with tofu. Serve over brown rice with a sprinkle of sesame seeds." },
            { name: "Baked Protein Feast", template: "Bake {0} with lemon and herbs. Serve with a {1} and {2} quinoa pilaf and steamed broccoli." }
        ],
        snack: [
            { name: "Energy Bites", template: "Mix oats, nut butter, {0}, {1}, and {2}. Form into small balls and refrigerate." },
            { name: "Protein-Packed Smoothie", template: "Blend protein powder, {0}, {1}, and {2} with almond milk and ice." },
            { name: "Savory Snack Plate", template: "Arrange slices of {0}, {1}, and {2} with whole grain crackers and hummus." }
        ]
    };

    const recipe = recipes[mealType][Math.floor(Math.random() * recipes[mealType].length)];
    const usedIngredients = ingredients.sort(() => 0.5 - Math.random()).slice(0, 3);
    const filledTemplate = recipe.template.replace(/\{(\d+)\}/g, (_, index) => usedIngredients[index] || ingredients[Math.floor(Math.random() * ingredients.length)]);

    return {
        name: recipe.name,
        instructions: filledTemplate,
        ingredientList: usedIngredients.join(", ")
    };
}

async function generateMealPlan() {
    const calorieGoal = parseInt(document.getElementById('calorieGoal').value);
    const ingredients = document.getElementById('ingredients').value.split(',').map(item => item.trim());
    const mealFrequency = parseInt(document.getElementById('mealFrequency').value);
    const duration = parseInt(document.getElementById('duration').value);

    let mealPlan = [];
    let remainingCalories = calorieGoal;

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    for (let i = 0; i < mealFrequency; i++) {
        const mealCalories = Math.round(remainingCalories / (mealFrequency - i));
        const mealType = mealTypes[i % mealTypes.length];
        const recipe = generateRecipe(ingredients, mealType, mealCalories);

        try {
            console.log('Fetching nutrition info for:', recipe.name);
            const nutritionInfo = await fetchNutritionInfo(recipe.name + " with " + recipe.ingredientList);
            const totalCalories = nutritionInfo.foods.reduce((sum, food) => sum + food.nf_calories, 0);
            
            mealPlan.push({
                time: getMealTime(i, mealFrequency),
                mealType: mealType,
                meal: recipe.name,
                calories: Math.round(totalCalories),
                recipe: recipe.instructions,
                ingredients: recipe.ingredientList
            });
            remainingCalories -= Math.round(totalCalories);
        } catch (error) {
            console.error('Error generating meal:', error);
            mealPlan.push({
                time: getMealTime(i, mealFrequency),
                mealType: mealType,
                meal: `Error generating meal: ${error.message}`,
                calories: 0,
                recipe: 'N/A',
                ingredients: 'N/A'
            });
        }
    }

    displayMealPlan({ dailyPlan: mealPlan, totalCalories: calorieGoal });
}

function getMealTime(index, totalMeals) {
    const startHour = 7;
    const endHour = 21;
    const interval = (endHour - startHour) / (totalMeals - 1);
    const hour = Math.round(startHour + index * interval);
    return `${hour}:00`;
}

function displayMealPlan(mealPlan) {
    const mealPlanDiv = document.getElementById('mealPlan');
    let html = '<h2>Your Meal Plan</h2>';
    
    mealPlan.dailyPlan.forEach(meal => {
        html += `
            <div class="meal">
                <h3>${meal.time} - ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}</h3>
                <p><strong>Meal:</strong> ${meal.meal}</p>
                <p><strong>Calories:</strong> ${meal.calories}</p>
                <p><strong>Ingredients:</strong> ${meal.ingredients}</p>
                <p><strong>Recipe:</strong> ${meal.recipe}</p>
            </div>
        `;
    });

    html += `<p><strong>Total Daily Calories:</strong> ${mealPlan.totalCalories}</p>`;
    
    mealPlanDiv.innerHTML = html;
}

// Test API connection
async function testAPIConnection() {
    try {
        const result = await fetchNutritionInfo('1 apple');
        console.log('API Test Successful:', result);
        alert('API connection successful! Check console for details.');
    } catch (error) {
        console.error('API Test Failed:', error);
        alert('API connection failed. Check console for error details.');
    }
}

// Call this function when the page loads
window.onload = testAPIConnection;