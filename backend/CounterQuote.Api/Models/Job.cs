using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

/// <summary>A customer's job. The saved quote (total, line items, drawing) is filled in by the browser on Save (ADR 0002).</summary>
public class Job
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string CustomerName { get; set; } = "";

    public bool TearOut { get; set; }

    public decimal? Total { get; set; }

    public DateTime? SavedAt { get; set; }

    public DateTime? ValidUntil { get; set; }

    /// <summary>The plan drawing from the browser; only ever rendered into the PDF, never served as a page.</summary>
    [MaxLength(500_000)]
    public string? QuoteDrawingSvg { get; set; }

    public DateTime CreatedDate { get; set; }

    public List<Counter> Counters { get; set; } = [];

    public List<AdditionalRequirement> AdditionalRequirements { get; set; } = [];

    public List<QuoteLineItem> LineItems { get; set; } = [];
}
