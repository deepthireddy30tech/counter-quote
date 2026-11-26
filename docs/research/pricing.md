# Countertop Fabrication Pricing Research (US, 2025–2026)

Status: draft — gathered by AI, to be checked by Deepthi

Gathered 2026-11-27. "Primary" means a fabricator's own published price list, a manufacturer document, or an industry body. "Secondary" means a cost-guide site, vendor blog, or press. Several starting-point URLs (HomeServe, HomeGuide, Axios, Caesarstone color list, Floform) returned HTTP 403 and could not be read. I did not use them as sources.

Primary fabricator price lists found:
- **Top Masters LLC (NJ)**, https://www.topmastersllc.com/pricing. Online calculator with Level 1–10 $/sq ft and itemized add-ons.
- **Anytop Shop (Kansas City, KS)**, https://anytopshop.com/prices/. Add-on price list only, no $/sq ft.
- **Royal Kitchen & Bathroom (Woodstock, GA)**, https://royal-granite.com/countertop-cost-guide/. Installed $/sq ft by material and a list of what is included.

That is only three shops, so every "primary" price below is a single-shop data point and not a market average.

---

## 1. $/sq ft by price group, 2 cm and 3 cm

**Findings**
- Top Masters (primary) prices by Level on installed area. Level 1 $40, L2 $45, L3 $51, L4 $58, L5 $66, L6 $75, L7 $85, L8 $96, L9 $108, L10 $120, L11+ variable. Sink and cooktop cutout area counts toward the area. Fabrication waste is not charged separately. Thickness is not stated. https://www.topmastersllc.com/pricing
- Royal (primary, GA, 2026) gives installed ranges:
  - Granite $39–79
  - Quartz $65–149 (MSI Q $65–95, Silestone $79–119, Caesarstone $89–129, Cambria $99–149)
  - Quartzite $95–160
  - Marble $68–159
  - Thickness is not stated. https://royal-granite.com/countertop-cost-guide/
- Dynamic Stone Tools (secondary) gives installed granite at L1 $40–55, L2 $55–80, L3/exotic $85–150+, and quartz at $65–110. Urban CA/NY/PNW run 20–40% above the national average. Rural Midwest/South run 10–25% below. https://dynamicstonetools.com/blogs/news/stone-countertop-project-pricing-regional-rates-and-key-drivers
- Slabwise (secondary, a quoting-software vendor) gives installed retail of granite $50–80 basic and $90–160 premium, quartz $55–100, Carrara marble $80–130, quartzite $90–180. It says 3 cm costs about $5–15/sq ft more than 2 cm. https://slabwise.com/guides/how-to-price-countertop-jobs-when-slab-costs-fluctuate
- MSI (manufacturer, but this is a cost-guide blog) says raw 2 cm slabs are about 20–30% cheaper wholesale. Plywood and laminated-edge work erode most of that saving, so installed totals "often end up close." https://www.msisurfaces.com/blogs/post/2026/08/27/quartz-countertop-thickness-2cm-vs-3cm.aspx
- Quartz prices are rising. Perfect Stones, a fabricator in Charleston, reports quartz material up about 25% on average since the US quartz safeguard took effect on 2026-08-15. https://www.financialcontent.com/article/marketersmedia-2026-9-29-perfect-stones-updates-quartz-quoting-process-following-recent-material-price-changes
- Cambria (primary) has announced no price increases until at least 2028. https://www.cambriausa.com/news-events/press-room/cambria-pricing-guarantee

**Suggested starting value (3 cm, installed)**
- **Granite:** L1 $40, L2 $45, L3 $51, L4 $58, L5 $66 (Top Masters).
- **Quartz:** L1 $65 to L5 $129, using Royal's MSI Q floor and Caesarstone ceiling. Fill L2–L4 by straight-line interpolation ($81 / $97 / $113). Those three are my interpolation, not quoted prices.
- **Marble:** L1 $68 to L5 $159 (Royal), interpolating the middle levels the same way.
- **Quartzite:** L1 $95 to L5 $160 (Royal), interpolating the middle levels the same way.
- **2 cm:** the 3 cm price minus $10/sq ft. $10 is the midpoint of Slabwise's $5–15 gap (secondary).

**Conflicts / open questions**
- Level names are not standardized between shops.
- No primary source publishes separate 2 cm and 3 cm rates.
- Top Masters' rates are lower than all of the secondary guides.
- Quartz pricing after the safeguard is moving fast.

