# Jobs are stored in relational tables, with edge and corner choices on legs

Status: accepted

A job's counter, cutouts, saved quote and the shop's price list are stored as separate tables rather than JSON on the job, so the database enforces their shape and the data can be queried (for example, undermount sinks quoted this month). Edge and corner choices are stored on the leg they belong to (its back, front, start or end side, and its four outside corners) rather than as numbered edges of the outline, because outline edge numbers shift whenever a leg is added or lengthened, while "leg 1, end" stays true.

A job holds several counters (a kitchen L and its island), each with its own material and edge profile; legs and cutouts belong to a counter, while templating, tear-out, the minimum job charge and the saved quote belong to the job.

## Considered Options

- JSON columns for the design and quote on Job: less backend code, and the drawing is always read and written whole, but the database can't check it and it can't be queried.
- Edge choices stored by outline edge number: simple to write, but silently moves choices to the wrong edge when legs change.

## Consequences

Saving a job means adding, changing and removing leg, cutout and line item rows by hand, because the starter's `SetValues` update skips related rows (see DEVELOPMENT.md). Seams are never stored; they are always worked out from the legs.
