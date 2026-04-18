import axios from 'axios';

const POLLINATIONS_API_URL = process.env.POLLINATIONS_API_URL || 'https://text.pollinations.ai/';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

async function generateRecipeInternal(prompt) {
  const systemPrompt = `You are a recipe generator. Generate a detailed recipe in JSON format only.

CRITICAL - The most important requirements:
1. "title" field is MANDATORY - MUST be a recipe name (e.g., "Creamy Mushroom Risotto")
2. "description" field is MANDATORY - 2-3 sentences describing the dish, its flavors, and appeal. This is THE MOST IMPORTANT field - the entire recipe structure depends on it.
3. NEVER omit "description" - if you cannot create a description, DO NOT respond with partial JSON

All required fields (ALL MUST BE PRESENT):
- "title": Recipe name (mandatory)
- "description": 2-3 sentence description of the dish (MANDATORY - most critical field)
- "ingredients": Array with name, amount, unit, description for each
- "instructions": Array with step number, title, and text for each
- "cookingTime": Number (minutes)
- "servings": Number
- "difficulty": "Easy", "Intermediate", or "Advanced"
- "cuisine": Cuisine type

Rules:
- NEVER use null, undefined, or empty strings for any required field
- If amount is "to taste", use "to taste" for both amount and unit
- Ingredient descriptions: include amount, unit, and brief why it matters

Output only valid JSON - no markdown, no explanatory text.
{
  "title": "Recipe name",
  "description": "A complete 2-3 sentence description of the dish - its flavors, textures, and what makes it special (REQUIRED)",
  "ingredients": [...],
  "instructions": [...],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "Easy",
  "cuisine": "Italian"
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

export async function generateRecipe(prompt) {
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      return await generateRecipeInternal(prompt);
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = status === 502 || status === 503 || status === 504 || error.code === 'ECONNRESET';
      
      if (isRetryable && attempt < MAX_RETRIES - 1) {
        console.log(`Pollinations API error ${status || error.code}, retrying in ${RETRY_DELAYS[attempt]}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        attempt++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate recipe after retries');
}