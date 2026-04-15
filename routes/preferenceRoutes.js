import express from 'express';
import Preference from '../models/Preference.js';

const router = express.Router();

router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    let preference = await Preference.findOne({ deviceId });
    
    if (!preference) {
      preference = new Preference({ deviceId, favoriteRecipeIds: [] });
      await preference.save();
    } else {
      preference.lastActive = new Date();
      await preference.save();
    }
    
    res.json(preference);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:deviceId/favorites', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { recipeId } = req.body;
    
    if (!recipeId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }
    
    let preference = await Preference.findOne({ deviceId });
    
    if (!preference) {
      preference = new Preference({ deviceId, favoriteRecipeIds: [] });
    }
    
    if (!preference.favoriteRecipeIds.includes(recipeId)) {
      preference.favoriteRecipeIds.push(recipeId);
    }
    
    preference.lastActive = new Date();
    await preference.save();
    
    res.json(preference);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:deviceId/favorites/:recipeId', async (req, res) => {
  try {
    const { deviceId, recipeId } = req.params;
    
    const preference = await Preference.findOne({ deviceId });
    
    if (!preference) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    preference.favoriteRecipeIds = preference.favoriteRecipeIds.filter(
      id => id.toString() !== recipeId
    );
    
    preference.lastActive = new Date();
    await preference.save();
    
    res.json(preference);
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;