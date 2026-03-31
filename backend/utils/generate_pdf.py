from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# ── Brand palette ──────────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#1B2A4A")
GOLD    = colors.HexColor("#C9A84C")
CREAM   = colors.HexColor("#FAF7F2")
SILVER  = colors.HexColor("#8A9BB0")
LIGHT   = colors.HexColor("#EEF1F6")


def _styles():
    return {
        "report_title": ParagraphStyle(
            "report_title",
            fontName="Times-Bold",
            fontSize=26,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=4,
            leading=30,
        ),
        "report_subtitle": ParagraphStyle(
            "report_subtitle",
            fontName="Times-Italic",
            fontSize=11,
            textColor=SILVER,
            alignment=TA_CENTER,
            spaceAfter=0,
        ),
        "label": ParagraphStyle(
            "label",
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=SILVER,
            spaceAfter=2,
            leading=10,
        ),
        "value": ParagraphStyle(
            "value",
            fontName="Times-Roman",
            fontSize=13,
            textColor=NAVY,
            spaceAfter=0,
            leading=16,
        ),
        "section_heading": ParagraphStyle(
            "section_heading",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=GOLD,
            spaceBefore=4,
            spaceAfter=8,
            leading=11,
            letterSpacing=1.5,       # pseudo tracking via wordSpace workaround
        ),
        "title_item": ParagraphStyle(
            "title_item",
            fontName="Times-Roman",
            fontSize=12,
            textColor=NAVY,
            leftIndent=12,
            spaceAfter=5,
            leading=16,
        ),
        "no_titles": ParagraphStyle(
            "no_titles",
            fontName="Times-Italic",
            fontSize=11,
            textColor=SILVER,
            leftIndent=12,
            spaceAfter=0,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Helvetica",
            fontSize=8,
            textColor=SILVER,
            alignment=TA_CENTER,
        ),
    }


def _gold_rule(width=6.5 * inch, thickness=1.5):
    return HRFlowable(width=width, thickness=thickness, color=GOLD, spaceAfter=0, spaceBefore=0)


def _thin_rule(width=6.5 * inch):
    return HRFlowable(width=width, thickness=0.5, color=LIGHT, spaceAfter=0, spaceBefore=0)


def generate_titles_pdf(dog):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=0.85 * inch,
        bottomMargin=0.85 * inch,
        title="Dog Title Report",
    )
    s = _styles()
    titles = dog.compute_titles()
    story = []

    # ── Header block ────────────────────────────────────────────────────────────
    story.append(_gold_rule())
    story.append(Spacer(1, 10))
    story.append(Paragraph("Dog Title Report", s["report_title"]))
    story.append(Paragraph("Official Record of Earned Titles &amp; Achievements", s["report_subtitle"]))
    story.append(Spacer(1, 10))
    story.append(_gold_rule())

    story.append(Spacer(1, 22))

    # ── Dog info card ───────────────────────────────────────────────────────────
    info_data = [
        [
            [Paragraph("REGISTERED NAME", s["label"]),
             Paragraph(dog.registered_name, s["value"])],
            [Paragraph("CWA NUMBER", s["label"]),
             Paragraph(str(dog.cwa_number), s["value"])],
        ]
    ]
    info_table = Table(info_data, colWidths=[3.9 * inch, 2.6 * inch])
    info_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), CREAM),
        ("ROWPADDING",   (0, 0), (-1, -1), 14),
        ("LINEABOVE",    (0, 0), (-1, 0),  1.5, GOLD),
        ("LINEBELOW",    (0, -1), (-1, -1), 0.5, LIGHT),
        ("LINEBEFORE",   (1, 0), (1, -1),  0.5, LIGHT),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(info_table)

    story.append(Spacer(1, 28))

    # ── Titles section ──────────────────────────────────────────────────────────
    story.append(Paragraph("● EARNED TITLES", s["section_heading"]))
    story.append(_thin_rule())
    story.append(Spacer(1, 10))

    if titles:
        title_rows = []
        for i, title in enumerate(titles):
            bg = CREAM if i % 2 == 0 else colors.white
            title_rows.append(
                [Paragraph(f"  {title}", s["title_item"])]
            )

        titles_table = Table(title_rows, colWidths=[6.5 * inch])
        row_styles = [
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
            ("LINEBELOW",   (0, 0), (-1, -2), 0.5, LIGHT),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING",  (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]
        for i in range(len(title_rows)):
            bg = CREAM if i % 2 == 0 else colors.white
            row_styles.append(("BACKGROUND", (0, i), (-1, i), bg))

        titles_table.setStyle(TableStyle(row_styles))
        story.append(KeepTogether([titles_table]))
    else:
        story.append(Paragraph("No titles earned.", s["no_titles"]))

    # ── Footer ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 36))
    story.append(_gold_rule(thickness=0.75))
    story.append(Spacer(1, 6))
    story.append(Paragraph("This document is an official record. · Generated automatically.", s["footer"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()