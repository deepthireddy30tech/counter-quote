# Counter Quote

A tool a countertop shop's salesperson uses to draw a customer's counter and give them a price on the spot.

## People

**Salesperson**:
Shop staff who draws the counter and quotes the price, usually with the customer present or on the phone.
_Avoid_: User, estimator, rep

**Shop owner**:
The person who keeps the shop's price list up to date.
_Avoid_: Shopkeeper, admin, manager

## Shape

**Job**:
One customer's order: one or more counters, quoted together with one templating visit and one minimum job charge.
_Avoid_: Project, order, ticket

**Counter**:
One continuous countertop in a job, made of one or more legs, with its own material and edge profile. A kitchen L and its island are two counters.
_Avoid_: Countertop piece, top, slab (a slab is the raw stone it's cut from)

**Leg**:
One straight stretch of a counter, with a length, a depth and the angle it turns from the leg before it.
_Avoid_: Run, section, segment, arm

**Length**:
How far a leg runs, measured along its back edge into the corner, the way it's taped on site. Neighboring legs overlap at the corner.
_Avoid_: Run length, width

**Turn angle**:
The angle inside the corner between a leg and the leg before it: 90° for a square corner, 135° where a corner cabinet sits at 45°.
_Avoid_: Bend, rotation, heading, corner angle

**Thickness**:
How thick a counter's stone is: 2 cm or 3 cm. Chosen per counter; changes the price per square foot.
_Avoid_: Slab thickness, gauge, depth (depth is front to back)

**Leg side**:
One of a leg's four sides: back (toward the wall), front (toward the room), start end and finish end. Every edge of a counter belongs to one leg side.
_Avoid_: Edge number, edge index

**Depth**:
How far a leg reaches from its back edge to its front edge.
_Avoid_: Width

**Layout**:
The named arrangement of legs: Straight (one leg), L-shape (two), U-shape (three).
_Avoid_: Shape type, template

**Straight**:
A layout with a single leg.
_Avoid_: Rectangle, single run

**Room**:
What a counter is for: Kitchen, Island, Bathroom or Other. Sets its starting depth and edge defaults and names it on the quote.
_Avoid_: Area, location, space, type

**Island**:
The room for a freestanding counter; a new island counter starts with every edge exposed. Not a separate layout.
_Avoid_: Freestanding counter

## Edges

**Edge**:
One side of the counter's outline, either exposed or covered.

**Exposed edge**:
An edge people can see and touch, which gets polished to the chosen profile and is charged per linear foot.
_Avoid_: Finished edge, front edge, open edge

**Covered edge**:
An edge hidden against a wall, appliance or tall cabinet; it gets no profile and isn't charged.
_Avoid_: Wall edge, back edge, unfinished edge

**Edge profile**:
The shape polished into every exposed edge of a counter (for example eased, bevel, bullnose, ogee). One per counter.
_Avoid_: Edge type, edge finish, edging

**Backsplash**:
A 4" strip of the counter's stone standing up along its covered edges. On or off for the whole counter; charged per linear foot.
_Avoid_: Splash, backsplash tile, upstand

## Pricing

**Quote**:
The itemized price for a whole job: a list of line items across all its counters, and their total.
_Avoid_: Estimate, bid, invoice

**Saved quote**:
The quote exactly as it was when the job was last saved, kept unchanged even if the price list changes later.
_Avoid_: Snapshot, frozen quote, old quote

**Re-price**:
Replacing a saved quote with one worked out from today's price list. Happens when the design is edited or the salesperson asks for it.
_Avoid_: Recalculate, refresh, update prices

**Valid until**:
The date after which the shop no longer promises a saved quote's price; set by the price list's number of days.
_Avoid_: Expiry, quote expiration

**Line item**:
One charge on a quote, with what it's for, how much of it, the rate and the amount.
_Avoid_: Row, charge, entry

**Templating**:
A site visit to measure the counter exactly before cutting. A flat fee.
_Avoid_: Measure, site survey

**Tear-out**:
Removing and disposing of the customer's old counters. Optional.
_Avoid_: Demo, removal, rip-out

**Minimum job charge**:
The lowest total a shop will accept; a smaller quote is raised to it with its own line item.
_Avoid_: Minimum order, small job fee

**Price list**:
The shop's own rates for every price group, edge profile, cutout and fee. Changed by the shop when suppliers raise prices, not live market data.
_Avoid_: Rate card, pricing table, rates

**Material**:
The specific stone or surface the counter is made from, such as a named granite or quartz color.
_Avoid_: Stone type, finish, color

**Price group**:
The band a material belongs to, which sets its price per square foot.
_Avoid_: Level, tier, grade, category

**Charged area**:
The counter's exact top area, rounded up to the next whole square foot. Waste is already built into the price per square foot.
_Avoid_: Billable area, square footage, size

**Slab**:
A raw sheet of stone as it arrives from the supplier, which counters are cut from.
_Avoid_: Sheet, panel

**Seam**:
A joint where two pieces of a counter meet, needed at inside corners and wherever a leg is longer than a slab.
_Avoid_: Joint, splice

**Slab estimate**:
How many slabs a counter is likely to use. Shown as a check; it doesn't change the price.
_Avoid_: Slab count, slab requirement

## Corners

**Outside corner**:
A corner that points away from the counter, such as the front corners at the end of a leg.
_Avoid_: Convex corner, end corner

**Inside corner**:
A corner where the counter turns, pointing into the counter. Always given a small fabrication radius so the stone doesn't crack; never a customer choice.
_Avoid_: Concave corner, elbow

**Radius corner**:
An outside corner with both edges exposed that the customer has asked to be rounded. Charged per corner.
_Avoid_: Rounded corner, bullnose corner, eased corner

## Cutouts

**Cutout**:
A hole cut through the counter for a sink or cooktop. Charged each, by kind.
_Avoid_: Hole, opening, penetration

**Sink cutout**:
A cutout for a sink: undermount (sink below the stone, cut edge polished), drop-in (rim covers a rough cut) or farmhouse (breaks through the front edge).
_Avoid_: Sink hole, basin cut

**Cooktop cutout**:
A cutout for a cooktop to drop into.
_Avoid_: Range cutout, hob cutout, stove cutout

**Faucet hole**:
A small hole drilled behind a sink for a faucet or accessory. Charged each; not a cutout.
_Avoid_: Tap hole, drill hole

**Centerline**:
Where a cutout sits: the distance along a leg from its start to the middle of the cutout, as measured on site.
_Avoid_: Offset, position, x
