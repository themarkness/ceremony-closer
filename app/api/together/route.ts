import Together from "together-ai";

export async function POST(req: Request) {
  try {
    // Log environment variable status (will be redacted in production)
    console.log('API Key exists:', !!process.env.TOGETHER_API_KEY);
    
    if (!process.env.TOGETHER_API_KEY) {
      console.error('Missing API key');
      return new Response(
        JSON.stringify({ error: "Together API key is not configured" }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { model, ceremony, vibe } = await req.json();
    
    const enhancedPrompt = `Generate only a single short, energetic ${
      ceremony === 'standup' 
        ? 'standup closing phrase that pumps up the team for the day ahead' 
        : 'retrospective closing phrase that celebrates the team\'s wins'
    }. 

    Format options (choose one randomly):
    1. "Simple phrase (max 8 words)!"
    2. "<Famous person> once said: '<Short quote>'"
    3. "<Snappy phrase> As they say in <industry/movie/show>: '<quote>'"

    Examples:
    - "Let's crush it! Engage warp 10! As Steve Jobs once said: 'Stay hungry, stay foolish!'"
    - "Mission accomplished! As they say in Top Gun: 'I feel the need for speed!'"
    - "We 10X'd it! Over and out!"
    - "To infinity and beyond!"
    - "Another epic sprint in the books! Excelsior!"

    Response must be ONLY the phrase and a quote, no explanations. Keep it ${vibe.toLowerCase()} and under 10 words total.`;

    console.log('Received request with model:', model);

    try {
      // Initialize Together client
      const together = new Together(process.env.TOGETHER_API_KEY);
      
      const runner = together.chat.completions.stream({
        model,
        messages: [{ role: "user", content: enhancedPrompt }],
        temperature: 0.9,
        max_tokens: 50,
        stop: ["\n", "This", "Note", "Remember"], // Stop tokens to prevent explanations
      });

      return new Response(runner.toReadableStream());
    } catch (innerError) {
      console.error('Together API error:', innerError);
      return new Response(
        JSON.stringify({ error: "Error with Together API", details: innerError.message }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Route handler error:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process request", details: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const runtime = "edge";

export async function GET() {
  return new Response(
    JSON.stringify({ 
      hasKey: !!process.env.TOGETHER_API_KEY,
      keyLength: process.env.TOGETHER_API_KEY?.length || 0
    }),
    { 
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