## 2. Is installation bundled into the $/sq ft rate?

**Findings**
- At fabricators, usually yes. Royal (primary) includes templating, fabrication, installation, tear-out, a standard edge and one undermount cutout in its rate. https://royal-granite.com/countertop-cost-guide/
- Top Masters (primary) prices "installed area." https://www.topmastersllc.com/pricing
- Dynamic Stone Tools (secondary) splits a typical installed price into material 30–40%, fabrication 35–45% and installation 15–25%, all inside one rate. https://dynamicstonetools.com/blogs/news/stone-countertop-project-pricing-regional-rates-and-key-drivers
- MSI (secondary) quotes installation separately, but MSI does not set retail prices. https://www.msisurfaces.com/blogs/post/2025/09/01/how-much-should-you-expect-to-pay-for-quartz-countertops.aspx

**Suggested starting value:** bundled. No separate install line.

**Conflicts / open questions:** Big-box retailers and some guides quote labor separately at $10–30/sq ft (secondary).

## 3. Edge profiles

**Findings**
- Top Masters (primary) charges per sq ft:
  - Eased, 1/4" round and 1/4" bevel: $0
  - Half bevel: $3
  - Half bullnose: $4
  - Full bullnose: $5
  - Cove: $6
  - Ogee: $7
  - Cove ogee: $8
  - https://www.topmastersllc.com/pricing
- Anytop Shop (primary) charges per linear ft: half bullnose, full bullnose and beveled $18, mitered $18, ogee $25. https://anytopshop.com/prices/
- Royal (primary) includes a standard eased or bullnose edge. Ogee, mitered and waterfall are quoted separately. Its general section gives ogee +$8–15/lf and mitered +$25–40/lf, but does not say these are its own rates. https://royal-granite.com/countertop-cost-guide/
- MSI (secondary) says eased edges are included and decorative profiles run $10–50+/lf. https://www.msisurfaces.com/blogs/post/2025/09/01/how-much-should-you-expect-to-pay-for-quartz-countertops.aspx

**Suggested starting value (per linear ft of exposed edge)**
- Eased: $0 (standard)
- 1/4" bevel: $0
- Half bullnose: $18
- Full bullnose: $18
- Ogee: $25
- Mitered: $18 (Anytop) or $25–40 (Royal general), so low confidence

**Conflicts / open questions:**
- The units disagree: Top Masters prices edges per sq ft, Anytop per linear ft.
- Royal treats a bullnose edge as free, while Anytop charges $18/lf for it.

## 4. Cutouts and faucet holes

**Findings**

| Item | Top Masters (primary) | Anytop Shop (primary) | Others |
|---|---|---|---|
| Undermount kitchen | $250 large/double; $200 small | $300 (includes polishing and mounting the sink) | Royal includes 1 undermount; Slabwise $75–125 and says it is often included (secondary) |
| Vanity | $150 | $175 | |
| Drop-in | $80 | $125 | |
| Farmhouse / apron | — | $200 | Royal "quoted separately", general range $150–300 |
| Cooktop | $80 | $200 (grill or range top) | |
| Faucet / fixture hole | $10 | $25 (vessel sink hole drill) | MSI $25–100 (secondary) |
| Outlet | $25 | $65 | |

Sources: https://www.topmastersllc.com/pricing, https://anytopshop.com/prices/, https://royal-granite.com/countertop-cost-guide/, https://www.msisurfaces.com/blogs/post/2025/09/01/how-much-should-you-expect-to-pay-for-quartz-countertops.aspx

**Suggested starting value**
- Undermount: $250
- Drop-in: $100 (midpoint of $80 and $125)
- Farmhouse: $200
- Cooktop: $150 (midpoint of $80 and $200)
- Faucet hole: $25

**Conflicts / open questions:**
- Some shops include the first undermount cutout in the rate.
- Top Masters counts the cutout area as billable sq ft.

## 5. Radius corner

**Findings**
- Top Masters (primary) charges $12 for a "finished outer corner" and $18 for a "finished inner corner." It does not say whether "finished" means radiused. https://www.topmastersllc.com/pricing
- No other priced source was found.

**Suggested starting value:** $12 each (outer). Low confidence.

**Conflicts / open questions:** Nothing else found. Ask an expert whether radius corners are typically charged at all.

## 6. Are seams charged separately?

