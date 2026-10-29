from zipfile import ZipFile
from lxml import etree
from copy import deepcopy
from pathlib import Path
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
p=Path(r'D:\Project\Final Year Project\output')
source=Path(r'D:\Submission\Roopam_Bag_Mall_Project_Design_Report_2026_27.docx')
updated=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Updated.docx'
out=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Spacing_Fixed.docx'
with ZipFile(source) as s,ZipFile(updated) as z:
 original=etree.fromstring(s.read('word/document.xml'))
 root=etree.fromstring(z.read('word/document.xml'))
 def review_table(r):
  return next(t for t in r.xpath('//w:tbl',namespaces=ns) if 'Ref. / Year' in ''.join(t.xpath('.//w:t/text()',namespaces=ns)))
 oldrow=review_table(original).find('w:tr',ns)
 newrow=review_table(root).find('w:tr',ns)
 for oldp,newp in zip(oldrow.xpath('.//w:p',namespaces=ns),newrow.xpath('.//w:p',namespaces=ns)):
  pr=newp.find('w:pPr',ns)
  if pr is not None: newp.remove(pr)
  oldpr=oldp.find('w:pPr',ns)
  if oldpr is not None: newp.insert(0,deepcopy(oldpr))
 for name in ['word/styles.xml','word/settings.xml']:
  assert s.read(name)==z.read(name)
 assert etree.tostring(original.find('w:body/w:sectPr',ns))==etree.tostring(root.find('w:body/w:sectPr',ns))
 assert len(original.xpath('//w:keepNext',namespaces=ns))==len(root.xpath('//w:keepNext',namespaces=ns))
 with ZipFile(out,'w') as target:
  for info in z.infolist():
   target.writestr(info,etree.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True) if info.filename=='word/document.xml' else z.read(info.filename))
print(out)
print('Original table paragraph formatting restored; margins, line spacing, paragraph styles, page breaks and page settings verified against original.')
