// Lyzr API service using Lovable Cloud edge function
import { OCRResult } from '@/types/loan';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const lyzrEdgeApi = {
  // Upload document to Lyzr via edge function
  async uploadDocument(file: File): Promise<{ asset_id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/lyzr-ocr?action=upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  },

  // Invoke OCR agent via edge function
  async invokeOCRAgent(assetId: string, sessionId: string): Promise<OCRResult> {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/lyzr-ocr?action=ocr`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId, sessionId }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'OCR failed' }));
      throw new Error(error.error || `OCR failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data as OCRResult;
  },

  // Generate a unique session ID
  generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  },
};

export default lyzrEdgeApi;
