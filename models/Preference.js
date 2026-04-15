import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  favoriteRecipeIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }], default: [] }
}, { timestamps: true });

export default mongoose.model('Preference', preferenceSchema);