from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from lxml import etree as E
from pypdf import PdfReader
import json,re,hashlib
root=Path(__file__).parent
path=root.parent/'Roopam_Bag_Mall_Project_Design_Report_2026_27.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
q=lambda x:'{'+ns['w']+'}'+x
with ZipFile(path) as z:parts={n:z.read(n) for n in z.namelist()}
t=E.fromstring(parts['word/document.xml'])
normal=lambda text:re.sub(r'[^a-z0-9]','',text.lower())
pages=[normal(p.extract_text()) for p in PdfReader(root/'filled_v2.pdf').pages]
targets={}
for bm in t.findall('.//w:bookmarkStart',ns):
 name=bm.get(q('name'));text=''.join(bm.getparent().xpath('.//w:t/text()',namespaces=ns));needle=normal(text)
 if not name.startswith('Report'):continue
 matches=[i+1 for i,pg in enumerate(pages) if i>=5 and needle in pg]
 assert matches,(name,text)
 targets[name]=matches[0]
for p in t.findall('.//w:p',ns):
 instr=p.find('.//w:instrText',ns)
 if instr is None or 'PAGEREF Report' not in (instr.text or ''):continue
 name=instr.text.split()[1];val=str(targets[name]);in_result=False
 for r in p.findall('w:r',ns):
  fc=r.find('w:fldChar',ns)
  if fc is not None:
   ft=fc.get(q('fldCharType'))
   if ft=='separate':in_result=True
   if ft=='end':break
  if in_result:
   txt=r.find('w:t',ns)
   if txt is not None:txt.text=val;in_result=False
parts['word/document.xml']=E.tostring(t,xml_declaration=True,encoding='UTF-8',standalone=True)
with ZipFile(path,'w',ZIP_DEFLATED) as z:
 for n,data in parts.items():z.writestr(n,data)
baseline=json.loads((root/'package_baseline.json').read_text())
allowed={'word/document.xml','word/_rels/document.xml.rels','[Content_Types].xml','word/settings.xml'}
changed=[]
for n,info in baseline.items():
 assert n in parts,n
 if hashlib.sha256(parts[n]).hexdigest()!=info['sha256']:
  changed.append(n);assert n in allowed,n
with ZipFile('D:/Submission/Project_Design_Report_Format_2026_27.docx') as z:
 original=E.fromstring(z.read('word/document.xml'))
 assert E.tostring(original.find('.//w:sectPr',ns))==E.tostring(t.find('.//w:sectPr',ns))
 ot=original.findall('.//w:tbl',ns);ft=t.findall('.//w:tbl',ns)
 assert len(ot)==len(ft)==7
 for a,b in zip(ot,ft):
  assert E.tostring(a.find('w:tblPr',ns))==E.tostring(b.find('w:tblPr',ns))
  assert E.tostring(a.find('w:tblGrid',ns))==E.tostring(b.find('w:tblGrid',ns))
text='\n'.join(t.xpath('//w:t/text()',namespaces=ns))
assert '[INSERT PROJECT TITLE]' not in text and '[Approach]' not in text
assert len(t.findall('.//w:drawing',ns))==4
assert all('Insert' in p or not p.strip() for p in re.findall(r'\[([^\]]+)\]',text) if not p.isdigit() and not re.match(r'Online|Accessed',p))
report={'page_count':len(pages),'page_targets':targets,'changed_original_parts':changed,'unchanged_original_parts':len(baseline)-len(changed),'added_parts':[n for n in parts if n not in baseline],'preserved':'all source styles, theme, numbering, footer, original relationships, table properties/grids, section geometry','source_sha256':hashlib.sha256(Path('D:/Submission/Project_Design_Report_Format_2026_27.docx').read_bytes()).hexdigest()}
(root/'fidelity_report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