**Findings**
- Top Masters (primary) lists "Seam: $80." https://www.topmastersllc.com/pricing
- Royal (primary) does not list a seam charge. https://royal-granite.com/countertop-cost-guide/
- Dynamic Stone Tools (secondary) says extra seams add cost but gives no price. https://dynamicstonetools.com/blogs/news/stone-countertop-project-pricing-regional-rates-and-key-drivers
- MSI (secondary) names seams as a cost driver without a price. https://www.msisurfaces.com/blogs/post/2025/09/01/how-much-should-you-expect-to-pay-for-quartz-countertops.aspx

**Suggested starting value:** no seam charge by default. Offer an optional $80 per seam.

**Conflicts / open questions:** Only one shop charges for seams. The evidence is weak in both directions.

## 7. 4" backsplash

**Findings**
- No primary price was found.
- Slabwise calculator (secondary): $15–35/lf for 4" stone, $40–80/lf for full height. https://slabwise.com/tools/pricing-calculator
- Other guides (secondary) give $8–15/lf and $15–30/lf. https://dynamicstonetools.com/blogs/news/stone-countertop-cost-guide-what-everything-actually-costs
- Royal (primary) quotes backsplash separately and gives no price. https://royal-granite.com/countertop-cost-guide/

**Suggested starting value:** $20/lf. Low confidence, picked from inside the overlapping secondary ranges.

**Conflicts / open questions:** Some shops price backsplash as sq ft at the material rate.

## 8. Templating, tear-out, minimum job

**Findings**
- **Templating:**
  - Dynamic Stone Tools (secondary): $75–200, "sometimes waived or included." https://dynamicstonetools.com/blogs/news/stone-countertop-project-pricing-regional-rates-and-key-drivers
  - Royal (primary) includes laser templating. https://royal-granite.com/countertop-cost-guide/
  - Neither primary price list has a template line.
- **Tear-out:**
  - Anytop (primary): kitchen laminate $300, kitchen granite or Corian $400, vanity $150. It does not remove tile countertops. https://anytopshop.com/prices/
  - Royal (primary): tear-out included at no charge.
- **Minimum job:**
  - Dynamic Stone Tools (secondary): $800–1,500.
  - Slabwise pages (secondary) give $300–500, $400–800 and $500–1,500 on different pages, and also 15–40 sq ft minimums. https://slabwise.com/guides/what-is-the-minimum-square-footage-worth-quoting-for-countertops
  - NFM (retailer): a 30 sq ft minimum for special-order tops.
  - No primary $ minimum was found.

