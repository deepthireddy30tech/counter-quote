using System.ComponentModel.DataAnnotations;
using CounterQuote.Api.Models;

namespace CounterQuote.Api.Tests;

/// <summary>The caps on a job's lists, checked the way the API checks a request body: one object's own properties at a time.</summary>
public class ListLimitTests
{
    private static List<string> Problems(object o)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(o, new ValidationContext(o), results, validateAllProperties: true);
        return results.Select(r => r.ErrorMessage!).ToList();
    }

    private static Leg Leg() => new() { Length = 96, Depth = 25.5 };

    [Fact]
    public void A_job_at_each_limit_is_accepted()
    {
        Job job = new()
        {
            CustomerName = "Rivera",
            Counters = Enumerable.Range(0, 20).Select(_ => new Counter { Legs = [Leg()] }).ToList(),
            AdditionalRequirements = Enumerable.Range(0, 50).Select(_ => new AdditionalRequirement { Description = "x" }).ToList(),
            LineItems = Enumerable.Range(0, 500).Select(_ => new QuoteLineItem()).ToList(),
        };
        Assert.Empty(Problems(job));
        Assert.Empty(Problems(new Counter { Legs = Enumerable.Range(0, 12).Select(_ => Leg()).ToList() }));
        Assert.Empty(Problems(new Leg { Length = 96, Depth = 25.5, Cutouts = Enumerable.Range(0, 10).Select(_ => new Cutout { Kind = "undermount" }).ToList() }));
    }

    [Fact]
    public void One_more_than_each_limit_is_refused()
    {
        Job job = new()
        {
            CustomerName = "Rivera",
            Counters = Enumerable.Range(0, 21).Select(_ => new Counter { Legs = [Leg()] }).ToList(),
            AdditionalRequirements = Enumerable.Range(0, 51).Select(_ => new AdditionalRequirement { Description = "x" }).ToList(),
            LineItems = Enumerable.Range(0, 501).Select(_ => new QuoteLineItem()).ToList(),
        };
        Assert.Equal(
            ["A job can have at most 20 counters.", "A job can have at most 50 additional requirements.", "A quote can have at most 500 line items."],
            Problems(job));
        Assert.Equal(["A counter can have at most 12 legs."], Problems(new Counter { Legs = Enumerable.Range(0, 13).Select(_ => Leg()).ToList() }));
        Assert.Equal(["A leg can have at most 10 cutouts."],
            Problems(new Leg { Length = 96, Depth = 25.5, Cutouts = Enumerable.Range(0, 11).Select(_ => new Cutout { Kind = "undermount" }).ToList() }));
    }
}
