import axios from 'axios';

const POLLINATIONS_API_URL = process.env.POLLINATIONS_API_URL || 'https://text.pollinations.ai/';

export async function generateRecipe(prompt) {
  const systemPrompt = `You are a recipe generator. Generate a detailed recipe in JSON format only.

1. The JSON output MUST include ALL of these required top-level fields:
   - "title": Recipe name (string, required)
   - "description": Complete description of the dish in 2-3 sentences (string, REQUIRED - do NOT omit)
   - "ingredients": Array of ingredient objects (required)
   - "instructions": Array of instruction objects (required)
   - "cookingTime": Number in minutes
   - "servings": Number
   - "difficulty": String ("Easy", "Intermediate", or "Advanced")
   - "cuisine": String

2. Every ingredient object MUST have: name, amount, unit, description
3. Every instruction object MUST have: step, title, text
4. Never leave any field empty, null, undefined, or missing
5. If amount is "to taste", use "to taste" for both amount and unit
6. Ingredient descriptions MUST start with amount and unit, then brief action: e.g., "300g high-starch Italian rice for that signature creaminess"

Output JSON only - no markdown, no explanatory text. Structure:
{
  "title": "Recipe name",
  "description": "Complete description of the dish in 2-3 sentences (REQUIRED)",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "numeric amount or 'to taste'",
      "unit": "g, ml, tbsp, tsp, cups, sprigs, cloves, whole, etc.",
      "description": "Short description explaining why this ingredient matters"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "title": "Action-focused title (e.g., 'Toast the Rice')",
      "text": "Detailed instruction text"
    }
  ],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "Easy",
  "cuisine": "Cuisine type"
}`;

  try {
    const response = await axios.post(
      POLLINATIONS_API_URL,
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 10000),
        json: true
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || response.data;
    
    let recipeData;
    if (typeof content === 'string') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse recipe JSON');
      }
    } else {
      recipeData = content;
    }

    if (!recipeData.description) {
      console.error('API response missing description:', {
        title: recipeData.title,
        hasIngredients: !!recipeData.ingredients,
        hasInstructions: !!recipeData.instructions
      });
    }

    return recipeData;
  } catch (error) {
    console.error('Pollinations API error:', error.message);
    throw new Error(`Failed to generate recipe: ${error.message}`);
  }
}