using CounterQuote.Api.Controllers;
using CounterQuote.Api.Data;
using CounterQuote.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CounterQuote.Api.Tests;

public class PriceListControllerTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public PriceListControllerTests()
    {
        _connection.Open();
        using AppDbContext db = CreateDb();
        db.Database.Migrate();
        Seed.Run(db); // includes a sample job that uses Steel Grey and Eased
    }

    public void Dispose() => _connection.Dispose();

    private AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);

    private async Task<PriceList> Load()
    {
        using AppDbContext db = CreateDb();
        return await new PriceListController(db).Get();
    }

    private async Task<ActionResult<PriceList>> Save(PriceList list)
    {
        using AppDbContext db = CreateDb();
        return await new PriceListController(db).Update(list);
    }

    [Fact]
    public async Task The_seed_gives_the_research_starting_price_list_once()
    {
        using (AppDbContext db = CreateDb())
            Seed.Run(db);

        PriceList list = await Load();
        Assert.Equal(20, list.PriceGroups.Count);
        PriceGroup granite2 = list.PriceGroups.Single(g => g.Name == "Granite 2");
        Assert.Equal([(2, 35m), (3, 45m)], granite2.Rates.Select(r => (r.Thickness, r.PricePerSqFt)));
        Assert.Equal(granite2.Id, list.Materials.Single(m => m.Name == "Steel Grey").PriceGroupId);
        Assert.Equal(7, list.Materials.Count);
        Assert.Equal(25m, list.EdgeProfiles.Single(e => e.Name == "Ogee").PricePerLinearFt);
        Assert.Equal(12, list.Fees.Count);
        Assert.Equal(30m, list.Fees.Single(f => f.Kind == "quoteValidDays").Amount);
    }

    [Fact]
    public async Task Saving_updates_adds_and_deletes_rows()
    {
        PriceList list = await Load();
        list.PriceGroups.Single(g => g.Name == "Granite 2").Rates.Single(r => r.Thickness == 3).PricePerSqFt = 47.5m;
        list.EdgeProfiles.Add(new EdgeProfile { Name = "Waterfall", PricePerLinearFt = 60 });
        list.Materials.RemoveAll(m => m.Name == "Uba Tuba");
        list.Fees.Single(f => f.Kind == "seam").Amount = 80;

        Assert.NotNull((await Save(list)).Value);

        PriceList saved = await Load();
        Assert.Equal(47.5m, saved.PriceGroups.Single(g => g.Name == "Granite 2").Rates.Single(r => r.Thickness == 3).PricePerSqFt);
        Assert.Contains(saved.EdgeProfiles, e => e.Name == "Waterfall" && e.PricePerLinearFt == 60);
        Assert.DoesNotContain(saved.Materials, m => m.Name == "Uba Tuba");
        Assert.Equal(80m, saved.Fees.Single(f => f.Kind == "seam").Amount);
    }

    [Theory]
    [InlineData("material")]
    [InlineData("edge profile")]
    public async Task Deleting_a_row_a_saved_job_uses_is_refused_and_changes_nothing(string what)
    {
        PriceList list = await Load();
        if (what == "material")
            list.Materials.RemoveAll(m => m.Name == "Steel Grey");
        else
            list.EdgeProfiles.RemoveAll(e => e.Name == "Eased");
        list.Fees.Single(f => f.Kind == "seam").Amount = 80;

        var result = await Save(list);

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.EndsWith("is used by a saved job, so it can't be deleted.", ((ProblemDetails)conflict.Value!).Title);
        PriceList saved = await Load();
        Assert.Equal(7, saved.Materials.Count);
        Assert.Equal(6, saved.EdgeProfiles.Count);
        Assert.Equal(0m, saved.Fees.Single(f => f.Kind == "seam").Amount);
    }

    [Fact]
    public async Task Deleting_a_price_group_that_still_has_materials_is_refused()
    {
        PriceList list = await Load();
        list.PriceGroups.RemoveAll(g => g.Name == "Quartz 1"); // Arctic White is in it

        var conflict = Assert.IsType<ConflictObjectResult>((await Save(list)).Result);
        Assert.Equal("Quartz 1 still has materials, so it can't be deleted.", ((ProblemDetails)conflict.Value!).Title);
    }
}
