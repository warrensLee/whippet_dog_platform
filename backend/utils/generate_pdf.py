from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle
)

from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor


def generate_title_pdf(dog, title):
    from classes.dog_title import DogTitle
    from classes.title_type import TitleType
    
    template_pdf = PdfReader("certificate_template.pdf")
    template_page = template_pdf.pages[0]

    width = float(template_page.mediabox.width)
    height = float(template_page.mediabox.height)

    packet = BytesIO()
    overlay_buffer = BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=(width, height))
    
    #db_titles = DogTitle.list_for_dog(dog.cwa_number)
    #other_titles = [t.title for t in db_titles if t.title != title]
    #title_str = " ".join(other_titles) if other_titles else ""
    
    title_info = TitleType.find_by_identifier(title)
    title_display = f"{title_info.title_description} ({title})" if title_info and title_info.title_description else title
    
    display_name = f"{dog.registered_name}".strip()
    
    text_width = c.stringWidth(display_name, "Helvetica-Bold", 20)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(HexColor("#2c455e"))
    x = (width - text_width) / 2
    y = height / 2
    c.drawString(x, y+40, display_name)
    c.setLineWidth(1)
    c.line(
        x,
        y + 38,
        x + text_width,
       y + 38 
    )
    
    title_text_width = c.stringWidth(title_display, "Helvetica", 16)
    c.setFont("Helvetica", 16)
    c.setFillColor(HexColor("#2c455e"))
    c.drawString((width - title_text_width) / 2, y - 40, title_display)
    c.showPage()
    c.save()    
    overlay_buffer.seek(0)

    overlay_pdf = PdfReader(overlay_buffer)
    overlay_page = overlay_pdf.pages[0]

    template_page.merge_page(overlay_page)

    output_buffer = BytesIO()

    writer = PdfWriter()
    writer.add_page(template_page)

    writer.write(output_buffer)
    output_buffer.seek(0)
    return output_buffer.read()