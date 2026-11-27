using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

/// <summary>A line of the saved quote, as the browser priced it.</summary>
public class QuoteLineItem
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int Position { get; set; }

    /// <summary>The counter's name, or "Job" for job-wide lines.</summary>
    [MaxLength(100)]
    public string Counter { get; set; } = "";

    [MaxLength(200)]
    public string Description { get; set; } = "";

    public decimal Quantity { get; set; }

    [MaxLength(20)]
    public string Unit { get; set; } = "";

    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
