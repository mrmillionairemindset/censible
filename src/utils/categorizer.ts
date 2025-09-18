import { CategoryType } from '../types';

interface MerchantPattern {
  patterns: RegExp[];
  category: CategoryType;
}

const merchantPatterns: MerchantPattern[] = [
  {
    patterns: [
      /walmart/i,
      /walmart\s*supercenter/i,
      /kroger/i,
      /target/i,
      /whole\s*foods/i,
      /trader\s*joe/i,
      /safeway/i,
      /albertsons/i,
      /publix/i,
      /costco/i,
      /sam'?s\s*club/i,
      /aldi/i,
      /food\s*lion/i,
      /wegmans/i,
      /meijer/i,
      /h-?e-?b/i,
      /grocery/i,
      /supermarket/i,
      /market/i,
    ],
    category: 'groceries',
  },
  {
    patterns: [
      /amazon/i,
      /best\s*buy/i,
      /ebay/i,
      /etsy/i,
      /nike/i,
      /adidas/i,
      /gap/i,
      /old\s*navy/i,
      /macy'?s/i,
      /nordstrom/i,
      /zara/i,
      /h\s*&\s*m/i,
      /forever\s*21/i,
      /ross/i,
      /tj\s*maxx/i,
      /marshall/i,
      /outlet/i,
      /mall/i,
    ],
    category: 'shopping',
  },
  {
    patterns: [
      /shell/i,
      /chevron/i,
      /exxon/i,
      /mobil/i,
      /bp/i,
      /texaco/i,
      /arco/i,
      /valero/i,
      /sunoco/i,
      /gas\s*station/i,
      /fuel/i,
      /uber/i,
      /lyft/i,
      /taxi/i,
      /parking/i,
      /transit/i,
      /metro/i,
      /bus/i,
      /train/i,
      /airline/i,
      /airport/i,
      /car\s*rental/i,
      /hertz/i,
      /enterprise/i,
      /avis/i,
    ],
    category: 'transportation',
  },
  {
    patterns: [
      /netflix/i,
      /spotify/i,
      /hulu/i,
      /disney/i,
      /hbo/i,
      /paramount/i,
      /peacock/i,
      /apple\s*tv/i,
      /youtube/i,
      /twitch/i,
      /cinema/i,
      /movie/i,
      /theater/i,
      /theatre/i,
      /concert/i,
      /ticket/i,
      /game/i,
      /playstation/i,
      /xbox/i,
      /nintendo/i,
      /steam/i,
      /planet\s*fitness/i,
      /gym/i,
      /fitness/i,
      /yoga/i,
      /pilates/i,
    ],
    category: 'entertainment',
  },
  {
    patterns: [
      /restaurant/i,
      /mcdonald/i,
      /burger\s*king/i,
      /wendy/i,
      /subway/i,
      /starbucks/i,
      /dunkin/i,
      /pizza/i,
      /domino/i,
      /papa\s*john/i,
      /chipotle/i,
      /panera/i,
      /chick-?fil-?a/i,
      /taco\s*bell/i,
      /kfc/i,
      /popeyes/i,
      /cafe/i,
      /coffee/i,
      /diner/i,
      /bar/i,
      /grill/i,
      /buffet/i,
      /sushi/i,
      /chinese/i,
      /mexican/i,
      /italian/i,
      /food\s*delivery/i,
      /doordash/i,
      /uber\s*eats/i,
      /grubhub/i,
      /postmates/i,
    ],
    category: 'dining',
  },
  {
    patterns: [
      /electric/i,
      /power/i,
      /water/i,
      /gas\s*company/i,
      /utility/i,
      /utilities/i,
      /internet/i,
      /cable/i,
      /comcast/i,
      /at&t/i,
      /att/i,
      /verizon/i,
      /t-?mobile/i,
      /sprint/i,
      /phone/i,
      /telecom/i,
      /broadband/i,
      /wifi/i,
      /electric\s*company/i,
      /pg&e/i,
      /con\s*ed/i,
      /duke\s*energy/i,
    ],
    category: 'utilities',
  },
  {
    patterns: [
      /rent/i,
      /mortgage/i,
      /lease/i,
      /apartment/i,
      /property/i,
      /real\s*estate/i,
      /landlord/i,
      /home\s*depot/i,
      /lowe'?s/i,
      /ikea/i,
      /furniture/i,
      /home\s*goods/i,
      /bed\s*bath/i,
      /wayfair/i,
      /insurance/i,
      /geico/i,
      /state\s*farm/i,
      /allstate/i,
      /progressive/i,
    ],
    category: 'housing',
  },
];

