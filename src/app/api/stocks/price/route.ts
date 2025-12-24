import { NextRequest, NextResponse } from "next/server";

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get currency based on symbol suffix
function getCurrencyFromSymbol(symbol: string): string {
  if (symbol.endsWith('.HK')) return 'HKD';
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'CNY';
  return 'USD';
}

// Try Tencent API for HK and Chinese stocks
async function fetchTencentPrice(symbol: string): Promise<{
  price: number;
  previousClose: number;
  currency: string;
} | null> {
  try {
    let tencentSymbol = '';

    if (symbol.endsWith('.HK')) {
      // Hong Kong: hk00700 format
      const code = symbol.replace('.HK', '').padStart(5, '0');
      tencentSymbol = `hk${code}`;
    } else if (symbol.endsWith('.SS')) {
      // Shanghai: sh600519 format
      tencentSymbol = `sh${symbol.replace('.SS', '')}`;
    } else if (symbol.endsWith('.SZ')) {
      // Shenzhen: sz000001 format
      tencentSymbol = `sz${symbol.replace('.SZ', '')}`;
    } else {
      // US stocks not supported by Tencent
      return null;
    }

    const url = `https://qt.gtimg.cn/q=${tencentSymbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://gu.qq.com/",
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`11111 Tencent API error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    console.log(`11111 Tencent response for ${tencentSymbol}:`, text.substring(0, 200));

    // Response format: v_hk06682="1~PARADIGM FOUR~06682~42.750~42.000~42.250~..."
    // Format: name~code~current~prevClose~open~...
    const match = text.match(/v_[^=]+=["']([^"']+)["']/);

    if (!match || !match[1]) {
      console.error("11111 Tencent: no match found");
      return null;
    }

    const parts = match[1].split('~');

    // For HK stocks: index 3 = current price, index 4 = prev close
    // For A stocks: index 3 = current price, index 4 = prev close
    if (parts.length >= 5) {
      const currentPrice = parseFloat(parts[3]);
      const prevClose = parseFloat(parts[4]);

      if (currentPrice > 0) {
        return {
          price: currentPrice,
          previousClose: prevClose || 0,
          currency: getCurrencyFromSymbol(symbol),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("11111 Tencent price error:", error);
    return null;
  }
}

// Try Sina API for HK and Chinese stocks (backup)
async function fetchSinaPrice(symbol: string): Promise<{
  price: number;
  previousClose: number;
  currency: string;
} | null> {
  try {
    let sinaSymbol = '';

    if (symbol.endsWith('.HK')) {
      // Hong Kong: hk00700 format
      const code = symbol.replace('.HK', '').padStart(5, '0');
      sinaSymbol = `hk${code}`;
    } else if (symbol.endsWith('.SS')) {
      // Shanghai: sh600519 format
      sinaSymbol = `sh${symbol.replace('.SS', '')}`;
    } else if (symbol.endsWith('.SZ')) {
      // Shenzhen: sz000001 format
      sinaSymbol = `sz${symbol.replace('.SZ', '')}`;
    } else {
      // US stocks: gb_aapl format
      sinaSymbol = `gb_${symbol.toLowerCase()}`;
    }

    const url = `https://hq.sinajs.cn/list=${sinaSymbol}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://finance.sina.com.cn/",
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`11111 Sina API error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    console.log(`11111 Sina response for ${sinaSymbol}:`, text.substring(0, 200));

    // Response format varies by market:
    // HK: var hq_str_hk00700="TENCENT,腾讯控股,378.800,382.200,379.000,..."
    // A shares: var hq_str_sh600519="贵州茅台,1500.000,1498.880,1502.000,..."
    const match = text.match(/var hq_str_[^=]+=["']([^"']+)["']/);

    if (!match || !match[1]) {
      console.error("11111 Sina: no match found");
      return null;
    }

    const parts = match[1].split(',');

    if (symbol.endsWith('.HK') && parts.length >= 4) {
      // HK format: name, chinese name, current, prev close, open, ...
      const currentPrice = parseFloat(parts[2]);
      const prevClose = parseFloat(parts[3]);

      if (currentPrice > 0) {
        return {
          price: currentPrice,
          previousClose: prevClose || 0,
          currency: 'HKD',
        };
      }
    } else if ((symbol.endsWith('.SS') || symbol.endsWith('.SZ')) && parts.length >= 4) {
      // A shares format: name, open, prev close, current, ...
      const currentPrice = parseFloat(parts[3]);
      const prevClose = parseFloat(parts[2]);

      if (currentPrice > 0) {
        return {
          price: currentPrice,
          previousClose: prevClose || 0,
          currency: 'CNY',
        };
      }
    } else if (parts.length >= 2) {
      // US stocks format might be different
      const currentPrice = parseFloat(parts[1]);
      if (currentPrice > 0) {
        return {
          price: currentPrice,
          previousClose: 0,
          currency: 'USD',
        };
      }
    }

    return null;
  } catch (error) {
    console.error("11111 Sina price error:", error);
    return null;
  }
}

// Try Yahoo Finance API (for US stocks primarily)
async function fetchYahooPrice(symbol: string): Promise<{
  price: number;
  previousClose: number;
  currency: string;
} | null> {
  try {
    // Use Yahoo Finance API directly
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.5",
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`11111 Yahoo API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    const result = data?.chart?.result?.[0];
    if (!result) {
      console.error("11111 Yahoo: no result in response");
      return null;
    }

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    const prevClose = meta?.chartPreviousClose || meta?.previousClose;
    const currency = meta?.currency || getCurrencyFromSymbol(symbol);

    if (price && price > 0) {
      return {
        price: price,
        previousClose: prevClose || 0,
        currency: currency,
      };
    }

    return null;
  } catch (error) {
    console.error("11111 Yahoo price error:", error);
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

  console.log(`11111 Fetching price for ${symbol}...`);

  try {
    let result = null;
    const isChineseOrHK = symbol.endsWith('.HK') || symbol.endsWith('.SS') || symbol.endsWith('.SZ');

    // For Chinese and HK stocks, use Tencent API first (more reliable)
    if (isChineseOrHK) {
      console.log("11111 Using Tencent API for Chinese/HK stock...");
      result = await fetchTencentPrice(symbol);

      // Fallback to Sina if Tencent fails
      if (!result || result.price <= 0) {
        console.log("11111 Tencent failed, trying Sina...");
        result = await fetchSinaPrice(symbol);
      }

      // Last resort: Yahoo
      if (!result || result.price <= 0) {
        console.log("11111 Sina failed, trying Yahoo...");
        result = await fetchYahooPrice(symbol);
      }
    } else {
      // For US stocks, use Yahoo first
      console.log("11111 Using Yahoo API for US stock...");
      result = await fetchYahooPrice(symbol);

      // Fallback to Sina for US stocks (they have US stock data too)
      if (!result || result.price <= 0) {
        console.log("11111 Yahoo failed, trying Sina for US stock...");
        result = await fetchSinaPrice(symbol);
      }
    }

    if (result && result.price > 0) {
      const change = result.previousClose ? result.price - result.previousClose : 0;
      const changePercent = result.previousClose ? (change / result.previousClose) * 100 : 0;

      console.log(`11111 Got price: ${result.price} ${result.currency}`);

      return NextResponse.json({
        symbol: symbol,
        price: result.price,
        previousClose: result.previousClose,
        change: change,
        changePercent: changePercent,
        currency: result.currency,
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

