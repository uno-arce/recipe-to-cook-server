import axios from 'axios';

const POLLINATIONS_API_URL = process.env.POLLINATIONS_API_URL || 'https://text.pollinations.ai/';

export async function generateRecipe(prompt) {
  const systemPrompt = `You are a recipe generator. Generate a detailed recipe in JSON format only. 
Do not include any additional text or markdown. The JSON should have this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": [{"name": "ingredient name", "amount": "amount", "unit": "unit"}],
  "instructions": [{"step": 1, "text": "instruction text"}],
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