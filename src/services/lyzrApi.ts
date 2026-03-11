// Lyzr API service for document upload and OCR processing
// Note: API key should be stored securely in Lovable Cloud secrets

import { OCRResult, LyzrAssetResponse } from '@/types/loan';

const LYZR_ASSETS_URL = 'https://agent-prod.studio.lyzr.ai/v3/assets/upload';
const LYZR_AGENT_URL = 'https://agent-prod.studio.lyzr.ai/v3/agent/chat';

// These should come from environment/secrets in production
const LYZR_AGENT_ID = '6979b5f8a5d355f8aa4899aa';
const LYZR_USER_ID = 'ashwitha.antakala@firstsource.com';

export const lyzrApi = {
  // Upload document to Lyzr assets
  async uploadDocument(file: File, apiKey: string): Promise<LyzrAssetResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(LYZR_ASSETS_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.status}`);
    }

    return response.json();
  },

  // Invoke OCR agent with the uploaded asset
  async invokeOCRAgent(
    assetId: string, 
    sessionId: string,
    apiKey: string
  ): Promise<OCRResult> {
    const payload = {
      user_id: LYZR_USER_ID,
      agent_id: LYZR_AGENT_ID,
      session_id: sessionId,
      message: 'analyse this image and give response',
      assets: [assetId],
    };

    const response = await fetch(LYZR_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to invoke OCR agent: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the agent response to extract OCR data
    // The actual response format may need adjustment based on Lyzr's response structure
    return parseOCRResponse(data);
  },
};

// Parse Lyzr agent response into structured OCR result
function parseOCRResponse(data: any): OCRResult {
  try {
    // Attempt to parse the response - adjust based on actual Lyzr response format
    if (data.parsed_data) {
      return data.parsed_data;
    }
    
    // If response is a string, try to parse it as JSON
    if (typeof data.response === 'string') {
      const parsed = JSON.parse(data.response);
      return {
        borrower_name: parsed.borrower_name || '',
        current_principal: parsed.current_principal ?? null,
        interest_rate_apr: parsed.interest_rate_apr ?? null,
        warning: parsed.warning || null,
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

export default lyzrApi;
