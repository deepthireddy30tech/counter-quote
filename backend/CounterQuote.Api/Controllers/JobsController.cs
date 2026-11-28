using CounterQuote.Api.Data;
using CounterQuote.Api.Models;
using CounterQuote.Api.Pdf;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CounterQuote.Api.Controllers;

[ApiController]
[Route("api/jobs")]
public class JobsController(AppDbContext db) : ControllerBase
{
    /// <summary>A job with its counters, legs, cutouts, additional requirements and saved quote, each in order.</summary>
    private IQueryable<Job> FullJobs => db.Jobs
        .Include(j => j.Counters.OrderBy(c => c.Position))
            .ThenInclude(c => c.Legs.OrderBy(l => l.Position))
            .ThenInclude(l => l.Cutouts.OrderBy(c => c.Id))
        .Include(j => j.AdditionalRequirements.OrderBy(r => r.Position))
        .Include(j => j.LineItems.OrderBy(i => i.Position))
        .AsSplitQuery();

    [HttpGet]
    public async Task<List<Job>> GetAll() => await FullJobs.AsNoTracking().OrderByDescending(j => j.Id).ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Job>> Get(int id)
    {
        Job? job = await FullJobs.AsNoTracking().SingleOrDefaultAsync(j => j.Id == id);
        return job is null ? NotFound() : job;
    }

    [HttpPost]
    public async Task<ActionResult<Job>> Create(Job job)
    {
        if (await Refusal(job) is ActionResult refused)
            return refused;
        job.Id = 0;
        job.CreatedDate = DateTime.UtcNow;
        ResetChildRows(job);
        db.Jobs.Add(job);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = job.Id }, job);
    }

    /// <summary>Replaces the whole job: its child rows are deleted and added again from the request.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Job>> Update(int id, Job changes)
    {
        Job? job = await FullJobs.SingleOrDefaultAsync(j => j.Id == id);
        if (job is null)
            return NotFound();
        if (await Refusal(changes) is ActionResult refused)
            return refused;

        changes.Id = id;
        changes.CreatedDate = job.CreatedDate;
        ResetChildRows(changes);
        db.Entry(job).CurrentValues.SetValues(changes);
        // SetValues skips lists, and clearing a list deletes its rows
        job.Counters.Clear();
        job.Counters.AddRange(changes.Counters);
        job.AdditionalRequirements.Clear();
        job.AdditionalRequirements.AddRange(changes.AdditionalRequirements);
        job.LineItems.Clear();
        job.LineItems.AddRange(changes.LineItems);
        await db.SaveChangesAsync();
        return job;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        Job? job = await db.Jobs.FindAsync(id);
        if (job is null)
            return NotFound();
        db.Jobs.Remove(job); // the database deletes its child rows
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>The saved quote as a PDF for the customer. A job saved without a price has none.</summary>
    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id)
    {
        Job? job = await FullJobs.AsNoTracking().SingleOrDefaultAsync(j => j.Id == id);
        if (job is null)
            return NotFound();
        if (job.Total is null)
            return Conflict("This job was saved without a price. Fix its Checks and save it to get a PDF.");
        return File(QuotePdf.Create(job), "application/pdf", $"quote-{job.Id}.pdf");
    }

    private async Task<ActionResult?> Refusal(Job job)
    {
        if (await MissingPrices(job) is string problem)
            return Refuse("counters", problem);
        if (job.QuoteDrawingSvg is string svg && !QuotePdf.IsSafeDrawing(svg))
            return Refuse("quoteDrawingSvg", "The plan drawing must be a plain SVG, with no links, scripts, images or styles.");
        return null;
    }

    private BadRequestObjectResult Refuse(string field, string problem)
    {
        ModelState.AddModelError(field, problem);
        return BadRequest(new ValidationProblemDetails(ModelState));
    }

    private async Task<string?> MissingPrices(Job job)
    {
        foreach (Counter c in job.Counters)
        {
            if (!await db.Materials.AnyAsync(m => m.Id == c.MaterialId))
                return "A counter's material is not in the price list.";
            if (!await db.EdgeProfiles.AnyAsync(e => e.Id == c.EdgeProfileId))
                return "A counter's edge profile is not in the price list.";
        }
        return null;
    }

    /// <summary>Child rows are always new: clear their ids and number them in request order.</summary>
    private static void ResetChildRows(Job job)
    {
        foreach (var (c, i) in job.Counters.Select((c, i) => (c, i)))
        {
            (c.Id, c.JobId, c.Position) = (0, 0, i);
            foreach (var (l, k) in c.Legs.Select((l, k) => (l, k)))
            {
                (l.Id, l.CounterId, l.Position) = (0, 0, k);
                foreach (Cutout cut in l.Cutouts)
                    (cut.Id, cut.LegId) = (0, 0);
            }
        }
        foreach (var (r, i) in job.AdditionalRequirements.Select((r, i) => (r, i)))
            (r.Id, r.JobId, r.Position) = (0, 0, i);
        foreach (var (x, i) in job.LineItems.Select((x, i) => (x, i)))
            (x.Id, x.JobId, x.Position) = (0, 0, i);
    }
}
