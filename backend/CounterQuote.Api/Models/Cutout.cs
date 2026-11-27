using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

/// <summary>A cutout belongs to the leg it sits on; its counter comes through the leg.</summary>
public class Cutout
{
    public int Id { get; set; }
    public int LegId { get; set; }

    [AllowedValues("undermount", "dropin", "farmhouse", "cooktop")]
    public string Kind { get; set; } = "undermount";

    /// <summary>Inches from the leg's start along its back edge.</summary>
    [Range(0, 10_000)]
    public double Centerline { get; set; }

    [Range(0, 5)]
    public int FaucetHoles { get; set; }
}
