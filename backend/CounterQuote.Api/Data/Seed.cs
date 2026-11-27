using CounterQuote.Api.Models;

namespace CounterQuote.Api.Data;

/// <summary>Starting price list (docs/research/pricing.md summary table) and one sample job. Each runs only on an empty table.</summary>
public static class Seed
{
    // 3 cm $/sq ft for groups 1–5; 2 cm is $10 less
    private static readonly (string Kind, int[] Rates)[] Groups =
    [
        ("Granite", [40, 45, 51, 58, 66]),
        ("Quartz", [65, 81, 97, 113, 129]),
        ("Marble", [68, 91, 114, 136, 159]),
        ("Quartzite", [95, 111, 128, 144, 160]),
    ];

    private static readonly (string Name, string Group)[] Materials =
    [
        ("Steel Grey", "Granite 2"),
        ("Uba Tuba", "Granite 1"),
        ("Absolute Black", "Granite 3"),
        ("Arctic White", "Quartz 1"),
        ("Calacatta-look white", "Quartz 3"),
        ("Carrara", "Marble 2"),
        ("Taj Mahal", "Quartzite 2"),
    ];

    private static readonly (string Name, decimal Rate)[] EdgeProfiles =
    [
        ("Eased", 0), ("¼″ bevel", 0), ("Half bullnose", 18), ("Full bullnose", 18), ("Ogee", 25), ("Mitered", 18),
    ];

    private static readonly (string Kind, decimal Amount)[] Fees =
    [
        ("undermount", 250), ("dropin", 100), ("farmhouse", 200), ("cooktop", 150), ("faucetHole", 25),
        ("radiusCorner", 12), ("backsplash", 20), ("seam", 0), ("templating", 150), ("tearOut", 400),
        ("minimum", 800), ("quoteValidDays", 30),
    ];

    public static void Run(AppDbContext db)
    {
        if (!db.PriceGroups.Any())
        {
            var groups = Groups.SelectMany(g => g.Rates.Select((rate, i) => new PriceGroup
            {
                Name = $"{g.Kind} {i + 1}",
                Rates = [new() { Thickness = 2, PricePerSqFt = rate - 10 }, new() { Thickness = 3, PricePerSqFt = rate }],
            })).ToList();
            db.PriceGroups.AddRange(groups);
            db.SaveChanges();
            db.Materials.AddRange(Materials.Select(m => new Material { Name = m.Name, PriceGroupId = groups.Single(g => g.Name == m.Group).Id }));
            db.EdgeProfiles.AddRange(EdgeProfiles.Select(e => new EdgeProfile { Name = e.Name, PricePerLinearFt = e.Rate }));
            db.Fees.AddRange(Fees.Select(f => new Fee { Kind = f.Kind, Amount = f.Amount }));
            db.SaveChanges();
        }

        if (!db.Jobs.Any())
        {
            int steelGrey = db.Materials.Single(m => m.Name == "Steel Grey").Id;
            int eased = db.EdgeProfiles.Single(e => e.Name == "Eased").Id;
            db.Jobs.Add(new Job
            {
                CustomerName = "Sample: kitchen L and island",
                CreatedDate = DateTime.UtcNow,
                Counters =
                [
                    new()
                    {
                        Position = 0, Room = "Kitchen", MaterialId = steelGrey, Thickness = 3, EdgeProfileId = eased, Backsplash = true,
                        Legs =
                        [
                            new()
                            {
                                Position = 0, Length = 120, Depth = 25.5, BackCovered = true, StartCovered = true,
                                Cutouts = [new() { Kind = "undermount", Centerline = 60, FaucetHoles = 3 }],
                            },
                            new() { Position = 1, Length = 96, Depth = 25.5, TurnAngle = 90, BackCovered = true },
                        ],
                    },
                    new()
                    {
                        Position = 1, Room = "Island", MaterialId = steelGrey, Thickness = 3, EdgeProfileId = eased,
                        Legs = [new() { Position = 0, Length = 72, Depth = 36 }],
                    },
                ],
            });
            db.SaveChanges();
        }
    }
}
