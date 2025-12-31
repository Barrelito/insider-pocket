
import * as cheerio from 'cheerio';

export interface InsiderTransaction {
    holderName: string;
    transactionText: string;
    date: string;
    shares: string;
    value: string;
    isBuy: boolean;
}

export async function scrapeFiInsider(companyName: string): Promise<InsiderTransaction[]> {
    // 1. Clean the company name for better search results
    // FI search is sensitive. "Investor AB" might fail if they list it as "Investor".
    // Known patterns to remove: " AB", " publ", " ser. B", " ser. A", etc.
    const cleanName = companyName
        .replace(/ AB/gi, '')
        .replace(/ publ/gi, '')
        .replace(/ ser\. [AB]/gi, '')
        .replace(/ series [AB]/gi, '')
        .trim();

    console.log(`[FI Scraper] Searching for: "${cleanName}" (Original: "${companyName}")`);

    const url = `https://marknadssok.fi.se/publiceringsklient/sv-SE/Search/Search?SearchFunctionType=Insyn&Utgivare=${encodeURIComponent(cleanName)}&button=search`;

    try {
        // 2. Fetch HTML with browser-like headers
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) throw new Error(`FI returned ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        const transactions: InsiderTransaction[] = [];

        // 3. Parse the table
        // The table class is usually 'search-results-table' or standard <table>
        const rows = $('table tbody tr');

        rows.each((i, row) => {
            if (transactions.length >= 10) return; // Limit to 10

            const cols = $(row).find('td');
            if (cols.length < 5) return;

            // Extract fields (indexes might vary, need to inspect FI structure dynamically or assume standard)
            // Typically: Publiceringsdatum | Utgivare | Person | Befattning | Karaktär | ... | Volym | Pris

            // Helpful debug to verify columns if scraping fails first time
            // const debugText = $(row).text().trim();
            // console.log(debugText);

            const date = $(cols[0]).text().trim();
            const person = $(cols[2]).text().trim();
            const type = $(cols[4]).text().trim(); // Karaktär (Förvärv, Avyttring, etc)
            const volumeStr = $(cols[6]).text().trim(); // Volym
            // const priceStr = $(cols[7]).text().trim(); // Pris (Unused for now but good to have)

            // 4. Normalize Data
            const isBuy = type.toLowerCase().includes('förvärv') || type.toLowerCase().includes('köp');
            const isSell = type.toLowerCase().includes('avyttring') || type.toLowerCase().includes('sälj');

            if (isBuy || isSell) {
                // Normalize Volume (remove spaces/thousands separators)
                const volumeClean = volumeStr.replace(/\s/g, '').replace(/,/g, '.'); // Handle "1 000" and "1,5"
                const volume = parseInt(volumeClean) || 0;

                transactions.push({
                    holderName: person,
                    transactionText: isBuy ? 'Bought' : 'Sold',
                    date: date.split(' ')[0], // Keep just YYYY-MM-DD
                    shares: Math.abs(volume).toLocaleString(), // Format "10,000"
                    value: 'N/A', // FI doesn't explicitly give Total Value, could calculate Pris * Volym if needed
                    isBuy: isBuy
                });
            }
        });

        console.log(`[FI Scraper] Found ${transactions.length} transactions.`);
        return transactions;

    } catch (error: any) {
        console.error(`[FI Scraper] Error:`, error.message);
        return [];
    }
}
