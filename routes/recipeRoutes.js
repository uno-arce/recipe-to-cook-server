import express from 'express';
import Recipe from '../models/Recipe.js';
import { generateRecipe } from '../services/pollinationsService.js';

const router = express.Router();

function buildImagePrompts(recipe) {
  const { title, description, instructions } = recipe;

  const heroPrompt = `${title}, ${description} in a dark stoneware bowl, dramatic kitchen lighting, professional food photography, 8k resolution, restaurant quality presentation`;

  const stepPrompts = instructions.map((inst) => {
    const material = Math.random() > 0.5 ? 'heavy cast iron pan' : 'stainless steel pan';
    return `Close-up of ${inst.title.toLowerCase()}: ${inst.text.slice(0, 80)} in a ${material}, warm kitchen lighting, steam rising, atmospheric cooking shot, macro lens`;
  });

  return [heroPrompt, ...stepPrompts];
}

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const recipeData = await generateRecipe(prompt);
    
    if (!recipeData) {
      return res.status(500).json({ error: 'Failed to generate recipe' });
    }

    if (!recipeData.title) {
      throw new Error('API response missing required field: title');
    }

    if (!recipeData.description) {
      throw new Error('API response missing required field: description');
    }

    const instructions = recipeData.instructions || [];
    const ingredients = recipeData.ingredients || [];
    const title = recipeData.title;
    const description = recipeData.description;

    const imagePrompts = buildImagePrompts({ title, description, instructions });

    const recipe = new Recipe({
      title,
      description,
      ingredients,
      instructions,
      cookingTime: recipeData.cookingTime || 30,
      servings: recipeData.servings || 4,
      difficulty: recipeData.difficulty || 'Easy',
      cuisine: recipeData.cuisine || 'General',
      aiMetadata: {
        textModel: 'pollinations',
        imageModel: 'cloudflare-stable-diffusion',
        generationPrompt: prompt
      },
      imagePrompts
    });

    const savedRecipe = await recipe.save();
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write(`data: ${JSON.stringify({ type: 'recipe', data: savedRecipe })}\n\n`);

    try {
      const { heroPrompt, stepPrompts } = {
        heroPrompt: imagePrompts[0],
        stepPrompts: imagePrompts.slice(1)
      };
      const heroImage = await generateImage(heroPrompt);
      
      await Recipe.findByIdAndUpdate(savedRecipe._id, { heroImage });
      
      res.write(`data: ${JSON.stringify({ type: 'hero', data: heroImage })}\n\n`);

      for (let i = 0; i < stepPrompts.length; i++) {
        const stepImage = await generateImage(stepPrompts[i]);
        res.write(`data: ${JSON.stringify({ type: 'step', index: i, data: stepImage })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    } catch (imageError) {
      console.error('Image generation failed:', imageError.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: imageError.message })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

async function generateImage(prompt) {
  const { generateImage: cloudflareGenerateImage } = await import('../services/cloudflareService.js');
  return cloudflareGenerateImage(prompt);
}

router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/regenerate-images', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    try {
      const imagePrompts = buildImagePrompts({
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions
      });
      const { heroPrompt, stepPrompts } = {
        heroPrompt: imagePrompts[0],
        stepPrompts: imagePrompts.slice(1)
      };
      const heroImage = await generateImage(heroPrompt);
      
      await Recipe.findByIdAndUpdate(recipe._id, { heroImage });
      
      res.write(`data: ${JSON.stringify({ type: 'hero', data: heroImage })}\n\n`);

      for (let i = 0; i < stepPrompts.length; i++) {
        const stepImage = await generateImage(stepPrompts[i]);
        res.write(`data: ${JSON.stringify({ type: 'step', index: i, data: stepImage })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    } catch (imageError) {
      console.error('Image regeneration failed:', imageError.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: imageError.message })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Error regenerating images:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

export default router;