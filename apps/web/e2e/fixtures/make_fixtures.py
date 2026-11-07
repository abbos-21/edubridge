"""Generates the small test files used by the browser tests (run once; the outputs are committed)."""
import pathlib, zipfile, zlib, struct

here = pathlib.Path(__file__).parent

TEXT = [
    "Dilnoza Rahimova is applying for a master's programme in development economics.",
    "She led a tutoring group for first-year statistics students in 2023 and eleven students joined.",
    "In 2024 she completed a three-month internship at a bank and wrote a short report.",
]


def docx(path):
    paras = "".join(f"<w:p><w:r><w:t xml:space=\"preserve\">{t}</w:t></w:r></w:p>" for t in TEXT)
    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w:="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'.replace("xmlns:w:", "xmlns:w")
        + f"<w:body>{paras}</w:body></w:document>"
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        "</Relationships>"
    )
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", document)


def pdf(path, with_text):
    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
    if with_text:
        lines = ["BT /F1 12 Tf 72 720 Td 16 TL"] + [f"({t.replace('(', '').replace(')', '')}) Tj T*" for t in TEXT] + ["ET"]
        stream = "\n".join(lines).encode("latin-1")
    else:
        stream = b"0.9 0.9 0.9 rg 72 600 400 100 re f"  # a grey box: no text layer at all, like a scan
    objs.append(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    path.write_bytes(bytes(out))


def png(path):
    w = h = 8
    raw = b"".join(b"\x00" + bytes([200, 220, 240]) * w for _ in range(h))

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    path.write_bytes(data)


docx(here / "sample.docx")
pdf(here / "sample-text.pdf", True)
pdf(here / "sample-scan.pdf", False)
png(here / "sample-photo.png")
(here / "sample.txt").write_text("\n".join(TEXT) + "\n", encoding="utf-8")
print("ok", [p.name for p in here.iterdir()])