const keywordPatterns: Record<string, CategoryType> = {
  'grocery': 'groceries',
  'food': 'groceries',
  'produce': 'groceries',
  'gas': 'transportation',
  'fuel': 'transportation',
  'car': 'transportation',
  'auto': 'transportation',
  'movie': 'entertainment',
  'game': 'entertainment',
  'music': 'entertainment',
  'restaurant': 'dining',
  'lunch': 'dining',
  'dinner': 'dining',
  'breakfast': 'dining',
  'coffee': 'dining',
  'electric': 'utilities',
  'water': 'utilities',
  'internet': 'utilities',
  'phone': 'utilities',
  'rent': 'housing',
  'mortgage': 'housing',
  'shop': 'shopping',
  'store': 'shopping',
  'clothes': 'shopping',
  'shoes': 'shopping',
};

export function categorizeTransaction(
  merchant?: string,
  description?: string,
  amount?: number
): CategoryType {
  const searchText = `${merchant || ''} ${description || ''}`.toLowerCase();

  // Check merchant patterns first (more specific)
  for (const { patterns, category } of merchantPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        return category;
      }
    }
  }

  // Check keyword patterns (less specific)
  for (const [keyword, category] of Object.entries(keywordPatterns)) {
    if (searchText.includes(keyword)) {
      return category;
    }
  }

  // Amount-based heuristics
  if (amount) {
    if (amount > 800 && amount < 3000) {
      // Likely rent/mortgage
      return 'housing';
    }
    if (amount > 50 && amount < 200 && searchText.length < 20) {
      // Likely groceries if no other info
      return 'groceries';
    }
  }

  // Default to 'other' if no match
  return 'other';
}

export function extractMerchantFromOCR(text: string): string | undefined {
  // Try to extract merchant name from OCR text
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  if (lines.length === 0) return undefined;

  // Usually the merchant name is in the first few lines
  const potentialMerchant = lines[0];

  // Clean up common OCR artifacts
  const cleaned = potentialMerchant
    .replace(/[^\w\s&'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Return if it looks like a merchant name (not too long, not just numbers)
  if (cleaned.length > 2 && cleaned.length < 50 && !/^\d+$/.test(cleaned)) {
    return cleaned;
  }

  return undefined;
}

export function extractAmountFromOCR(text: string): number | undefined {
  // Look for common total patterns
  const totalPatterns = [
    /total[:\s]+\$?([\d,]+\.?\d*)/i,
    /amount[:\s]+\$?([\d,]+\.?\d*)/i,
    /subtotal[:\s]+\$?([\d,]+\.?\d*)/i,
    /grand\s+total[:\s]+\$?([\d,]+\.?\d*)/i,
    /balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /due[:\s]+\$?([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d{2})/,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  // Fallback: look for any currency amount
  const amounts = text.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
  if (amounts && amounts.length > 0) {
    // Try to find the largest amount (often the total)
    const parsedAmounts = amounts
      .map(a => parseFloat(a.replace(/[$,]/g, '')))
      .filter(a => !isNaN(a) && a > 0)
      .sort((a, b) => b - a);

    if (parsedAmounts.length > 0) {
      return parsedAmounts[0];
    }
  }

  return undefined;
}

export function extractDateFromOCR(text: string): Date | undefined {
  // Common date patterns
  const datePatterns = [
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch {
        continue;
      }
    }
  }

  return undefined;
}