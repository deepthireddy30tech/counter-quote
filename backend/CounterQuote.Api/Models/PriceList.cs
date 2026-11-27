using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

public class PriceGroup
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public List<PriceGroupRate> Rates { get; set; } = [];
}

public class PriceGroupRate
{
    public int Id { get; set; }
    public int PriceGroupId { get; set; }

    [AllowedValues(2, 3)]
    public int Thickness { get; set; }

    [Range(0, 10_000)]
    public decimal PricePerSqFt { get; set; }
}

public class Material
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    public int PriceGroupId { get; set; }
}

public class EdgeProfile
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = "";

    [Range(0, 10_000)]
    public decimal PricePerLinearFt { get; set; }
}

/// <summary>
/// A flat charge or setting, by kind: undermount, dropin, farmhouse, cooktop, faucetHole, radiusCorner,
/// backsplash (per lf), seam, templating, tearOut, minimum, quoteValidDays.
/// </summary>
public class Fee
{
    public int Id { get; set; }

    [Required, MaxLength(40)]
    public string Kind { get; set; } = "";

    [Range(0, 1_000_000)]
    public decimal Amount { get; set; }
}

/// <summary>The whole price list, read and saved in one request. Not a table.</summary>
public class PriceList
{
    public List<PriceGroup> PriceGroups { get; set; } = [];
    public List<Material> Materials { get; set; } = [];
    public List<EdgeProfile> EdgeProfiles { get; set; } = [];
    public List<Fee> Fees { get; set; } = [];
}
