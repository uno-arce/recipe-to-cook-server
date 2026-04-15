import axios from 'axios';

const CLOUDFLARE_IMAGE_URL = process.env.CLOUDFLARE_IMAGE_URL;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;

export async function generateImage(prompt) {
  if (!CLOUDFLARE_IMAGE_URL || !CLOUDFLARE_API_KEY) {
    throw new Error('Cloudflare image service not configured');
  }

  try {
    const response = await axios.post(
      CLOUDFLARE_IMAGE_URL,
      { prompt },
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    return dataUrl;
  } catch (error) {
    console.error('Cloudflare AI error:', error.message);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

export async function generateRecipeImages(recipe) {
  const images = {};
  
  const heroPrompt = `Professional food photography of ${recipe.title}, ${recipe.description}, warm lighting, appetizing presentation, restaurant quality`;
  images.hero = await generateImage(heroPrompt);

  const stepImages = [];
  for (const instruction of recipe.instructions) {
    const stepPrompt = `Cooking step ${instruction.step}: ${instruction.text}, professional kitchen photography, clean presentation`;
    const stepImage = await generateImage(stepPrompt);
    stepImages.push(stepImage);
  }
  images.steps = stepImages;

  return images;
}