using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

public class Counter
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int Position { get; set; }

    [AllowedValues("Kitchen", "Island", "Bathroom", "Other")]
    public string Room { get; set; } = "Kitchen";

    public int MaterialId { get; set; }

    [AllowedValues(2, 3)]
    public int Thickness { get; set; } = 3;

    public int EdgeProfileId { get; set; }
    public bool Backsplash { get; set; }

    /// <summary>How the plan is turned on screen and in the PDF, clockwise in 90° steps. Drawing only; never priced.</summary>
    [AllowedValues(0, 90, 180, 270)]
    public int Rotation { get; set; }

    /// <summary>The plan drawn as its mirror image, so a counter can turn left or right as the room does.</summary>
    public bool Mirrored { get; set; }

    [MinLength(1, ErrorMessage = "A counter needs at least one leg."), MaxLength(12, ErrorMessage = "A counter can have at most 12 legs.")]
    public List<Leg> Legs { get; set; } = [];
}
