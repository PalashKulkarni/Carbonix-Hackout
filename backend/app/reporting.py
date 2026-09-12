from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


FOREST = colors.HexColor("#1B3A2D")
FOREST_DARK = colors.HexColor("#12281F")
SAGE = colors.HexColor("#7A9B8A")
CANVAS = colors.HexColor("#F7F5F0")
CARD = colors.HexColor("#FFFFFF")
INK = colors.HexColor("#2C2C2C")
MUTED = colors.HexColor("#666666")
BORDER = colors.HexColor("#E1DFDA")
GOLD = colors.HexColor("#B8892E")
GREEN = colors.HexColor("#2D6A4F")
RED = colors.HexColor("#C45B4A")


def _paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def _report_chrome(canvas, document) -> None:
    """Draw the repeated Carbonix header/footer outside the document flow."""
    width, height = letter
    canvas.saveState()
    canvas.setFillColor(CARD)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(FOREST)
    canvas.rect(0, height - 0.56 * inch, width, 0.56 * inch, fill=1, stroke=0)
    canvas.setFillColor(SAGE)
    canvas.circle(0.54 * inch, height - 0.28 * inch, 0.13 * inch, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(0.78 * inch, height - 0.33 * inch, "CARBONIX")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#D5E3DA"))
    canvas.drawString(0.80 * inch, height - 0.45 * inch, "CARBON-AWARE SUPPLY CHAIN INTELLIGENCE")
    canvas.setStrokeColor(BORDER)
    canvas.line(0.55 * inch, 0.52 * inch, width - 0.55 * inch, 0.52 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(0.55 * inch, 0.34 * inch, "Generated from the Carbonix calculation engine")
    canvas.drawRightString(width - 0.55 * inch, 0.34 * inch, f"Page {document.page}")
    canvas.restoreState()


def _metric_card(label: str, value: str, accent: colors.Color = FOREST) -> Table:
    accent_hex = accent.hexval()
    card = Table(
        [[_paragraph(
            f'<font color="#666666" size="7.5"><b>{label.upper()}</b></font><br/><br/>'
            f'<font color="{accent_hex}" size="16"><b>{value}</b></font>',
            ParagraphStyle("metric-value", fontName="Helvetica", fontSize=9, leading=12),
        )]],
        colWidths=[1.22 * inch],
        rowHeights=[0.92 * inch],
    )
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CANVAS),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return card


def build_esg_pdf(dashboard: dict) -> bytes:
    """Create a board-ready ESG audit report from the live dashboard payload."""
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.86 * inch,
        bottomMargin=0.72 * inch,
        title=f"Carbonix ESG Report {dashboard['period']}",
        author="Carbonix",
    )

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "report-title", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=24,
        leading=28, textColor=FOREST, spaceAfter=4,
    )
    eyebrow = ParagraphStyle(
        "eyebrow", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=SAGE,
        tracking=0.8, spaceAfter=7,
    )
    section = ParagraphStyle(
        "section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13,
        leading=16, textColor=FOREST, spaceBefore=14, spaceAfter=7,
    )
    body = ParagraphStyle(
        "body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.3, leading=14,
        textColor=INK,
    )
    small = ParagraphStyle(
        "small", parent=body, fontSize=8.3, leading=11, textColor=MUTED,
    )
    table_header = ParagraphStyle(
        "table-header", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white,
    )
    table_cell = ParagraphStyle(
        "table-cell", fontName="Helvetica", fontSize=8.5, leading=11, textColor=INK,
    )
    table_cell_bold = ParagraphStyle(
        "table-cell-bold", parent=table_cell, fontName="Helvetica-Bold",
    )

    total_kg = float(dashboard["total_co2e_kg"])
    total_tonnes = total_kg / 1000
    story = [
        Spacer(1, 0.06 * inch),
        _paragraph("ESG EXECUTIVE AUDIT REPORT", eyebrow),
        _paragraph("Scope 3 supplier emissions inventory", title),
        _paragraph(
            f"{dashboard['org_name']}  |  Reporting period: CY {dashboard['period']}  |  Inventory status: calculated",
            small,
        ),
        Spacer(1, 0.13 * inch),
        HRFlowable(width="100%", thickness=1.3, color=FOREST),
        _paragraph("1. Executive inventory summary", section),
        _paragraph(
            f"{dashboard['org_name']} has calculated Scope 3 emissions across "
            f"<b>{dashboard['supplier_count']} supplier nodes</b> for calendar year {dashboard['period']}. "
            f"The current inventory is <b>{total_kg:,.0f} kg CO2e ({total_tonnes:,.2f} tCO2e)</b>. "
            "All totals are produced by the documented activity-times-factor carbon engine.",
            body,
        ),
        Spacer(1, 0.14 * inch),
    ]

    metric_cards = Table([[
        _metric_card("Total CO2e", f"{total_tonnes:,.1f} tCO2e"),
        _metric_card("Tier 1 share", f"{float(dashboard['tier1_share_pct']):.1f}%", GOLD),
        _metric_card("Supplier nodes", str(dashboard["supplier_count"])),
        _metric_card("Data coverage", f"{float(dashboard['data_coverage_pct']):.1f}%", GREEN),
    ]], colWidths=[1.28 * inch] * 4)
    metric_cards.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story += [metric_cards, _paragraph("2. Categorical audit breakdown", section)]

    category_rows = [[
        _paragraph("EMISSION CATEGORY", table_header),
        _paragraph("KG CO2E", table_header),
        _paragraph("TCO2E", table_header),
        _paragraph("SHARE", table_header),
    ]]
    for category in dashboard["by_category"]:
        kg = float(category["co2e_kg"])
        category_rows.append([
            _paragraph(category["emission_category"].replace("_", " ").title(), table_cell_bold),
            _paragraph(f"{kg:,.0f}", table_cell),
            _paragraph(f"{kg / 1000:,.2f}", table_cell),
            _paragraph(f"{(kg / total_kg * 100) if total_kg else 0:.1f}%", table_cell),
        ])
    category_table = Table(category_rows, colWidths=[2.6 * inch, 1.05 * inch, 1.05 * inch, 0.7 * inch], repeatRows=1)
    category_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("BACKGROUND", (0, 1), (-1, -1), CARD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CARD, CANVAS]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [category_table, _paragraph("3. Priority supplier hotspots", section)]

    hotspot_rows = [[
        _paragraph("RANK", table_header),
        _paragraph("SUPPLIER", table_header),
        _paragraph("FOOTPRINT", table_header),
        _paragraph("RISK", table_header),
    ]]
    for hotspot in dashboard["hotspots"]:
        risk = str(hotspot["carbon_risk"]).upper()
        risk_color = RED if risk == "HIGH" else GOLD if risk == "MEDIUM" else GREEN
        risk_style = ParagraphStyle("risk-" + risk, parent=table_cell_bold, textColor=risk_color)
        hotspot_rows.append([
            _paragraph(f"#{hotspot['rank']}", table_cell_bold),
            _paragraph(str(hotspot["name"]), table_cell_bold),
            _paragraph(f"{float(hotspot['total_co2e_kg']) / 1000:,.2f} tCO2e", table_cell),
            _paragraph(risk, risk_style),
        ])
    hotspot_table = Table(hotspot_rows, colWidths=[0.55 * inch, 2.75 * inch, 1.35 * inch, 0.75 * inch], repeatRows=1)
    hotspot_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CARD, CANVAS]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [hotspot_table]

    recommendations = dashboard.get("top_recommendations", [])
    if recommendations:
        story.append(_paragraph("4. Top actionable reductions", section))
        recommendation_rows = []
        for recommendation in recommendations[:3]:
            reduction = float(recommendation["delta_co2e_kg"]) / 1000
            recommendation_rows.append([
                _paragraph(f"<b>{recommendation['title']}</b><br/><font color='#2D6A4F'>Potential reduction: -{reduction:,.1f} tCO2e</font>", body),
            ])
        recommendation_table = Table(recommendation_rows, colWidths=[5.4 * inch])
        recommendation_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF7F2")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#B8E2CA")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B8E2CA")),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(recommendation_table)

    method = Table([[_paragraph(
        "<b>Calculation note.</b> Official inventory totals use the Carbonix deterministic activity-times-factor engine. "
        "Model-assisted activity values, where present, are labeled in the source inventory; recommendations are ranked separately from the official calculation.",
        small,
    )]], colWidths=[5.4 * inch])
    method.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CANVAS),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story += [Spacer(1, 0.18 * inch), method]

    document.build(story, onFirstPage=_report_chrome, onLaterPages=_report_chrome)
    return buffer.getvalue()
