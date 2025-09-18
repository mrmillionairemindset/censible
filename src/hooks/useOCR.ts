import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { OCRResult } from '../types';
import { extractAmountFromOCR, extractMerchantFromOCR, extractDateFromOCR } from '../utils/categorizer';

interface UseOCRReturn {
  processImage: (imageFile: File) => Promise<OCRResult>;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export const useOCR = (): UseOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (imageFile: File): Promise<OCRResult> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Create a worker for better performance
      const worker = await Tesseract.createWorker({
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Configure worker for receipt text recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,/$-:',
        preserve_interword_spaces: '1',
      });

      const { data } = await worker.recognize(imageFile);
      await worker.terminate();

      const text = data.text;
      const confidence = data.confidence;

      // Extract structured data from OCR text
      const amount = extractAmountFromOCR(text);
      const merchant = extractMerchantFromOCR(text);
      const date = extractDateFromOCR(text);

      const result: OCRResult = {
        text,
        amount,
        merchant,
        date,
        confidence,
      };

      setIsProcessing(false);
      setProgress(100);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      setError(errorMessage);
      setIsProcessing(false);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    processImage,
    isProcessing,
    progress,
    error,
  };
};