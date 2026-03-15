import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = request.headers.get('Authorization');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !authHeader || !anthropicKey) {
      return new Response(JSON.stringify({ error: 'Missing server configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: userError?.message ?? 'Unauthorized.',
        }),
        {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { message, context } = await request.json();

    if (typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const studyContext = [
      `Niveau scolaire: ${context?.year ?? 'inconnu'}`,
      `Matieres: ${(context?.subjects ?? []).join(', ') || 'aucune'}`,
      `Taches: ${JSON.stringify(context?.tasks ?? []).slice(0, 3000)}`,
    ].join('\n');

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system:
          "Tu es un tuteur scolaire pour un eleve du secondaire au Quebec. Reponds en francais. Sois concret, bref et utile. Si l'eleve veut etudier, propose un plan clair par etapes.",
        messages: [
          {
            role: 'user',
            content: `Contexte:\n${studyContext}\n\nQuestion de l'eleve:\n${message}`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({
          error: `Anthropic API error (${anthropicResponse.status}): ${errorText}`,
        }),
        {
          status: anthropicResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await anthropicResponse.json();
    const reply = Array.isArray(data?.content)
      ? data.content
          .filter((item: { type?: string; text?: string }) => item?.type === 'text' && typeof item.text === 'string')
          .map((item: { text: string }) => item.text)
          .join('\n\n')
      : '';

    if (!reply) {
      return new Response(JSON.stringify({ error: 'Anthropic returned no text content.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
