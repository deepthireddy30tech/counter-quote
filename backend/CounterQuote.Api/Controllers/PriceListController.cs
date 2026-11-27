using CounterQuote.Api.Data;
using CounterQuote.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CounterQuote.Api.Controllers;

/// <summary>The shop's price list, read and saved whole. Rows missing from a save are deleted, unless a job still uses them.</summary>
[ApiController]
[Route("api/price-list")]
public class PriceListController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<PriceList> Get() => new()
    {
        PriceGroups = await db.PriceGroups.AsNoTracking().Include(g => g.Rates.OrderBy(r => r.Thickness)).OrderBy(g => g.Id).ToListAsync(),
        Materials = await db.Materials.AsNoTracking().OrderBy(m => m.Id).ToListAsync(),
        EdgeProfiles = await db.EdgeProfiles.AsNoTracking().OrderBy(e => e.Id).ToListAsync(),
        Fees = await db.Fees.AsNoTracking().OrderBy(f => f.Id).ToListAsync(),
    };

    /// <summary>
    /// Rows with an id update that row; id 0 adds one.
    /// shortcut: a new material can't point at a price group added in the same save (it has no id yet); save the group first.
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<PriceList>> Update(PriceList incoming)
    {
        List<PriceGroup> groups = await db.PriceGroups.Include(g => g.Rates).ToListAsync();
        List<Material> materials = await db.Materials.ToListAsync();
        List<EdgeProfile> profiles = await db.EdgeProfiles.ToListAsync();
        List<Fee> fees = await db.Fees.ToListAsync();

        if (Problem(incoming, groups, materials, profiles, fees) is string problem)
        {
            ModelState.AddModelError("priceList", problem);
            return BadRequest(new ValidationProblemDetails(ModelState));
        }
        foreach (Material removed in Removed(materials, incoming.Materials, m => m.Id))
            if (await db.Counters.AnyAsync(c => c.MaterialId == removed.Id))
                return Conflict(new ProblemDetails { Title = $"{removed.Name} is used by a saved job, so it can't be deleted." });
        foreach (EdgeProfile removed in Removed(profiles, incoming.EdgeProfiles, e => e.Id))
            if (await db.Counters.AnyAsync(c => c.EdgeProfileId == removed.Id))
                return Conflict(new ProblemDetails { Title = $"{removed.Name} is used by a saved job, so it can't be deleted." });
        foreach (PriceGroup removed in Removed(groups, incoming.PriceGroups, g => g.Id))
            if (incoming.Materials.Any(m => m.PriceGroupId == removed.Id))
                return Conflict(new ProblemDetails { Title = $"{removed.Name} still has materials, so it can't be deleted." });

        Sync(groups, incoming.PriceGroups, g => g.Id);
        foreach (PriceGroup g in incoming.PriceGroups.Where(g => g.Id != 0))
            SyncRates(groups.Single(x => x.Id == g.Id), g.Rates);
        Sync(materials, incoming.Materials, m => m.Id);
        Sync(profiles, incoming.EdgeProfiles, e => e.Id);
        foreach (Fee f in incoming.Fees)
            fees.Single(x => x.Kind == f.Kind).Amount = f.Amount;
        await db.SaveChangesAsync();
        return await Get();
    }

    /// <summary>Ids that don't exist, materials pointing at a group that was never saved, or unknown fee kinds.</summary>
    private static string? Problem(PriceList incoming, List<PriceGroup> groups, List<Material> materials, List<EdgeProfile> profiles, List<Fee> fees)
    {
        bool Unknown<T>(List<T> current, List<T> items, Func<T, int> id) => items.Any(i => id(i) != 0 && current.All(c => id(c) != id(i)));
        return
            Unknown(groups, incoming.PriceGroups, g => g.Id) || Unknown(materials, incoming.Materials, m => m.Id) || Unknown(profiles, incoming.EdgeProfiles, e => e.Id)
                ? "The price list changed since it was loaded. Reload the page and try again."
            : incoming.Materials.FirstOrDefault(m => groups.All(g => g.Id != m.PriceGroupId)) is Material lost
                ? $"{lost.Name} needs a saved price group."
            : incoming.Fees.FirstOrDefault(f => fees.All(x => x.Kind != f.Kind)) is Fee fee
                ? $"There is no fee called {fee.Kind}."
            : null;
    }

    private static IEnumerable<T> Removed<T>(List<T> current, List<T> incoming, Func<T, int> id) =>
        current.Where(c => incoming.All(i => id(i) != id(c)));

    private void Sync<T>(List<T> current, List<T> incoming, Func<T, int> id) where T : class
    {
        foreach (T removed in Removed(current, incoming, id).ToList())
            db.Remove(removed);
        foreach (T item in incoming)
        {
            T? match = current.FirstOrDefault(c => id(c) == id(item) && id(item) != 0);
            if (match is not null)
                db.Entry(match).CurrentValues.SetValues(item);
            else
                db.Add(item);
        }
    }

    /// <summary>One rate per thickness: update it in place, so the unique (group, thickness) index never clashes.</summary>
    private static void SyncRates(PriceGroup group, List<PriceGroupRate> rates)
    {
        group.Rates.RemoveAll(r => rates.All(n => n.Thickness != r.Thickness));
        foreach (PriceGroupRate rate in rates)
        {
            PriceGroupRate? match = group.Rates.FirstOrDefault(r => r.Thickness == rate.Thickness);
            if (match is not null)
                match.PricePerSqFt = rate.PricePerSqFt;
            else
                group.Rates.Add(new PriceGroupRate { Thickness = rate.Thickness, PricePerSqFt = rate.PricePerSqFt });
        }
    }
}
