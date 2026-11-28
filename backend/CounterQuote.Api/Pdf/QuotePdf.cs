using System.Text.RegularExpressions;
using CounterQuote.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CounterQuote.Api.Pdf;

/// <summary>The customer's copy of a saved quote: shop header, plan drawing and line items by counter.</summary>
public static partial class QuotePdf
{
    // shortcut: a placeholder shop; move it into the price list as shop details when a real shop uses this
    private const string ShopName = "Your Stone Shop";
    private const string ShopContact = "123 Main Street, Anytown  ·  (555) 555-0100";

    // free for individuals and companies under $1M revenue; a bigger shop needs a paid QuestPDF licence
    static QuotePdf() => QuestPDF.Settings.License = LicenseType.Community;

    // the browser's plan drawing never needs links, scripts, images, styles or doctype; refusing them keeps the
    // server from fetching or reading anything while it renders a drawing someone else sent. Text is escaped by
    // React, so a name can't open a tag; only an odd edge name with "href=" or "url(" in it would be refused
    [GeneratedRegex(@"<!|<\?|[\s:]href\s*=|<\s*(script|image|use|style|foreignObject|a)\b|url\(\s*(?!#)|@import", RegexOptions.IgnoreCase)]
    private static partial Regex Unsafe();

    public static bool IsSafeDrawing(string svg) => svg.StartsWith("<svg") && !Unsafe().IsMatch(svg);

    /// <summary>Needs a saved quote: the job's line items and total.</summary>
    public static byte[] Create(Job job) => Document.Create(doc => doc.Page(page =>
    {
        page.Size(PageSizes.Letter);
        page.Margin(40);
        page.DefaultTextStyle(t => t.FontSize(10));

        page.Header().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(8).Row(row =>
        {
            row.RelativeItem().Column(c =>
            {
                c.Item().Text(ShopName).FontSize(16).Bold();
                c.Item().Text(ShopContact).FontColor(Colors.Grey.Darken1);
            });
            row.ConstantItem(200).Column(c =>
            {
                c.Item().AlignRight().Text($"Quote #{job.Id}").FontSize(16).Bold();
                c.Item().AlignRight().Text($"Date: {job.SavedAt:MMM d, yyyy}");
                c.Item().AlignRight().Text($"Valid until: {job.ValidUntil:MMM d, yyyy}");
            });
        });

        page.Content().PaddingVertical(16).Column(col =>
        {
            col.Spacing(14);
            col.Item().Text($"Prepared for {job.CustomerName}").FontSize(13).SemiBold();
            if (job.QuoteDrawingSvg is string svg)
                col.Item().MaxHeight(360).AlignCenter().Svg(SvgImage.FromText(svg)).FitArea();
            col.Item().Element(c => LineItems(c, job));
        });

        page.Footer().AlignCenter().Text(t =>
        {
            t.Span("Page ");
            t.CurrentPageNumber();
            t.Span(" of ");
            t.TotalPages();
        });
    })).GeneratePdf();

    private static void LineItems(IContainer container, Job job) => container.Table(table =>
    {
        table.ColumnsDefinition(c =>
        {
            c.RelativeColumn();
            c.ConstantColumn(80);
            c.ConstantColumn(70);
            c.ConstantColumn(80);
        });
        table.Header(h =>
        {
            foreach (string title in new[] { "Item", "Quantity", "Rate", "Amount" })
                h.Cell().BorderBottom(1).PaddingVertical(4).AlignRightUnless(title == "Item").Text(title).SemiBold();
        });
        // lines are stored in quote order; keep it within each counter
        foreach (var group in job.LineItems.GroupBy(i => i.Counter))
        {
            table.Cell().ColumnSpan(4).PaddingTop(8).PaddingBottom(2)
                .Text(group.Key == "Job" ? "Whole job" : group.Key).Bold().FontColor(Colors.Teal.Darken3);
            foreach (QuoteLineItem item in group)
            {
                table.Cell().PaddingVertical(2).Text(item.Description);
                table.Cell().PaddingVertical(2).AlignRight().Text($"{item.Quantity:0.##} {item.Unit}");
                table.Cell().PaddingVertical(2).AlignRight().Text($"${item.Rate:N2}");
                table.Cell().PaddingVertical(2).AlignRight().Text($"${item.Amount:N2}");
            }
        }
        table.Cell().ColumnSpan(3).BorderTop(1).PaddingTop(6).AlignRight().Text("Total").Bold().FontSize(12);
        table.Cell().BorderTop(1).PaddingTop(6).AlignRight().Text($"${job.Total:N2}").Bold().FontSize(12);
    });

    private static IContainer AlignRightUnless(this IContainer c, bool left) => left ? c : c.AlignRight();
}
