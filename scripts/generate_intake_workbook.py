from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "files" / "homepage_content_intake_template.xlsx"


HEADER_FILL = PatternFill("solid", fgColor="0F766E")
SECTION_FILL = PatternFill("solid", fgColor="D9F2EF")
NOTE_FILL = PatternFill("solid", fgColor="FFF6E8")
HEADER_FONT = Font(color="FFFFFF", bold=True)
BOLD = Font(bold=True)
THIN = Side(style="thin", color="D1D5DB")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def style_header(ws, row_num):
    for cell in ws[row_num]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center", horizontal="center", wrap_text=True)
        cell.border = BOX


def style_section_row(ws, row_num):
    for cell in ws[row_num]:
        cell.fill = SECTION_FILL
        cell.font = BOLD
        cell.border = BOX


def style_table(ws, start_row, end_row, widths):
    for row in ws.iter_rows(min_row=start_row, max_row=end_row):
        for cell in row:
            cell.border = BOX
            cell.alignment = Alignment(vertical="top", wrap_text=True)
    for col, width in widths.items():
        ws.column_dimensions[col].width = width


def add_sheet_notes(ws, notes):
    ws["A1"] = "How To Fill This Sheet"
    ws["A1"].font = Font(bold=True, size=13)
    ws["A2"] = notes
    ws["A2"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["A2"].fill = NOTE_FILL
    ws["A2"].border = BOX
    ws.row_dimensions[2].height = 72
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 28
    ws.column_dimensions["C"].width = 28


def make_instructions(ws):
    ws.title = "Instructions"
    ws["A1"] = "Homepage Content Workbook"
    ws["A1"].font = Font(bold=True, size=16)
    rows = [
        ("What this is", "Paste your text and image file paths into the sheets below. I will use this workbook to update your homepage quickly."),
        ("Image paths", "Use local absolute paths if possible, such as /home/linpeiran/Pictures/xxx.jpg. If the image is online, paste the URL."),
        ("Publications", "Each paper should have a short summary and one representative figure or graphical abstract."),
        ("Team section", "Keep it concise: one image plus one-line intro per person or group."),
        ("Teaching", "No images needed. Just semester, course, role, and one-line note."),
        ("Visitor map", "Raw IP collection has privacy and compliance risks. I recommend using a privacy-aware provider or IP-to-country/city aggregation instead of storing raw IPs long-term."),
        ("Recommended order", "Fill Profile -> Homepage -> Publications -> Team -> Teaching -> VisitorMap -> Gallery/Assets."),
    ]
    for idx, (a, b) in enumerate(rows, start=3):
        ws[f"A{idx}"] = a
        ws[f"B{idx}"] = b
        ws[f"A{idx}"].font = BOLD
        ws[f"A{idx}"].fill = SECTION_FILL
        ws[f"A{idx}"].border = BOX
        ws[f"B{idx}"].border = BOX
        ws[f"B{idx}"].alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 110
    ws.freeze_panes = "A3"


def make_profile(ws):
    ws.title = "Profile"
    add_sheet_notes(ws, "Fill your core profile. This sheet controls sidebar info, contact links, and the first screen of the homepage.")
    headers = [
        "field_key", "label", "value", "required", "example"
    ]
    data = [
        ("name_en", "English name", "Peiran Lin", "yes", "Peiran Lin"),
        ("name_zh", "Chinese name", "", "optional", "蔺培然"),
        ("title_line", "Main title", "", "yes", "PhD Student in Life Sciences"),
        ("institution", "Institution", "Westlake University", "yes", "Westlake University"),
        ("location", "Location", "Hangzhou, China", "yes", "Hangzhou, China"),
        ("email", "Email", "", "yes", "linpeiran@westlake.edu.cn"),
        ("bio_short", "Short bio for sidebar", "", "yes", "PhD student working at the intersection of AI and biology"),
        ("hero_tagline", "Homepage hero sentence", "", "yes", "Building AI methods for cellular systems, spatial omics, and biological discovery."),
        ("hero_intro", "Homepage intro paragraph", "", "yes", "2-4 sentences"),
        ("avatar_path", "Profile image path", "", "yes", "/home/linpeiran/Pictures/profile.jpg"),
        ("cv_file_path", "CV PDF path", "", "optional", "/home/linpeiran/homepage/linpeiran_homepage.github.io/files/cv.pdf"),
        ("scholar_url", "Google Scholar URL", "", "optional", "https://scholar.google.com/..."),
        ("github_url", "GitHub URL", "", "optional", "https://github.com/LJZYlinpr"),
        ("researchgate_url", "ResearchGate URL", "", "optional", "https://www.researchgate.net/..."),
        ("orcid_url", "ORCID URL", "", "optional", "https://orcid.org/..."),
        ("linkedin_url", "LinkedIn URL", "", "optional", "https://www.linkedin.com/in/..."),
        ("lab_url_primary", "Primary lab URL", "", "optional", "https://..."),
        ("lab_url_secondary", "Secondary lab URL", "", "optional", "https://..."),
    ]
    start = 4
    for col, header in zip("ABCDE", headers):
        ws[f"{col}{start}"] = header
    style_header(ws, start)
    for r, row in enumerate(data, start=start + 1):
        for c, value in enumerate(row, start=1):
            ws.cell(r, c, value)
    style_table(ws, start + 1, start + len(data), {"A": 18, "B": 24, "C": 58, "D": 12, "E": 32})
    ws.freeze_panes = "A5"


def make_homepage(ws):
    ws.title = "Homepage"
    add_sheet_notes(ws, "Use this sheet to control what appears on the homepage sections. Keep each cell concise and scannable.")
    start = 4
    headers = ["section", "slot_key", "content", "image_path", "display_order", "notes"]
    for col, header in zip("ABCDEF", headers):
        ws[f"{col}{start}"] = header
    style_header(ws, start)
    rows = [
        ("hero", "hero_eyebrow", "", "", 1, "Small line above the main title"),
        ("hero", "hero_title", "", "", 2, "Main H1"),
        ("hero", "hero_intro", "", "", 3, "Main paragraph"),
        ("snapshot", "snapshot_1", "", "", 1, "Example: Program | PhD in Life Sciences"),
        ("snapshot", "snapshot_2", "", "", 2, ""),
        ("snapshot", "snapshot_3", "", "", 3, ""),
        ("snapshot", "snapshot_4", "", "", 4, ""),
        ("metrics", "metric_1", "", "", 1, "Example: 4 | Publications listed"),
        ("metrics", "metric_2", "", "", 2, ""),
        ("metrics", "metric_3", "", "", 3, ""),
        ("metrics", "metric_4", "", "", 4, ""),
        ("about", "about_paragraph_1", "", "", 1, ""),
        ("about", "about_paragraph_2", "", "", 2, ""),
        ("interests", "interest_tags", "", "", 1, "Separate tags with |"),
        ("news", "homepage_news_count", "6", "", 1, "How many latest news items to show"),
        ("team", "homepage_team_intro", "", "", 1, "One short paragraph before team cards"),
    ]
    for r, row in enumerate(rows, start=start + 1):
        for c, value in enumerate(row, start=1):
            ws.cell(r, c, value)
    style_table(ws, start + 1, start + len(rows), {"A": 16, "B": 22, "C": 54, "D": 32, "E": 12, "F": 34})
    ws.freeze_panes = "A5"


def make_news(ws):
    ws.title = "News"
    add_sheet_notes(ws, "One row per news item. Use exact dates. Shorter is better.")
    start = 4
    headers = ["date", "title", "description", "link_url", "show_on_homepage", "priority"]
    for col, header in zip("ABCDEF", headers):
        ws[f"{col}{start}"] = header
    style_header(ws, start)
    style_table(ws, start + 1, start + 20, {"A": 16, "B": 36, "C": 60, "D": 30, "E": 16, "F": 10})
    ws.freeze_panes = "A5"


def make_publications(ws):
    ws.title = "Publications"
    add_sheet_notes(ws, "One row per paper. Each paper should have a short summary and one representative figure.")
    start = 4
    headers = [
        "paper_id", "year", "status", "title", "authors", "venue", "doi_or_url",
        "your_role", "one_line_summary", "summary_80_150_words", "image_path",
        "image_caption", "image_crop_note", "show_on_homepage", "display_order"
    ]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    style_table(
        ws,
        start + 1,
        start + 25,
        {
            "A": 12, "B": 10, "C": 14, "D": 44, "E": 40, "F": 24, "G": 26,
            "H": 16, "I": 32, "J": 56, "K": 30, "L": 28, "M": 20, "N": 18, "O": 12
        },
    )
    dv = DataValidation(type="list", formula1='"published,preprint,submitted,in preparation,conference"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"C{start+1}:C{start+100}")
    ws.freeze_panes = "A5"


def make_team(ws):
    ws.title = "Team"
    add_sheet_notes(ws, "Use concise cards. Each person or subgroup can have one image and a short intro.")
    start = 4
    headers = [
        "member_id", "name", "role", "institution", "relation_type", "short_intro",
        "photo_path", "photo_caption", "link_url", "show_on_homepage", "display_order"
    ]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    style_table(ws, start + 1, start + 30, {"A": 12, "B": 18, "C": 20, "D": 24, "E": 16, "F": 42, "G": 28, "H": 24, "I": 28, "J": 18, "K": 12})
    ws.freeze_panes = "A5"


def make_teaching(ws):
    ws.title = "Teaching"
    add_sheet_notes(ws, "No images needed here. One row per TA, buddy, or teaching-related activity.")
    start = 4
    headers = ["term", "year", "course_or_activity", "role", "institution", "one_line_note", "detail_2_4_lines", "display_order"]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    style_table(ws, start + 1, start + 25, {"A": 14, "B": 10, "C": 34, "D": 18, "E": 24, "F": 34, "G": 42, "H": 12})
    ws.freeze_panes = "A5"


def make_gallery(ws):
    ws.title = "Gallery"
    add_sheet_notes(ws, "For life/misc pages. One row per image card. Use category names to group them on the page.")
    start = 4
    headers = ["category", "title_badge", "image_path", "date_text", "people_text", "location_text", "show", "display_order"]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    style_table(ws, start + 1, start + 40, {"A": 18, "B": 28, "C": 34, "D": 18, "E": 34, "F": 28, "G": 10, "H": 12})
    ws.freeze_panes = "A5"


def make_visitormap(ws):
    ws.title = "VisitorMap"
    add_sheet_notes(ws, "This sheet is for the homepage visitor-map module design. I recommend a privacy-aware solution that stores only coarse location and not raw IP long-term.")
    start = 4
    headers = ["setting_key", "value", "required", "recommended_option", "notes"]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    rows = [
        ("enable_map_module", "yes", "yes", "yes", "Show map section on homepage"),
        ("map_title", "", "yes", "Visitors Around The World", ""),
        ("map_subtitle", "", "optional", "Approximate locations from recent visits", ""),
        ("provider_preference", "", "yes", "ClustrMaps / self-hosted API / Cloudflare Worker", "Choose one"),
        ("store_raw_ip", "no", "yes", "no", "Strongly recommended to avoid storing raw IPs"),
        ("location_granularity", "", "yes", "country or city", "Country is safest"),
        ("retention_days", "", "yes", "30", "How long to keep visit records"),
        ("consent_notice_text", "", "optional", "This site uses approximate visit geolocation for aggregate display.", ""),
        ("homepage_position", "", "optional", "after news", ""),
        ("show_recent_visitors_count", "", "optional", "yes", ""),
        ("show_country_rankings", "", "optional", "yes", ""),
        ("show_live_ping", "", "optional", "no", "Static aggregate map is better"),
        ("api_keys_or_services", "", "optional", "", "Paste service names, not secrets"),
    ]
    for r, row in enumerate(rows, start=start + 1):
        for c, value in enumerate(row, start=1):
            ws.cell(r, c, value)
    style_table(ws, start + 1, start + len(rows), {"A": 24, "B": 36, "C": 12, "D": 26, "E": 46})
    ws.freeze_panes = "A5"


def make_assets(ws):
    ws.title = "AssetsChecklist"
    add_sheet_notes(ws, "Use this sheet to track whether each required asset has been prepared and where it lives.")
    start = 4
    headers = ["asset_type", "asset_name", "needed_for", "file_path_or_url", "status", "notes"]
    for col_idx, header in enumerate(headers, start=1):
        ws.cell(start, col_idx, header)
    style_header(ws, start)
    rows = [
        ("image", "profile photo", "sidebar + homepage", "", "todo", ""),
        ("image", "paper figure 1", "publications", "", "todo", ""),
        ("image", "team photo or member photo", "team", "", "todo", ""),
        ("document", "cv pdf", "profile", "", "optional", ""),
        ("image", "gallery image pack", "miscellaneous", "", "optional", ""),
        ("service", "visitor map provider choice", "map", "", "todo", ""),
    ]
    for r, row in enumerate(rows, start=start + 1):
        for c, value in enumerate(row, start=1):
            ws.cell(r, c, value)
    style_table(ws, start + 1, start + 20, {"A": 16, "B": 24, "C": 24, "D": 42, "E": 14, "F": 34})
    dv = DataValidation(type="list", formula1='"todo,ready,optional,skip"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"E{start+1}:E{start+100}")
    ws.freeze_panes = "A5"


def main():
    wb = Workbook()
    make_instructions(wb.active)
    make_profile(wb.create_sheet())
    make_homepage(wb.create_sheet())
    make_news(wb.create_sheet())
    make_publications(wb.create_sheet())
    make_team(wb.create_sheet())
    make_teaching(wb.create_sheet())
    make_gallery(wb.create_sheet())
    make_visitormap(wb.create_sheet())
    make_assets(wb.create_sheet())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
