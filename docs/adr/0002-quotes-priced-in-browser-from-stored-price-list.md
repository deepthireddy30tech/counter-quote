# Quotes are priced in the browser from a stored price list

Status: accepted

The quote is calculated in the frontend so it updates on every keystroke while the salesperson quotes live. Rates are not live market data: shops keep their own price list and revise it when suppliers announce increases, so the price list is stored in the database where the shop can edit it, and the frontend loads it once. When a job is saved, the finished quote (line items and total) is saved with it, so later price list changes never alter what a customer was told.

## Considered Options

- Pricing in the C# backend: one trusted place, but every edit becomes an API call and the live feel suffers.
- Pricing in both: the same rules written twice, which drift apart.
- Rates hard-coded in the frontend: simplest, but the shop couldn't change its own prices.

## Consequences

Reopening a job shows its saved quote unchanged. If today's price list would give a different total, a notice shows both totals; editing the design or choosing Re-price switches to today's prices, which become the saved quote on the next save. Each saved quote carries a valid-until date.

The backend never computes geometry. For the quote PDF, the frontend sends the plan drawing (SVG) on each save; it is stored with the saved quote, so the PDF's drawing always matches its price. The stored SVG comes from the browser, so the backend limits its size and only ever renders it into the PDF, never serves it back as a web page.

Anyone with browser tools could alter a quote before saving. Acceptable for an in-shop tool; moving the calculation to the server is the fix if quotes ever go to customers directly.
