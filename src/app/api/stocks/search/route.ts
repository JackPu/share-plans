import { NextRequest, NextResponse } from "next/server";

// Fallback local database for common stocks
const LOCAL_STOCKS = [
  // US Tech
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce, Inc.", exchange: "NYSE" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ" },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", exchange: "NASDAQ" },
  { symbol: "IBM", name: "IBM Corporation", exchange: "NYSE" },
  { symbol: "MDB", name: "MongoDB, Inc.", exchange: "NASDAQ" },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE" },
  { symbol: "PLTR", name: "Palantir Technologies", exchange: "NYSE" },
  { symbol: "UBER", name: "Uber Technologies", exchange: "NYSE" },
  { symbol: "ABNB", name: "Airbnb, Inc.", exchange: "NASDAQ" },
  // Hong Kong - with Chinese names
  { symbol: "0700.HK", name: "Tencent 腾讯控股", exchange: "HKEX" },
  { symbol: "9988.HK", name: "Alibaba 阿里巴巴", exchange: "HKEX" },
  { symbol: "9618.HK", name: "JD.com 京东集团", exchange: "HKEX" },
  { symbol: "3690.HK", name: "Meituan 美团", exchange: "HKEX" },
  { symbol: "1810.HK", name: "Xiaomi 小米集团", exchange: "HKEX" },
  { symbol: "2318.HK", name: "Ping An 中国平安", exchange: "HKEX" },
  { symbol: "0005.HK", name: "HSBC 汇丰控股", exchange: "HKEX" },
  { symbol: "0939.HK", name: "CCB 建设银行", exchange: "HKEX" },
  { symbol: "1398.HK", name: "ICBC 工商银行", exchange: "HKEX" },
  { symbol: "0941.HK", name: "China Mobile 中国移动", exchange: "HKEX" },
  { symbol: "9999.HK", name: "NetEase 网易", exchange: "HKEX" },
  { symbol: "9888.HK", name: "Baidu 百度集团", exchange: "HKEX" },
  { symbol: "1024.HK", name: "Kuaishou 快手", exchange: "HKEX" },
  { symbol: "1211.HK", name: "BYD 比亚迪", exchange: "HKEX" },
  { symbol: "0175.HK", name: "Geely 吉利汽车", exchange: "HKEX" },
  { symbol: "9866.HK", name: "NIO 蔚来", exchange: "HKEX" },
  { symbol: "9868.HK", name: "XPeng 小鹏汽车", exchange: "HKEX" },
  { symbol: "2015.HK", name: "Li Auto 理想汽车", exchange: "HKEX" },
  { symbol: "9626.HK", name: "Bilibili 哔哩哔哩", exchange: "HKEX" },
  { symbol: "6862.HK", name: "Haidilao 海底捞", exchange: "HKEX" },
  { symbol: "9633.HK", name: "Nongfu Spring 农夫山泉", exchange: "HKEX" },
  { symbol: "2331.HK", name: "Li Ning 李宁", exchange: "HKEX" },
  { symbol: "2020.HK", name: "ANTA Sports 安踏体育", exchange: "HKEX" },
  { symbol: "0388.HK", name: "HKEX 香港交易所", exchange: "HKEX" },
  { symbol: "1299.HK", name: "AIA 友邦保险", exchange: "HKEX" },
  { symbol: "2269.HK", name: "WuXi Biologics 药明生物", exchange: "HKEX" },
  { symbol: "0981.HK", name: "SMIC 中芯国际", exchange: "HKEX" },
  { symbol: "3968.HK", name: "CMB 招商银行", exchange: "HKEX" },
  { symbol: "2319.HK", name: "Mengniu 蒙牛乳业", exchange: "HKEX" },
  { symbol: "9961.HK", name: "Trip.com 携程集团", exchange: "HKEX" },
  // US Finance & Others
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "DIS", name: "Walt Disney Company", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike, Inc.", exchange: "NYSE" },
  { symbol: "KO", name: "Coca-Cola Company", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo, Inc.", exchange: "NASDAQ" },
  { symbol: "MCD", name: "McDonald's Corporation", exchange: "NYSE" },
  { symbol: "SBUX", name: "Starbucks Corporation", exchange: "NASDAQ" },
  // Chinese ADRs
  { symbol: "BABA", name: "Alibaba (ADR) 阿里巴巴", exchange: "NYSE" },
  { symbol: "JD", name: "JD.com (ADR) 京东", exchange: "NASDAQ" },
  { symbol: "PDD", name: "PDD Holdings 拼多多", exchange: "NASDAQ" },
  { symbol: "BIDU", name: "Baidu (ADR) 百度", exchange: "NASDAQ" },
  { symbol: "NIO", name: "NIO Inc. (ADR) 蔚来", exchange: "NYSE" },
  { symbol: "XPEV", name: "XPeng (ADR) 小鹏汽车", exchange: "NYSE" },
  { symbol: "LI", name: "Li Auto (ADR) 理想汽车", exchange: "NASDAQ" },
  { symbol: "BILI", name: "Bilibili (ADR) 哔哩哔哩", exchange: "NASDAQ" },
  { symbol: "TME", name: "Tencent Music 腾讯音乐", exchange: "NYSE" },
  { symbol: "NTES", name: "NetEase (ADR) 网易", exchange: "NASDAQ" },
];

function searchLocalStocks(query: string) {
  const searchTerm = query.toLowerCase();
  return LOCAL_STOCKS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
  ).slice(0, 10);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    // Try Yahoo Finance API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 15 second timeout

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const stocks = parseYahooResponse(data);

    // If Yahoo returns results, use them; otherwise fall back to local
    if (stocks.length > 0) {
      return NextResponse.json({ stocks });
    }

    // Fall back to local search
    const localResults = searchLocalStocks(query);
    return NextResponse.json({ stocks: localResults });

  } catch (error) {
    console.error("11111 Yahoo API failed, using local fallback:", error);
    // Fall back to local database on any error
    const localResults = searchLocalStocks(query);
    return NextResponse.json({ stocks: localResults });
  }
}

function parseYahooResponse(data: {
  quotes?: Array<{
    quoteType?: string;
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    exchDisp?: string;
  }>;
}) {
  return (data.quotes || [])
    .filter((quote) =>
      quote.quoteType === "EQUITY" || quote.quoteType === "ETF"
    )
    .map((quote) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchDisp || quote.exchange || "Unknown",
    }))
    .slice(0, 10);
}
