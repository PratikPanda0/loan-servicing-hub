import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

const CENLAR_BASE_URL = 'https://cenlar-backend.onrender.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/loans';
    // Allow overriding the method for cases where the client uses POST but we need GET
    const methodOverride = url.searchParams.get('method');
    const targetUrl = `${CENLAR_BASE_URL}${path}`;
    
    // Determine actual method to use
    let actualMethod = methodOverride?.toUpperCase() || req.method;
    
    // If path is just /loans and method is POST (from supabase.functions.invoke default), use GET
    if (path === '/loans' && req.method === 'POST' && !methodOverride) {
      actualMethod = 'GET';
    }

    console.log(`Proxying ${actualMethod} request to: ${targetUrl}`);

    const fetchOptions: RequestInit = {
      method: actualMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Forward body for PATCH requests
    if (actualMethod === 'PATCH') {
      try {
        const body = await req.json();
        fetchOptions.body = JSON.stringify(body);
        console.log('Request body:', JSON.stringify(body));
      } catch {
        console.log('No body to forward');
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cenlar API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Cenlar API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched data from Cenlar (${Array.isArray(data) ? data.length + ' items' : 'single item'})`);

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
