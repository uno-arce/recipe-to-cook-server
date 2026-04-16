import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true },
  unit: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: { type: [ingredientSchema], required: true },
  instructions: { type: [instructionSchema], required: true },
  cookingTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  difficulty: { type: String, required: true },
  cuisine: { type: String, required: true },
  aiMetadata: {
    textModel: { type: String, default: 'pollinations' },
    imageModel: { type: String, default: 'cloudflare-stable-diffusion' },
    generationPrompt: { type: String }
  },
  imagePrompts: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('Recipe', recipeSchema);