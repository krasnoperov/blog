import { injectable } from 'inversify';
import { GoogleGenAI } from '@google/genai';

export interface NanoBananaOptions {
  prompt: string;
  model?: string;
}

export interface NanoBananaResult {
  imageUrl: string;
  prompt: string;
  model: string;
}

/**
 * Service for generating infographics using Google's Gemini image generation (Nano Banana)
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
@injectable()
export class NanoBananaService {
  // Using Gemini 3 Pro Image Preview for high-quality generation
  // Alternative: gemini-2.5-flash-image for faster, lower-quality generation
  private readonly DEFAULT_MODEL = 'gemini-3-pro-image-preview';

  private readonly ai: GoogleGenAI;

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Google AI Studio API key is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateInfographic(options: NanoBananaOptions): Promise<NanoBananaResult> {
    const {
      prompt,
      model = this.DEFAULT_MODEL,
    } = options;

    if (!prompt) {
      throw new Error('Prompt is required for infographic generation');
    }

    console.log('NanoBananaService: Generating infographic with Gemini', {
      model,
      promptLength: prompt.length,
    });

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });

      console.log('Gemini response received');

      // Get the generated image from the response
      // The image is returned in the first part's inline data
      if (!response.candidates || response.candidates.length === 0) {
        console.error('No candidates in response:', JSON.stringify(response, null, 2));
        throw new Error('No image generated from Gemini API');
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('No content parts in candidate:', JSON.stringify(candidate, null, 2));
        throw new Error('No image data in Gemini response');
      }

      // Find the part with inline data (the image)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        console.error('No inline data found in parts:', JSON.stringify(candidate.content.parts, null, 2));
        throw new Error('No image data found in Gemini response');
      }

      const { mimeType, data } = imagePart.inlineData;

      if (!data) {
        throw new Error('No image data in inline data');
      }

      console.log('Image generated successfully:', { mimeType, dataLength: data.length });

      // Convert base64 to data URL
      const imageUrl = `data:${mimeType};base64,${data}`;

      return {
        imageUrl,
        prompt,
        model,
      };
    } catch (error) {
      console.error('NanoBananaService: Failed to generate infographic', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if ('response' in error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error('API response:', (error as any).response);
        }
      }
      throw error;
    }
  }

  /**
   * Generate an infographic prompt from episode summary and glossary
   */
  generatePromptFromEpisode(summary: string, glossaryEntries?: Array<{ term: string; definition: string }>): string {
    // Include examples with translations/definitions
    const examples = glossaryEntries && glossaryEntries.length > 0
      ? glossaryEntries.slice(0, 5).map(e => `${e.term}: ${e.definition}`).join('\n')
      : '';

    return `Create a light, minimal infographic showing language connections through examples.

Visual Style - LIGHT AND MINIMAL:
- Very light background (cream, soft white, or pale warm color)
- Minimal text - focus on examples and how they connect
- NO heavy blocks, NO boxes, NO bold headings
- Use gentle flowing lines or hand-drawn arrows to show connections
- Soft, subtle colors (pastels, light accent colors)
- Hand-drawn style (organic, not geometric)
- Examples should flow naturally like sketched notes
- Show the RELATIONSHIPS with thin connecting lines
- Typography: light, readable, friendly (not bold or heavy)
- Lots of white/negative space
- Make it feel like friendly notes on paper showing how phrases connect and build

Show how sentences build with gradual changing complexity and meanings:

${summary}

${examples ? `Examples with translations:\n${examples}` : ''}`;
  }
}
