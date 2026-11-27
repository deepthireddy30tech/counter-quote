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

    [MinLength(1)]
    public List<Leg> Legs { get; set; } = [];
}
