import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Get the base64 image from the request body
    const { image } = await request.json();

    if (!image) {
      console.error('No image provided in request body');
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Log the first 100 chars of the image string for debugging
    console.log('Received image string (first 100 chars):', image.slice(0, 100));

    // Call GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a food expert. Analyze the food in this image and return a JSON object containing the following keys:\n- \"foodName\": string (the name of the food)\n- \"calories\": number (estimated calories in kcal)\n- \"nutrition\": object with keys \"carbs\" (number in grams), \"protein\" (number in grams), and \"fat\" (number in grams)\n- \"healthiness\": string, one of \"good\", \"okay\", or \"bad\"\n- \"suggestions\": string[] (an array of 2-3 health suggestions related to the food)\n\nReturn ONLY the JSON object, no other text or markdown. If you cannot identify a value, use null for strings/numbers or an empty array for suggestions."
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Extract the response text
    const analysisText = response.choices[0]?.message?.content;

    if (!analysisText) {
      console.error('No analysis received from GPT. Full response:', response);
      throw new Error('No analysis received from GPT');
    }

    // Extract JSON block if extra text is present
    let jsonString = analysisText;
    const match = analysisText.match(/```json\s*([\s\S]+?)\s*```|({[\s\S]+})/);
    if (match) {
      jsonString = match[1] || match[2];
    }

    // Parse the JSON response
    try {
      const analysis = JSON.parse(jsonString);
      return NextResponse.json(analysis);
    } catch (error) {
      console.error('Error parsing GPT response:', error, '\nRaw GPT output:', analysisText);
      return NextResponse.json(
        { error: 'Failed to parse analysis response', raw: analysisText },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error analyzing food:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food image', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
} 