**Suggested starting values**
- Templating: $0 bundled, configurable. If a value is shown, use $150 (inside the $75–200 secondary range).
- Tear-out: $400 kitchen, $150 vanity.
- Minimum job: $800 (low end of Dynamic Stone Tools' range). Low confidence.

## 9. Rounding area

**Findings**
- No fabricator source for a rounding rule was found.
- Top Masters (primary) bills "installed area" and charges no waste. https://www.topmastersllc.com/pricing
- One homeowner calculator (secondary) suggests rounding up to the nearest 0.5 sq ft. https://graniteselection.com/countertop-square-footage-calculator/
- Slabwise (secondary) adds a 10–25% waste allowance rather than rounding. https://slabwise.com/guides/how-to-price-countertop-jobs-when-slab-costs-fluctuate

**Suggested starting value:** round up to a whole sq ft, as the app spec says. Unverified.

**Conflicts / open questions:** It is unclear whether shops round per piece or per job.

## 10. Quote validity

**Findings**
- Slabwise (secondary vendor): 30 days is typical, sometimes 60 for large jobs. Price locks on deposit. https://slabwise.com/guides/how-to-price-countertop-jobs-when-slab-costs-fluctuate
- No primary source was found.
- The roughly 25% post-safeguard quartz jump (see §1) argues for a short validity window.

**Suggested starting value:** 30 days. Medium-low confidence.

## 11. Minimum clearances around cutouts

**Findings**
- **Caesarstone (primary):**
  - Outdoor guide: 60 mm (2½") minimum from cutout to edge or seam. https://www.caesarstoneus.com/wp-content/uploads/2021/02/Caesarstone-Outdoor-Technical-Guide-US-v0221.pdf
  - B2B portal: 10 mm (⅜") minimum cutout corner radius. https://mos.caesarstone.com/?p=317
  - Indoor guide not readable: https://www.caesarstone.com/media/339388/caesarstone-fabrication-and-installation-guide-v0321-gen.pdf
- **Cambria (primary):**
  - Sink SOP 9.2.2n: ½" minimum inside corner radius. https://www.cambriausa.com/content/dam/cusa/sales-marketing-collateral/sops/sop-9.2.2n-sink-drawing-and-fabrication-requirements.pdf
  - SOP 9.3.3: radius corners required on all cutouts; 1/8" expansion clearance around appliances; support required within 3" of every cutout. https://www.cambriausa.com/content/dam/cusa/sales-marketing-collateral/sops/sop-9.3.3-installation-requirements-for-cambria.pdf
  - I did not find a cutout-to-seam or cutout-to-edge number in the Cambria SOPs I read.
- **Silestone/Cosentino:** a search summary cited "≥ 5 cm from fitting to slab edge" and "≥ 15 cm from fitting to seams/joins." I could not find the document that says this. The 2014 Silestone professional manual I did read only says the corner radius must be "never less than 4 mm" (https://www.eboss.co.nz/assets/literature/400/30173/manual-professional-use.pdf). **Unverified.**
- **Rule of thumb (secondary):** at least 3" of stone between any seam and a cutout. https://slabwise.com/guides/what-is-the-minimum-stone-around-a-cooktop-cutout

**Suggested starting value**
- Cutout to edge: ≥ 3" (76 mm). This covers Caesarstone's 2½".
- Cutout to seam: ≥ 3". Raise to 6" if the Silestone 15 cm figure is confirmed.
- Cutout inside corner radius: ≥ ½" (Cambria).

**Conflicts / open questions:** The Caesarstone 60 mm figure comes from its outdoor guide. The Silestone figures are unconfirmed.

## 12. Slab sizes

**Findings**
- **Caesarstone (primary, US site):** standard 120" × 56.5", jumbo 131.5" × 64.5". The Canadian site lists jumbo as 128" × 64.5" ±1.5%. https://www.caesarstoneus.com/countertop
- **MSI (manufacturer blog):** 2 cm about 55" × 120"; 3 cm 63" × 126", described as MSI's standard 3 cm size. https://www.msisurfaces.com/blogs/post/2026/08/27/quartz-countertop-thickness-2cm-vs-3cm.aspx
- **Cambria (secondary, distributor listing):** jumbo 132" × 65.5". A third-party guide gives standard as 122" × 55.5". https://www.materialbank.com/na/en-US/products/warwick-102010330
- **Granite (secondary):** roughly 108–120" × 60–72"; named examples are about 112–114" × 65". https://www.hunker.com/13402826/what-are-the-dimensions-of-a-granite-slab/

**Suggested starting value**
- Quartz standard: 120" × 56"
- Quartz jumbo: 126" × 63"
- Granite: 110" × 65"

## 13. Standard depths

**Findings**
- **Kitchen (secondary):** 25½" countertop on a 24" cabinet, which leaves a 1½" front overhang. https://www.livingetc.com/advice/kitchen-countertop-standard-depth
- **Island seating overhang (secondary, designer quotes):** 15" at counter height (36"), 12" at bar height (42"), 18" at table height (30"). This matches the NKBA knee-space figures as other secondary sites report them.
- **Cambria (primary) overhang limits:**
  - Overhang must be no more than ⅓ of the countertop depth.
  - Overhangs over 12" (2 cm) or 15" (3 cm) need added support.
  - Overhangs over 18" (2 cm) or 24" (3 cm) need a full substrate. https://cambriausa.com/content/dam/cusa/sales-marketing-collateral/sops/countertop-installation-technical-guideline.pdf
- **Vanity (MSI blog):** 22–25" deep is "relatively typical." https://www.msisurfaces.com/blogs/post/2026/08/27/quartz-countertop-thickness-2cm-vs-3cm.aspx

**Suggested starting value**
- Kitchen: 25.5"
- Vanity: 22"
- Island seating overhang: 15" (cap at ⅓ of depth per Cambria)

## Extra: is 2 cm in a kitchen a concern?

**Findings**
- **MSI (manufacturer blog):** 2 cm quartz needs "at least a full ¾" plywood" base on horizontal surfaces, which adds about $5–10/sq ft. A laminated build-up strip under the front edge makes it look like 4 cm and adds about 5–10% to edge cost. Unsupported overhang is limited to 8" for 2 cm, against 16" for 3 cm. https://www.msisurfaces.com/blogs/post/2026/08/27/quartz-countertop-thickness-2cm-vs-3cm.aspx
- **Cambria (primary) SOP 9.3.3:** requires a full substrate only for 1 cm, or for overhangs over 18" in 2 cm. It calls for ¾" plywood when a substrate is used, and says particle board is not acceptable. https://www.cambriausa.com/content/dam/cusa/sales-marketing-collateral/sops/sop-9.3.3-installation-requirements-for-cambria.pdf
- **Arizona Tile (distributor, secondary):** a 2 cm top needs support for overhangs over 6"; 3 cm can go up to about 10". https://www.arizonatile.com/2-cm-countertop-vs-3-cm-countertop/

**Suggested starting value:** allow 2 cm in kitchens, with a warning. Optionally add a plywood line (about $5–10/sq ft, MSI) and a laminated-edge line.

**Conflicts / open questions:** MSI and Cambria disagree on whether 2 cm always needs plywood, and on overhang limits (8", 12" and 6" across the three sources).

---

## Summary table

| Item | Unit | Suggested value | Confidence | Source |
|---|---|---|---|---|
| Granite 3 cm L1–L5 | $/sq ft | 40 / 45 / 51 / 58 / 66 | med | Top Masters (primary) |
| Quartz 3 cm L1–L5 | $/sq ft | 65 / 81 / 97 / 113 / 129 (middle levels interpolated) | low-med | Royal (primary) |
| Marble 3 cm L1–L5 | $/sq ft | 68 → 159 (interpolated) | low | Royal (primary) |
| Quartzite 3 cm L1–L5 | $/sq ft | 95 → 160 (interpolated) | low | Royal (primary) |
| 2 cm discount vs 3 cm | $/sq ft | −10 | low | Slabwise (secondary) |
| Install | — | bundled | med | Royal, Top Masters (primary) |
| Eased / ¼" bevel edge | $/lf | 0 | high | Top Masters, Royal, MSI |
| Half or full bullnose | $/lf | 18 | med | Anytop (primary) |
| Ogee | $/lf | 25 | med | Anytop (primary) |
| Mitered | $/lf | 18 | low | Anytop (primary); Royal says 25–40 |
| Undermount cutout | each | 250 | med | Top Masters, Anytop (primary) |
| Drop-in cutout | each | 100 | med | Top Masters $80, Anytop $125 |
| Farmhouse cutout | each | 200 | med | Anytop (primary) |
| Cooktop cutout | each | 150 | low-med | Top Masters $80, Anytop $200 |
| Faucet hole | each | 25 | low-med | Anytop $25, Top Masters $10 |
| Radius corner | each | 12 | low | Top Masters "finished corner" |
| Seam | each | 0 by default (optional 80) | low | Top Masters only |
| 4" backsplash | $/lf | 20 | low | secondary only |
| Templating | job | 0 bundled (or 150) | low | Royal; Dynamic Stone Tools (secondary) |
| Tear-out, kitchen | job | 400 | med | Anytop (primary) |
| Minimum job | job | 800 | low | secondary only |
| Area rounding | — | ceil to 1 sq ft | low | none found |
| Quote validity | days | 30 | med-low | Slabwise (secondary) |
| Cutout to edge / seam | in | ≥ 3 / ≥ 3 | low-med | Caesarstone 2½" (outdoor); rule of thumb |
| Cutout corner radius | in | ≥ ½ | high | Cambria SOP |
| Quartz slab std / jumbo | in | 120×56 / 126×63 | high | Caesarstone, MSI |
| Granite slab | in | 110×65 | med | secondary |
| Depth: kitchen / vanity / island overhang | in | 25.5 / 22 / 15 | med | secondary; MSI; Cambria ⅓ rule |

## Questions for an industry expert

1. Do you publish separate 2 cm and 3 cm rates, and what is the typical gap?
2. Do you round billable area, and if so, per piece or per job, and to what increment?
3. Is the first undermount cutout included in the $/sq ft rate?
4. Do you ever charge per seam, or is it absorbed into the rate?
5. Do you charge for radius corners, and how much?
6. Is a 4" backsplash priced per lf or as sq ft at the material rate?
7. What is your minimum job charge in $ or sq ft, and does a vanity-only job fall under it?
8. Is templating ever a separate line item?
9. How long are your quotes valid now, given the 2026 quartz safeguard?
10. What minimum stone do you require from a cutout to the edge and to a seam? Does it differ for quartz and natural stone?
11. Do you require plywood under 2 cm in kitchens, and do you always laminate the front edge?
12. How do your price groups map across granite, quartz, marble and quartzite? Is it one shared scale or one per material?
