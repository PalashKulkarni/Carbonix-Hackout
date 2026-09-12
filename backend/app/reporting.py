from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def build_esg_pdf(dashboard: dict) -> bytes:
    buffer = BytesIO()
    document = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 54

    document.setTitle(f"Carbonix ESG Report {dashboard['period']}")
    document.setFont("Helvetica-Bold", 18)
    document.drawString(54, y, "CARBONIX ESG AUDIT REPORT")
    y -= 28
    document.setFont("Helvetica", 10)
    document.drawString(54, y, f"Organization: {dashboard['org_name']}")
    y -= 16
    document.drawString(54, y, f"Period: {dashboard['period']}")
    y -= 34

    document.setFont("Helvetica-Bold", 13)
    document.drawString(54, y, "Executive Summary")
    y -= 20
    document.setFont("Helvetica", 10)
    summary = [
        f"Total CO2e: {dashboard['total_co2e_kg']:,.2f} kg",
        f"Suppliers: {dashboard['supplier_count']}",
        f"Data coverage: {dashboard['data_coverage_pct']:.2f}%",
        f"Tier 1 share: {dashboard['tier1_share_pct']:.2f}%",
    ]
    for line in summary:
        document.drawString(66, y, line)
        y -= 16

    y -= 12
    document.setFont("Helvetica-Bold", 13)
    document.drawString(54, y, "Emissions by Category")
    y -= 20
    document.setFont("Helvetica", 10)
    for category in dashboard["by_category"]:
        label = category["emission_category"].replace("_", " ").title()
        document.drawString(66, y, f"{label}: {category['co2e_kg']:,.2f} kg CO2e")
        y -= 16

    y -= 12
    document.setFont("Helvetica-Bold", 13)
    document.drawString(54, y, "Top Hotspots")
    y -= 20
    document.setFont("Helvetica", 10)
    for hotspot in dashboard["hotspots"]:
        document.drawString(
            66,
            y,
            f"#{hotspot['rank']} {hotspot['name']}: {hotspot['total_co2e_kg']:,.2f} kg CO2e ({hotspot['carbon_risk']})",
        )
        y -= 16
        if y < 60:
            document.showPage()
            y = height - 54
            document.setFont("Helvetica", 10)

    document.setFont("Helvetica-Oblique", 8)
    document.drawString(54, 36, "Generated from the Carbonix calculation engine.")
    document.save()
    return buffer.getvalue()
