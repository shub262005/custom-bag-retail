from zipfile import ZipFile
from lxml import etree
from pathlib import Path
import re
p=Path(r'D:\Project\Final Year Project\output')
src=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Final.docx'
out=p/'Roopam_Bag_Mall_Project_Design_Report_2026_27_Names_Completed.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
changes={'[Insert Guide Name]':'Mr. S. R. Khole','Atharv, Sakshi, Shubham, Mokshit':'Atharv Tambat, Sakshi Mohale, Shubham Jain, Mokshit Gondaliya'}
with ZipFile(src) as z:
 r=etree.fromstring(z.read('word/document.xml'))
 applied=[]
 for para in r.xpath('//w:p',namespaces=ns):
  nodes=para.xpath('.//w:t',namespaces=ns)
  for old,new in changes.items():
   full=''.join(n.text or '' for n in nodes)
   if old not in full: continue
   start=full.index(old); end=start+len(old); offset=0; inserted=False
   for node in nodes:
    text=node.text or ''; stop=offset+len(text)
    if offset<end and stop>start:
     a=max(0,start-offset); b=min(len(text),end-offset)
     node.text=text[:a]+(new if not inserted else '')+text[b:]
     inserted=True
    offset=stop
   applied.append(old)
 assert set(applied)==set(changes)
 for para in r.xpath('//w:p',namespaces=ns):
  text=''.join(para.xpath('.//w:t/text()',namespaces=ns))
  assert not re.search(r'\[\s*(?:insert|enter|your|name here|replace|add)\b[^\]]*\]',text,re.I),text
 with ZipFile(out,'w') as target:
  for info in z.infolist(): target.writestr(info,etree.tostring(r,encoding='UTF-8',xml_declaration=True,standalone=True) if info.filename=='word/document.xml' else z.read(info.filename))
print(out)
print('Replaced guide-name placeholder and completed certificate student names from the cover-page student table. No other content or formatting changed.')
