# Résumé

[`resume.json`](resume.json) is the single source for the ATS-friendly résumé.

```bash
python3 build_resume.py   # needs python-docx; writes dist/*.html and dist/*.docx
node print_pdf.mjs        # prints dist/*.pdf with Chromium (uses the portfolio's Playwright install)
cp dist/Harshith-C-Shenoy-Resume.{pdf,docx} ../developer-portfolio/public/resume/
```

- Single column, standard headings, text-based PDF (tagged, fonts embedded with Unicode maps) and an editable DOCX
- Check text extraction with `pdftotext dist/Harshith-C-Shenoy-Resume.pdf -`
- Experience `bullets` are intentionally empty: add only verified responsibilities. Add the Workflow Studio live URL to `projects[0].links` once it is deployed.
