using CounterQuote.Api.Controllers;
using CounterQuote.Api.Data;
using CounterQuote.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CounterQuote.Api.Tests;

public class JobsControllerTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly int _steelGrey;
    private readonly int _ogee;

    public JobsControllerTests()
    {
        _connection.Open();
        using AppDbContext db = CreateDb();
        db.Database.Migrate();
        Seed.Run(db);
        db.Jobs.RemoveRange(db.Jobs); // start without the sample job
        db.SaveChanges();
        _steelGrey = db.Materials.Single(m => m.Name == "Steel Grey").Id;
        _ogee = db.EdgeProfiles.Single(e => e.Name == "Ogee").Id;
    }

    public void Dispose() => _connection.Dispose();

    private AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);

    private Job KitchenL(string customer = "Rivera") => new()
    {
        CustomerName = customer,
        TearOut = true,
        Counters =
        [
            new()
            {
                Room = "Kitchen", MaterialId = _steelGrey, Thickness = 3, EdgeProfileId = _ogee, Backsplash = true, Rotation = 90, Mirrored = true,
                Legs =
                [
                    new() { Length = 120, Depth = 25.5, BackCovered = true, Cutouts = [new() { Kind = "undermount", Centerline = 60, FaucetHoles = 3 }] },
                    new() { Length = 96, Depth = 25.5, TurnAngle = 90, BackCovered = true, EndFrontRadius = true },
                ],
            },
            new() { Room = "Island", MaterialId = _steelGrey, Thickness = 3, EdgeProfileId = _ogee, Legs = [new() { Length = 72, Depth = 36 }] },
        ],
        AdditionalRequirements = [new() { Description = "Haul away", Price = 45 }],
        Total = 3303.60m,
        LineItems =
        [
            new() { Counter = "Kitchen L", Description = "Steel Grey, 3 cm", Quantity = 34, Unit = "sq ft", Rate = 58, Amount = 1972 },
            new() { Counter = "Job", Description = "Templating visit", Quantity = 1, Unit = "job", Rate = 150, Amount = 150 },
        ],
    };

    private async Task<int> Create(Job job)
    {
        using AppDbContext db = CreateDb();
        var result = await new JobsController(db).Create(job);
        return ((Job)((CreatedAtActionResult)result.Result!).Value!).Id;
    }

    private async Task<Job> Read(int id)
    {
        using AppDbContext db = CreateDb();
        return (await new JobsController(db).Get(id)).Value!;
    }

    [Fact]
    public async Task A_job_reads_back_with_its_counters_legs_cutouts_and_saved_quote_in_order()
    {
        Job job = await Read(await Create(KitchenL()));

        Assert.True(job.TearOut);
        Assert.Equal(["Kitchen", "Island"], job.Counters.Select(c => c.Room));
        Counter kitchen = job.Counters[0];
        Assert.Equal((90, true), (kitchen.Rotation, kitchen.Mirrored));
        Assert.Equal([120.0, 96.0], kitchen.Legs.Select(l => l.Length));
        Assert.True(kitchen.Legs[1].EndFrontRadius);
        Cutout sink = Assert.Single(kitchen.Legs[0].Cutouts);
        Assert.Equal(("undermount", 60.0, 3), (sink.Kind, sink.Centerline, sink.FaucetHoles));
        Assert.Empty(kitchen.Legs[1].Cutouts);
        Assert.Equal("Haul away", Assert.Single(job.AdditionalRequirements).Description);
        Assert.Equal(["Kitchen L", "Job"], job.LineItems.Select(i => i.Counter));
        Assert.Equal(3303.60m, job.Total);
    }

    [Fact]
    public async Task Updating_replaces_every_child_row_and_keeps_the_created_date()
    {
        int id = await Create(KitchenL());
        DateTime created = (await Read(id)).CreatedDate;

        Job changes = KitchenL("Rivera Jr");
        changes.Counters.RemoveAt(1);
        changes.Counters[0].Legs.RemoveAt(1);
        changes.Counters[0].Legs[0].Cutouts[0].Kind = "farmhouse";
        changes.AdditionalRequirements.Clear();
        changes.LineItems.RemoveAt(0);
        using (AppDbContext db = CreateDb())
            await new JobsController(db).Update(id, changes);

        Job job = await Read(id);
        Assert.Equal("Rivera Jr", job.CustomerName);
        Assert.Equal(created, job.CreatedDate);
        Assert.Equal("farmhouse", Assert.Single(Assert.Single(Assert.Single(job.Counters).Legs).Cutouts).Kind);
        Assert.Empty(job.AdditionalRequirements);
        Assert.Single(job.LineItems);
        using AppDbContext check = CreateDb();
        Assert.Equal((1, 1, 1), (check.Counters.Count(), check.Legs.Count(), check.Cutouts.Count()));
    }

    [Fact]
    public async Task The_job_list_is_newest_first_with_each_jobs_counters_and_legs()
    {
        int older = await Create(KitchenL("Rivera"));
        int newer = await Create(KitchenL("Okafor"));
        using var db = CreateDb();
        var jobs = await new JobsController(db).GetAll();
        Assert.Equal([newer, older], jobs.Select(j => j.Id));
        Assert.All(jobs, j => Assert.NotEmpty(j.Counters[0].Legs));
    }

    [Fact]
    public async Task Deleting_a_job_deletes_its_child_rows()
    {
        int id = await Create(KitchenL());
        await Create(KitchenL("Keep me"));

        using (AppDbContext db = CreateDb())
            Assert.IsType<NoContentResult>(await new JobsController(db).Delete(id));

        using AppDbContext check = CreateDb();
        Assert.Equal("Keep me", Assert.Single(check.Jobs).CustomerName);
        Assert.Equal((2, 3, 1, 1, 2), (check.Counters.Count(), check.Legs.Count(), check.Cutouts.Count(),
            check.AdditionalRequirements.Count(), check.QuoteLineItems.Count()));
    }

    [Fact]
    public async Task A_counter_whose_material_is_not_in_the_price_list_is_refused()
    {
        Job job = KitchenL();
        job.Counters[1].MaterialId = 9999;
        using AppDbContext db = CreateDb();

        var result = await new JobsController(db).Create(job);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(db.Jobs);
    }

    private const string Drawing = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><defs><pattern id="wall" width="6" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="#9AA5B1"/></pattern></defs><polygon points="48,48 592,48 592,140 48,140" fill="#E9E4DA"/><line x1="48" y1="48" x2="592" y2="48" stroke="url(#wall)" stroke-width="10"/><text x="320" y="30" font-size="13">10' 0"</text></svg>""";

    [Fact]
    public async Task A_saved_quote_downloads_as_a_pdf_with_its_drawing()
    {
        Job job = KitchenL();
        job.QuoteDrawingSvg = Drawing;
        int id = await Create(job);
        using AppDbContext db = CreateDb();

        var pdf = Assert.IsType<FileContentResult>(await new JobsController(db).Pdf(id));

        Assert.Equal("application/pdf", pdf.ContentType);
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(pdf.FileContents, 0, 4));
    }

    [Fact]
    public void A_drawing_whose_text_mentions_href_is_still_safe() =>
        Assert.True(CounterQuote.Api.Pdf.QuotePdf.IsSafeDrawing("""<svg><text>Edge: Shrefton bevel</text></svg>"""));

    [Fact]
    public async Task A_job_saved_without_a_price_has_no_pdf()
    {
        Job job = KitchenL();
        job.Total = null;
        job.LineItems.Clear();
        int id = await Create(job);
        using AppDbContext db = CreateDb();

        Assert.IsType<ConflictObjectResult>(await new JobsController(db).Pdf(id));
        Assert.IsType<NotFoundResult>(await new JobsController(db).Pdf(id + 1));
    }

    [Theory]
    [InlineData("""<svg><image href="file:///etc/passwd"/></svg>""")]
    [InlineData("""<svg><use xlink:href="#a"/></svg>""")]
    [InlineData("""<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>""")]
    [InlineData("""<svg><rect fill="url(http://example.com/a)"/></svg>""")]
    [InlineData("""<svg><style>@import url(x)</style></svg>""")]
    [InlineData("""<html><svg/></html>""")]
    [InlineData("""<svg><a xlink:href="javascript:x"><text>x</text></a></svg>""")]
    public async Task A_drawing_that_could_reach_outside_itself_is_refused(string svg)
    {
        Job job = KitchenL();
        job.QuoteDrawingSvg = svg;
        using AppDbContext db = CreateDb();

        var result = await new JobsController(db).Create(job);

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(db.Jobs);
    }

    /// <summary>A database as it was before the price list existed: migrated, nothing seeded.</summary>
    private static AppDbContext NewDatabase(SqliteConnection connection)
    {
        connection.Open();
        var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        db.Database.Migrate();
        return db;
    }

    [Fact]
    public void A_new_database_gets_one_sample_job_and_the_seed_never_adds_it_again()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        using AppDbContext db = NewDatabase(connection);
        Seed.Run(db);
        Seed.Run(db);
        Job sample = db.Jobs.Include(j => j.Counters).ThenInclude(c => c.Legs).Single();
        Assert.Equal([2, 1], sample.Counters.OrderBy(c => c.Position).Select(c => c.Legs.Count));

        db.Jobs.Remove(sample);
        db.Materials.RemoveRange(db.Materials.Where(m => m.Name == "Steel Grey")); // the shop may delete the sample's material
        db.SaveChanges();
        Seed.Run(db);

        Assert.Empty(db.Jobs);
    }

    [Fact]
    public void The_sample_job_replaces_the_old_starter_jobs()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        using AppDbContext db = NewDatabase(connection);
        db.Jobs.AddRange(
            new Job { CustomerName = "Sample: Kitchen", CreatedDate = DateTime.UtcNow },
            new Job { CustomerName = "Sample: Bathroom", CreatedDate = DateTime.UtcNow });
        db.SaveChanges();

        Seed.Run(db);

        Assert.Equal("Sample: kitchen L and island", Assert.Single(db.Jobs).CustomerName);
    }

    [Fact]
    public async Task The_seed_leaves_a_shops_own_jobs_alone()
    {
        await Create(KitchenL("Sample: Kitchen")); // same name as a starter job, but it has counters
        using AppDbContext db = CreateDb();

        Seed.Run(db);

        Assert.Equal("Sample: Kitchen", Assert.Single(db.Jobs).CustomerName);
    }
}
