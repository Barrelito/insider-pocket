import * as cheerio from 'cheerio';

export interface InsiderTransaction {
    holderName: string;
    role: string;  // NEW: Person's position (e.g., "VD", "Styrelseledamot")
    transactionText: string;
    date: string;
    shares: string;
    value: string;
    isBuy: boolean;
}

export async function scrapeFiInsider(companyName: string): Promise<InsiderTransaction[]> {
    // 1. Clean the company name for better search results
    // FI search is sensitive. "Investor AB ser. B" should become just "Investor"
    const cleanName = companyName
        .replace(/ AB/gi, '')
        .replace(/ publ/gi, '')
        .replace(/ ser\.\s*[AB]/gi, '')
        .replace(/ series\s*[AB]/gi, '')
        .replace(/[-_]/g, ' ') // e.g., INVE-B -> INVE B
        .split(' ')[0] // Take first word (e.g., "Investor" from "Investor AB ser. B")
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

        // 3. Parse the table (confirmed class: "table table-bordered table-hover table-striped")
        // Column indexes (0-based):
        //   0: Publiceringsdatum
        //   2: Person i ledande ställning
        //   5: Karaktär (Förvärv/Avyttring)
        //   9: Transaktionsdatum (actual trade date)
        //  10: Volym
        const rows = $('table.table-bordered tbody tr');

        console.log(`[FI Scraper] Found ${rows.length} rows in table.`);

        rows.each((i, row) => {
            if (transactions.length >= 10) return; // Limit to 10

            const cols = $(row).find('td');
            if (cols.length < 10) return; // Ensure we have enough columns

            // Extract fields using CORRECT column indexes
            const date = $(cols[9]).text().trim();        // Transaktionsdatum (actual trade date)
            const person = $(cols[2]).text().trim();       // Person i ledande ställning
            const role = $(cols[3]).text().trim();         // Befattning (e.g., "VD", "CFO")
            const type = $(cols[5]).text().trim();         // Karaktär (Förvärv, Avyttring, etc)
            const volumeStr = $(cols[10]).text().trim();   // Volym

            // 4. Normalize Data
            const isBuy = type.toLowerCase().includes('förvärv') || type.toLowerCase().includes('köp');
            const isSell = type.toLowerCase().includes('avyttring') || type.toLowerCase().includes('sälj');

            if (isBuy || isSell) {
                // Normalize Volume (remove spaces used as thousands separators)
                const volumeClean = volumeStr.replace(/\s/g, '').replace(/,/g, '.');
                const volume = parseInt(volumeClean) || 0;

                transactions.push({
                    holderName: person || 'Unknown',
                    role: role || '', // NEW: Include role
                    transactionText: isBuy ? 'Bought' : 'Sold',
                    date: date || 'N/A',
                    shares: Math.abs(volume).toLocaleString('sv-SE'), // Format with Swedish locale
                    value: 'N/A', // FI doesn't explicitly give Total Value
                    isBuy: isBuy
                });
            }
        });

        console.log(`[FI Scraper] Extracted ${transactions.length} transactions.`);
        return transactions;

    } catch (error: any) {
        console.error(`[FI Scraper] Error:`, error.message);
        return [];
    }
}
