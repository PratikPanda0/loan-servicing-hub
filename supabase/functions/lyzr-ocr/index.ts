import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LYZR_ASSETS_URL = 'https://agent-prod.studio.lyzr.ai/v3/assets/upload';
const LYZR_AGENT_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
const LYZR_AGENT_ID = '6979b5f8a5d355f8aa4899aa';
const LYZR_USER_ID = 'ashwitha.antakala@firstsource.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LYZR_API_KEY');
    if (!apiKey) {
      console.error('LYZR_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'LYZR_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'upload') {
      // Handle document upload to Lyzr assets
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

      // Create new FormData for Lyzr API - field must be named 'files'
      const lyzrFormData = new FormData();
      lyzrFormData.append('files', file);

      const uploadResponse = await fetch(LYZR_ASSETS_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: lyzrFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Lyzr upload failed: ${uploadResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Failed to upload document: ${uploadResponse.status}` }),
          { status: uploadResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload successful:', JSON.stringify(uploadResult));

      // Extract asset_id from results array
      const assetId = uploadResult.results?.[0]?.asset_id;
      if (!assetId) {
        console.error('No asset_id in response:', uploadResult);
        return new Response(
          JSON.stringify({ error: 'No asset_id returned from Lyzr' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ asset_id: assetId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'ocr') {
      // Handle OCR agent invocation
      const body = await req.json();
      const { assetId, sessionId } = body;

      if (!assetId || !sessionId) {
        return new Response(
          JSON.stringify({ error: 'assetId and sessionId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Invoking OCR agent with assetId: ${assetId}, sessionId: ${sessionId}`);

      const payload = {
        user_id: LYZR_USER_ID,
        agent_id: LYZR_AGENT_ID,
        session_id: sessionId,
        message: 'analyse this image and give response',
        assets: [assetId],
      };

      const ocrResponse = await fetch(LYZR_AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        console.error(`Lyzr OCR failed: ${ocrResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Failed to invoke OCR agent: ${ocrResponse.status}` }),
          { status: ocrResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ocrResult = await ocrResponse.json();
      console.log('OCR result:', JSON.stringify(ocrResult));

      // Parse the OCR response
      const parsedResult = parseOCRResponse(ocrResult);

      return new Response(
        JSON.stringify(parsedResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use ?action=upload or ?action=ocr' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Parse Lyzr agent response into structured OCR result
function parseOCRResponse(data: any): {
  borrower_name: string;
  current_principal: number | null;
  interest_rate_apr: number | null;
  warning: string | null;
} {
  try {
    // Attempt to parse the response - adjust based on actual Lyzr response format
    if (data.parsed_data) {
      return data.parsed_data;
    }
    
    // If response is a string, try to parse it as JSON
    if (typeof data.response === 'string') {
      try {
        const parsed = JSON.parse(data.response);
        return {
          borrower_name: parsed.borrower_name || '',
          current_principal: parsed.current_principal ?? null,
          interest_rate_apr: parsed.interest_rate_apr ?? null,
          warning: parsed.warning || null,
        };
      } catch {
        // Response might contain the data in different format
        console.log('Could not parse response as JSON, checking for direct properties');
      }
    }

    // Check for direct properties in response object
    if (data.response && typeof data.response === 'object') {
      return {
        borrower_name: data.response.borrower_name || '',
        current_principal: data.response.current_principal ?? null,
        interest_rate_apr: data.response.interest_rate_apr ?? null,
        warning: data.response.warning || null,
      };
    }

    // Fallback - check for direct properties
    return {
      borrower_name: data.borrower_name || '',
      current_principal: data.current_principal ?? null,
      interest_rate_apr: data.interest_rate_apr ?? null,
      warning: data.warning || null,
    };
  } catch {
    return {
      borrower_name: '',
      current_principal: null,
      interest_rate_apr: null,
      warning: 'Failed to parse OCR response',
    };
  }
}
