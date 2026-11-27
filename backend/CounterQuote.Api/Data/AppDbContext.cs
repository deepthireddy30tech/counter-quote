using CounterQuote.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CounterQuote.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Counter> Counters => Set<Counter>();
    public DbSet<Leg> Legs => Set<Leg>();
    public DbSet<Cutout> Cutouts => Set<Cutout>();
    public DbSet<AdditionalRequirement> AdditionalRequirements => Set<AdditionalRequirement>();
    public DbSet<QuoteLineItem> QuoteLineItems => Set<QuoteLineItem>();
    public DbSet<PriceGroup> PriceGroups => Set<PriceGroup>();
    public DbSet<PriceGroupRate> PriceGroupRates => Set<PriceGroupRate>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<EdgeProfile> EdgeProfiles => Set<EdgeProfile>();
    public DbSet<Fee> Fees => Set<Fee>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // SQLite doesn't store the time zone, so mark dates as UTC when reading.
        var utc = new ValueConverter<DateTime, DateTime>(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
        var job = modelBuilder.Entity<Job>();
        job.Property(j => j.CreatedDate).HasConversion(utc);
        job.Property(j => j.SavedAt).HasConversion(utc);
        job.Property(j => j.ValidUntil).HasConversion(utc);

        // a material, edge profile or price group still in use can't be deleted
        modelBuilder.Entity<Counter>().HasOne<Material>().WithMany().HasForeignKey(c => c.MaterialId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Counter>().HasOne<EdgeProfile>().WithMany().HasForeignKey(c => c.EdgeProfileId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Material>().HasOne<PriceGroup>().WithMany().HasForeignKey(m => m.PriceGroupId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Fee>().HasIndex(f => f.Kind).IsUnique();
        modelBuilder.Entity<PriceGroupRate>().HasIndex(r => new { r.PriceGroupId, r.Thickness }).IsUnique();
    }
}
