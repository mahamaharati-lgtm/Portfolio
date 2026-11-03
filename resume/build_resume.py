"""Builds the ATS-friendly résumé (HTML for PDF printing, and DOCX) from resume.json.

Usage: python3 build_resume.py && node print_pdf.mjs
"""
import html
import json
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Inches

HERE = Path(__file__).parent
OUT = HERE / "dist"
OUT.mkdir(exist_ok=True)
data = json.loads((HERE / "resume.json").read_text(encoding="utf-8"))
FILE_STEM = "Harshith-C-Shenoy-Resume"


def contact_items(c):
    items = [c["location"], c["phone"], c["email"], c["github"]]
    if c.get("linkedin"):
        items.append(c["linkedin"])
    return items


# ---------------------------------------------------------------- HTML (PDF)
def e(s):
    return html.escape(s, quote=True)


def link(text):
    if "@" in text:
        return f'<a href="mailto:{e(text)}">{e(text)}</a>'
    if "." in text and "/" in text:
        return f'<a href="https://{e(text)}">{e(text)}</a>'
    return e(text)


parts = [
    f"<header><h1>{e(data['name'])}</h1><p class='headline'>{e(data['headline'])}</p>",
    "<p class='contact'>" + " | ".join(link(i) for i in contact_items(data["contact"])) + "</p></header>",
    "<section><h2>Professional Summary</h2>",
    f"<p>{e(data['summary'])}</p></section>",
    "<section><h2>Technical Skills</h2>",
]
for label, value in data["skills"]:
    parts.append(f"<p class='skill'><strong>{e(label)}:</strong> {e(value)}</p>")
parts.append("</section><section><h2>Professional Experience</h2>")
for job in data["experience"]:
    parts.append(
        f"<div class='entry'><p class='row'><span><strong>{e(job['title'])}</strong>, {e(job['company'])}</span>"
        f"<span>{e(job['dates'])}</span></p>"
    )
    if job["bullets"]:
        parts.append("<ul>" + "".join(f"<li>{e(b)}</li>" for b in job["bullets"]) + "</ul>")
    parts.append("</div>")
parts.append("</section><section><h2>Projects</h2>")
for p in data["projects"]:
    links = " | ".join(f"{e(k)}: {link(v)}" for k, v in p["links"])
    parts.append(
        f"<div class='entry'><p class='row'><strong>{e(p['name'])}</strong></p>"
        f"<p class='meta'><em>Technologies:</em> {e(p['tech'])}</p><p class='meta'>{links}</p>"
        "<ul>" + "".join(f"<li>{e(b)}</li>" for b in p["bullets"]) + "</ul></div>"
    )
parts.append("</section><section><h2>Education</h2>")
for ed in data["education"]:
    parts.append(
        f"<div class='entry'><p class='row'><span><strong>{e(ed['degree'])}</strong></span><span>{e(ed['dates'])}</span></p>"
        f"<p class='meta'>{e(ed['institution'])} | Aggregate: {e(ed['score'])}</p></div>"
    )
parts.append("</section>")

CSS = """
@page { size: A4; margin: 14mm 15mm; }
* { box-sizing: border-box; }
body { font-family: 'Carlito', 'Calibri', Arial, sans-serif; font-size: 10.5pt; line-height: 1.32; color: #111; margin: 0; }
h1 { font-size: 20pt; margin: 0; letter-spacing: 0.04em; }
.headline { margin: 2pt 0 0; font-size: 11pt; }
.contact { margin: 3pt 0 0; font-size: 10pt; }
a { color: #111; text-decoration: none; }
h2 { font-size: 11.5pt; text-transform: uppercase; letter-spacing: 0.05em; margin: 11pt 0 4pt; padding-bottom: 2pt; border-bottom: 1px solid #333; }
p { margin: 0 0 3pt; }
.row { display: flex; justify-content: space-between; gap: 12pt; margin: 0; }
.entry { margin-bottom: 6pt; break-inside: avoid; }
.meta { margin: 1pt 0; }
ul { margin: 2pt 0 0; padding-left: 14pt; }
li { margin-bottom: 2pt; }
"""
(OUT / f"{FILE_STEM}.html").write_text(
    f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Harshith C Shenoy — Resume</title>"
    f"<style>{CSS}</style></head><body>{''.join(parts)}</body></html>",
    encoding="utf-8",
)

# ---------------------------------------------------------------- DOCX
doc = Document()
for section in doc.sections:
    section.top_margin = section.bottom_margin = Inches(0.6)
    section.left_margin = section.right_margin = Inches(0.65)

normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(2)
normal.paragraph_format.line_spacing = 1.1
for level in (1, 2):
    st = doc.styles[f"Heading {level}"]
    st.font.name = "Calibri"
    st.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    st.font.bold = True
doc.styles["Heading 1"].font.size = Pt(20)
doc.styles["Heading 2"].font.size = Pt(11.5)


def bottom_border(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, v in {"w:val": "single", "w:sz": "6", "w:space": "1", "w:color": "333333"}.items():
        bottom.set(qn(k), v)
    bdr.append(bottom)
    pPr.append(bdr)


def heading(text):
    h = doc.add_heading(text.upper(), level=2)
    h.paragraph_format.space_before = Pt(10)
    h.paragraph_format.space_after = Pt(3)
    bottom_border(h)


def tab_row(left_bold, left_rest, right):
    p = doc.add_paragraph()
    usable = doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[0].right_margin
    p.paragraph_format.tab_stops.add_tab_stop(usable, alignment=2)  # right-aligned tab
    p.add_run(left_bold).bold = True
    if left_rest:
        p.add_run(left_rest)
    if right:
        p.add_run("\t" + right)
    p.paragraph_format.space_after = Pt(1)
    return p


h1 = doc.add_heading(data["name"], level=1)
h1.paragraph_format.space_after = Pt(0)
doc.add_paragraph(data["headline"])
doc.add_paragraph(" | ".join(contact_items(data["contact"])))

heading("Professional Summary")
doc.add_paragraph(data["summary"])

heading("Technical Skills")
for label, value in data["skills"]:
    p = doc.add_paragraph()
    p.add_run(f"{label}: ").bold = True
    p.add_run(value)

heading("Professional Experience")
for job in data["experience"]:
    tab_row(job["title"], f", {job['company']}", job["dates"])
    for b in job["bullets"]:
        doc.add_paragraph(b, style="List Bullet")

heading("Projects")
for proj in data["projects"]:
    tab_row(proj["name"], "", "")
    p = doc.add_paragraph()
    p.add_run("Technologies: ").italic = True
    p.add_run(proj["tech"])
    doc.add_paragraph(" | ".join(f"{k}: {v}" for k, v in proj["links"]))
    for b in proj["bullets"]:
        doc.add_paragraph(b, style="List Bullet")

heading("Education")
for ed in data["education"]:
    tab_row(ed["degree"], "", ed["dates"])
    doc.add_paragraph(f"{ed['institution']} | Aggregate: {ed['score']}")

doc.core_properties.author = "Harshith C Shenoy"
doc.core_properties.title = "Harshith C Shenoy — Resume"
doc.save(OUT / f"{FILE_STEM}.docx")
print("wrote", OUT / f"{FILE_STEM}.html", "and", OUT / f"{FILE_STEM}.docx")
