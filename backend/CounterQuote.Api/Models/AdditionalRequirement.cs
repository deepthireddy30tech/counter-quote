using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

public class AdditionalRequirement
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int Position { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = "";

    [Range(0, 1_000_000)]
    public decimal Price { get; set; }
}
