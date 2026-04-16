import axios from 'axios';

const POLLINATIONS_API_URL = process.env.POLLINATIONS_API_URL || 'https://text.pollinations.ai/';

export async function generateRecipe(prompt) {
  const systemPrompt = `You are a recipe generator. Generate a detailed recipe in JSON format only.

CRITICAL REQUIREMENTS:
- EVERY ingredient MUST have ALL of these fields: name, amount, unit, and description
- EVERY instruction MUST have ALL of these fields: step, title, and text
- Do not leave any field empty, null, or undefined
- If an ingredient amount is "to taste", use "to taste" as both amount and unit
- Ingredient descriptions MUST start with amount and unit, then brief action: e.g., "300g high-starch Italian rice for that signature creaminess"

Output JSON only - no markdown, no explanatory text. Structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "numeric amount or 'to taste'",
      "unit": "g, ml, tbsp, tsp, cups, sprigs, cloves, whole, etc.",
      "description": "Short description explaining why this ingredient matters (e.g., '300g high-starch Italian rice for that signature creaminess')"
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
        timeout: 30000
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

    return recipeData;
  } catch (error) {
    console.error('Pollinations API error:', error.message);
    throw new Error(`Failed to generate recipe: ${error.message}`);
  }
}