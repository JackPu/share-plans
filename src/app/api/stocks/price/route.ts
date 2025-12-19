import { NextRequest, NextResponse } from "next/server";

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Try to fetch price using Yahoo Finance scraping approach
async function fetchYahooPrice(symbol: string): Promise<{
  price: number;
  previousClose: number;
  currency: string;
} | null> {
  try {
    // Use the quote page which has different rate limits
    const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract price from HTML using regex
    // Look for regularMarketPrice in the page data
    const priceMatch = html.match(/"regularMarketPrice":\s*{\s*"raw":\s*([\d.]+)/);
    const prevCloseMatch = html.match(/"regularMarketPreviousClose":\s*{\s*"raw":\s*([\d.]+)/);
    const currencyMatch = html.match(/"currency":\s*"([A-Z]+)"/);

    if (priceMatch) {
      return {
        price: parseFloat(priceMatch[1]),
        previousClose: prevCloseMatch ? parseFloat(prevCloseMatch[1]) : 0,
        currency: currencyMatch ? currencyMatch[1] : "USD",
      };
    }

    return null;
  } catch (error) {
    console.error("11111 Yahoo scrape error:", error);
    return null;
  }
}

// Try Google Finance as alternative
async function fetchGooglePrice(symbol: string): Promise<{
  price: number;
  currency: string;
} | null> {
  try {
    // Convert symbol format for Google Finance
    let googleSymbol = symbol;
    if (symbol.endsWith('.HK')) {
      googleSymbol = symbol.replace('.HK', ':HKG');
    } else if (symbol.endsWith('.SS')) {
      googleSymbol = symbol.replace('.SS', ':SHA');
    } else if (symbol.endsWith('.SZ')) {
      googleSymbol = symbol.replace('.SZ', ':SHE');
    } else {
      // US stocks
      googleSymbol = `${symbol}:NASDAQ`;
    }

    const url = `https://www.google.com/finance/quote/${encodeURIComponent(googleSymbol)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.5",
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract price from Google Finance HTML
    // Look for the price in data attribute or specific class
    const priceMatch = html.match(/data-last-price="([\d.]+)"/);

    if (priceMatch) {
      return {
        price: parseFloat(priceMatch[1]),
        currency: symbol.endsWith('.HK') ? 'HKD' : symbol.endsWith('.SS') || symbol.endsWith('.SZ') ? 'CNY' : 'USD',
      };
    }

    return null;
  } catch (error) {
    console.error("11111 Google Finance error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 });
  }

  // Add small random delay to spread out requests
  await delay(Math.random() * 200);

  try {
    // Try Yahoo Finance first
    console.log(`11111 Fetching price for ${symbol}...`);
    let result = await fetchYahooPrice(symbol);

    if (result && result.price > 0) {
      const change = result.previousClose ? result.price - result.previousClose : 0;
      const changePercent = result.previousClose ? (change / result.previousClose) * 100 : 0;

      return NextResponse.json({
        symbol: symbol,
        price: result.price,
        previousClose: result.previousClose,
        change: change,
        changePercent: changePercent,
        currency: result.currency,
        source: "yahoo",
      });
    }

    // Fallback to Google Finance
    console.log("11111 Yahoo failed, trying Google Finance...");
    const googleResult = await fetchGooglePrice(symbol);

    if (googleResult && googleResult.price > 0) {
      return NextResponse.json({
        symbol: symbol,
        price: googleResult.price,
        previousClose: 0,
        change: 0,
        changePercent: 0,
        currency: googleResult.currency,
        source: "google",
      });
    }

    // If all sources fail, return unavailable status
    console.log("11111 All price sources failed");
    return NextResponse.json({
      symbol: symbol,
      price: 0,
      error: "Price temporarily unavailable",
      unavailable: true,
    });

  } catch (error) {
    console.error("11111 Stock price fetch error:", error);

    return NextResponse.json({
      symbol: symbol,
      price: 0,
      error: "Failed to fetch stock price",
      unavailable: true,
    });
  }
}

