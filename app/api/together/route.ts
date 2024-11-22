import Together from "together-ai";

export async function POST(req: Request) {
  try {
    if (!process.env.TOGETHER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Together API key is not configured" }), 
        { status: 500 }
      );
    }

    const { model, ceremony, vibe } = await req.json();
    
    const together = new Together({ 
      apiKey: process.env.TOGETHER_API_KEY as string 
    });
    
    const enhancedPrompt = `Generate only a single short, energetic ${
      ceremony === 'standup' 
        ? 'standup closing phrase that pumps up the team for the day ahead' 
        : 'retrospective closing phrase that celebrates the team\'s wins'
    }. 

    Format:
    Simple phrase (max 8 words)! appended with either (choose one randomly)
    1. As <Famous person> once said: '<Short motivational quote>'
    3. As they say in <industry/movie/show>: '<quote>'

    Examples:
    - Let's crush it, team! As Steve Jobs once said: 'Stay hungry, stay foolish!'
    - Mission accomplished, team! As they say in Top Gun: 'I feel the need for speed!'
  

    Response must be ONLY the phrase and the quote, no explanations of why they are useful. Keep it ${vibe.toLowerCase()} and under 10 words total.`;

    const runner = together.chat.completions.stream({
      model,
      messages: [{ role: "user", content: enhancedPrompt }],
      temperature: 0.9,
      max_tokens: 50,
      stop: ["\n", "This", "Note", "Remember"],
    });

    return new Response(runner.toReadableStream());
  } catch (error) {
    console.error('Route handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request", 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
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
