from zipfile import ZipFile
from lxml import etree
from pathlib import Path
from pypdf import PdfReader
import re
p=Path(r'D:\Project\Final Year Project\output')
src=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Spacing_Fixed.docx'
out=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Final.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
# Page numbers verified from the latest Word-rendered, spacing-corrected report.
pages={**{f'ReportChapter{i}':v for i,v in enumerate([6,7,11,14,17,21,23,25,28,31,31,32],1)},**{f'ReportListofFigures{i}':v for i,v in enumerate([15,18,19,24],1)},**{f'ReportListofTables{i}':v for i,v in enumerate([9,17,25,26,28],1)}}
with ZipFile(src) as z:
 root=etree.fromstring(z.read('word/document.xml'))
 before=etree.tostring(root)
 changed=0
 for paragraph in root.xpath('//w:p[.//w:instrText[contains(.,"PAGEREF")]]',namespaces=ns):
  instr=paragraph.xpath('.//w:instrText',namespaces=ns)[0]
  key=re.search(r'PAGEREF\s+(\S+)',instr.text).group(1)
  if key not in pages: continue
  separate=False; texts=[]
  for run in paragraph:
   chars=run.xpath('.//w:fldChar',namespaces=ns)
   for char in chars:
    kind=char.get('{'+ns['w']+'}fldCharType')
    if kind=='separate': separate=True
    elif kind=='end': separate=False
   if separate: texts.extend(run.xpath('.//w:t',namespaces=ns))
  assert len(texts)==1,(key,len(texts))
  texts[0].text=str(pages[key]); changed+=1
 assert changed==21,changed
 with ZipFile(out,'w') as target:
  for info in z.infolist(): target.writestr(info,etree.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True) if info.filename=='word/document.xml' else z.read(info.filename))
 # Reverse only the cached-number edits to prove no other content or layout changes.
 for paragraph in root.xpath('//w:p[.//w:instrText[contains(.,"PAGEREF")]]',namespaces=ns):
  key=re.search(r'PAGEREF\s+(\S+)',paragraph.xpath('.//w:instrText',namespaces=ns)[0].text).group(1)
  if key in pages:
   values=paragraph.xpath('.//w:t',namespaces=ns)
   values[-1].text='1'
 assert etree.tostring(root)==before
print(out)
print('Updated 12 contents entries, 4 figure entries and 5 table entries. Only cached page numbers changed; fields and formatting preserved.')
