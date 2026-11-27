using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

/// <summary>Sizes in decimal inches. Edge and corner choices are per leg side (ADR 0003).</summary>
public class Leg
{
    public int Id { get; set; }
    public int CounterId { get; set; }
    public int Position { get; set; }

    [Range(0.125, 10_000)]
    public double Length { get; set; }

    [Range(0.125, 10_000)]
    public double Depth { get; set; }

    /// <summary>Degrees at the corner with the leg before; ignored on the first leg.</summary>
    [Range(0, 180)]
    public double TurnAngle { get; set; }

    public bool BackCovered { get; set; }
    public bool FrontCovered { get; set; }
    public bool StartCovered { get; set; }
    public bool EndCovered { get; set; }
    public bool StartFrontRadius { get; set; }
    public bool StartBackRadius { get; set; }
    public bool EndFrontRadius { get; set; }
    public bool EndBackRadius { get; set; }

    public List<Cutout> Cutouts { get; set; } = [];
}
