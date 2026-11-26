# Counters are chains of legs

Status: accepted

Every counter is a chain of legs, each with a length, a depth and a turn angle from the previous leg; Straight, L-shape and U-shape are just one, two and three legs. The legs are turned into one outline, and area, edges, drawing and price all work from that outline. We chose this over separate code per layout because it matches how shops measure (wall by wall), avoids writing the maths three times, and makes angled legs and more legs an extension rather than a rewrite.

## Consequences

A leg's length is measured along its back edge into the corner, so neighbouring legs overlap there. Area must come from the outline, never from adding up length × depth per leg, which would charge for every corner square twice.
