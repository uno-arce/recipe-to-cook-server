import express from 'express';
import Recipe from '../models/Recipe.js';
import { generateRecipe } from '../services/pollinationsService.js';
import { generateRecipeImages } from '../services/cloudflareService.js';

const router = express.Router();

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

    const instructions = recipeData.instructions || [];
    const ingredients = recipeData.ingredients || [];
    const title = recipeData.title || 'Untitled Recipe';
    const description = recipeData.description || '';

    const imagePrompts = [
      `Professional food photography of ${title}, ${description}, warm lighting, appetizing presentation`,
      ...instructions.map((inst, idx) => 
        `Cooking step ${idx + 1}: ${inst.text}, professional kitchen photography`
      )
    ];

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
    
    const images = await generateRecipeImages(savedRecipe);
    
    res.json({
      recipe: savedRecipe,
      images
    });
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

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

    const images = await generateRecipeImages(recipe);
    res.json({ images });
  } catch (error) {
    console.error('Error regenerating images:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;