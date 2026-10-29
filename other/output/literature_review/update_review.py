from zipfile import ZipFile
from lxml import etree
from pathlib import Path
src=Path(r'D:\Submission\Roopam_Bag_Mall_Project_Design_Report_2026_27.docx')
out=Path(r'D:\Project\Final Year Project\output\Roopam_Bag_Mall_Project_Design_Report_2026_27_Updated.docx')
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(src) as z:
 original=z.read('word/document.xml')
 root=etree.fromstring(original); body=root.find('w:body',ns); items=list(body)
 before={i:etree.tostring(e) for i,e in enumerate(items)}
 def replace(e,text):
  nodes=e.xpath('.//w:t',namespaces=ns)
  assert nodes
  nodes[0].text=text
  for n in nodes[1:]: n.text=''
 changes={
 67:'The review covers seven papers published between 2021 and 2026 on retail inventory systems, customer management, replenishment and inventory optimisation. These studies range from small-business web applications to large-scale analytics and attribute-level decision models. Their relevance to Roopam Bag Mall is assessed against the present prototype; reported benefits are not treated as measured project outcomes.',
 68:'[1] Deng et al. (2023) describe Alibaba\'s integration of demand forecasting, inventory planning, price optimisation and product recommendations. Deep learning and simulation-based optimisation support coordinated retail decisions, with financial benefits reported for Alibaba\'s deployment. Its scale, data resources and operational infrastructure differ from a single-store prototype. For this project, the study supports keeping sales, purchase and stock information consistent as a foundation for later analytics; forecasting and recommendation algorithms remain outside the current scope.',
 69:'[2] Muñoz Macas et al. (2021) review inventory management research for retail SMEs, covering systems, models, performance indicators and adoption challenges. The review identifies continued reliance on simple ERP tools, spreadsheets and manual records, illustrating the need for systems suited to limited resources. Its synthesis of earlier studies does not establish results for a bag retailer. The project therefore prioritises a practical shared catalog, transaction-linked stock history and accessible reports before advanced optimisation.',
 70:'[3] Liew and Alduais (2022) develop a web-based inventory and customer management system for an online retail bakery using iterative development, PHP, AJAX, jQuery and MySQL. The application addresses manual ingredient records and customer service through automation of repetitive management tasks. Bakery ingredients and service workflows differ from bag variants and custom design enquiries. Its relevance is the integration of inventory and customer information in one web application, while the present project adds a separately controlled custom bag request workflow.',
 71:'[4] Siagian and Suendri (2025) apply a Periodic Review System in a Next.js Progressive Web App for hardware-store order and inventory management. Demand and safety-stock information guide replenishment calculations, and the authors report improved stock tracking, delivery handling and offline access. The hardware-store setting and replenishment assumptions require local validation before transfer to bag retail. The study informs future scheduled stock review and offline access; the current React prototype does not implement periodic replenishment or offline synchronisation.',
 72:'[5] U. S. and P. Kaviya (2026) present a PHP/MySQL smart inventory system with administrator, manager and cashier roles. Its modules cover authentication, products, stock updates, purchase and sales tracking, alerts, analytics and reporting. The paper illustrates how modular web automation can connect routine retail operations. Its reported accuracy and error reductions require evaluation in the local store context. For Roopam Bag Mall, the relevant choices are role-controlled access and linked retail records; expiry alerts and the paper\'s performance figures are not claimed as prototype features or results.',
 73:'[6] Koren and Peretz (2026) study colour-level fashion inventory using Markov decision processes. Their SRAMO optimisation procedure and SRIA diagnostic method use product recommendation transitions to assess and reduce imbalances across colour variants. The evaluation concerns fashion-platform data and a colour-balance objective, which do not establish an optimal assortment for a local bag shop. The work highlights the importance of retaining product-variant information for future analysis; Markov modelling and automated colour replenishment are outside the present implementation.',
 74:'[7] Namazian, Betts and Stuckey (2025) combine demand prediction with stochastic optimisation for a beauty retailer operating under periodic inventory review. Forecast updates and re-optimisation account for uncertainty and lead times when determining replenishment quantities. The study reports better service and inventory outcomes in its case setting. Beauty-product demand and international supply constraints differ from this project\'s single-store context. The design implication is to retain reliable sales and purchasing histories for possible future forecasting, rather than claim an implemented predictive replenishment model.',
 84:'The reviewed systems address inventory automation, customer management, replenishment and analytics in different retail settings [1]–[7]. A visual configurator instead focuses on selecting and displaying product variants. The project brings a bounded visual enquiry workflow into the same application as store operations, while keeping its data lifecycle distinct from sales. No feature-by-feature commercial product benchmark is claimed.',
 86:'The reviewed work suggests four design implications. First, SME adoption challenges [2] favour a manageable web system built around everyday store tasks. Second, integrated customer management and retail automation [3], [5] support a common application with role-controlled access and transaction-linked records. Third, replenishment and optimisation studies [1], [4], [7] show why reliable sales and purchase histories should precede future forecasting or automated ordering. Fourth, colour-level inventory analysis [6] highlights the value of retaining variant information. These papers do not directly evaluate an interactive 3D custom bag request process, leaving a project-specific integration need: combine traceable retail operations with saved designs and administrator review. The contribution is application integration, without a claim of a new optimisation algorithm.'
 }
 for i,text in changes.items(): replace(items[i],text)
 removed=set(range(75,78))|set(range(239,242))
 for i in sorted(removed): body.remove(items[i])
 rows=items[81].findall('w:tr',ns)
 data=[
 ['[1] / 2023','Integrated retail analytics','Coordinates forecasting and stock decisions','Large-scale Alibaba setting','Consistent retail data'],
 ['[2] / 2021','Retail SME literature review','Maps systems, KPIs and adoption issues','Earlier studies; varied contexts','Practical stock records'],
 ['[3] / 2022','Bakery web application','Links inventory and customer management','Bakery-specific workflow','Shared web application'],
 ['[4] / 2025','Periodic review with PWA','Supports stock review and offline access','Hardware-store assumptions','Future replenishment review'],
 ['[5] / 2026','Modular retail web system','Roles, stock, sales and reporting','Local results need validation','Role-controlled operations'],
 ['[6] / 2026','Colour-based Markov models','Diagnoses variant inventory imbalance','Fashion-platform data','Retain variant information'],
 ['[7] / 2025','Forecasting and optimisation','Adapts replenishment to demand uncertainty','Beauty-retail case','Future demand forecasting']
 ]
 for row,values in zip(rows[1:],data):
  for cell,text in zip(row.findall('w:tc',ns),values): replace(cell,text)
 for row in rows[8:]: items[81].remove(row)
 refs=[
 '[1] Y. Deng, X. Zhang, T. Wang, L. Wang, Y. Zhang, X. Wang, S. Zhao, Y. Qi, G. Yang, and X. Peng, “Alibaba Realizes Millions in Cost Savings Through Integrated Demand Forecasting, Inventory Management, Price Optimization, and Product Recommendations,” INFORMS Journal on Applied Analytics, vol. 53, no. 1, pp. 32–46, 2023, doi: 10.1287/inte.2022.1145.',
 '[2] C. V. Muñoz Macas, J. A. Espinoza Aguirre, R. Arcentales-Carrion, and M. Peña, “Inventory Management for Retail Companies: A Literature Review and Current Trends,” Proceedings of the 2021 2nd International Conference on Information Systems and Software Technologies (ICI2ST), IEEE, pp. 71–78, 2021.',
 '[3] C. C. Liew and N. Alduais, “Development Web-Based Inventory and Customer Management System for Retail Bakery Online,” Applied Information Technology and Computer Science, vol. 3, no. 2, pp. 460–478, 2022.',
 '[4] A. F. Siagian and S. Suendri, “Applying the Periodic Review System Method in Progressive Web Apps for E-Commerce Inventory Management,” Journal of Information Systems and Informatics, vol. 7, no. 2, pp. 1758–1775, 2025, doi: 10.51519/journalisi.v7i2.1117.',
 '[5] U. S. and P. Kaviya, “Smart Inventory Management System: A Web-Based Solution for Automated Retail Inventory Operations,” International Journal of Current Science, vol. 16, no. 1, pp. 444–449, 2026, doi: 10.56975/ijcsp.v16i1.303869.',
 '[6] M. Koren and O. Peretz, “Dynamic Colour Dynamics: Markov Decision Processes for Fashion Inventory Management,” Annals of Operations Research, vol. 358, pp. 1329–1359, 2026.',
 '[7] Z. Namazian, J. M. Betts, and P. J. Stuckey, “Predict and Optimize: A Smart Inventory Management Model for Beauty Retail,” Optimization Letters, 2025, doi: 10.1007/s11590-025-02226-0.'
 ]
 for i,text in enumerate(refs,232): replace(items[i],text)
 # Keep the comparison caption and header with the first data row.
 for paragraph in [items[80], *rows[0].xpath('.//w:p',namespaces=ns)]:
  properties=paragraph.find('w:pPr',ns)
  if properties is None:
   properties=etree.Element('{'+ns['w']+'}pPr'); paragraph.insert(0,properties)
  if properties.find('w:keepNext',ns) is None: etree.SubElement(properties,'{'+ns['w']+'}keepNext')
 allowed=set(changes)|removed|{80,81}|set(range(232,239))
 for i,e in enumerate(items):
  if i not in allowed: assert before[i]==etree.tostring(e),f'Unexpected change at {i}'
 patched=etree.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
 with ZipFile(out,'w') as target:
  for info in z.infolist(): target.writestr(info,patched if info.filename=='word/document.xml' else z.read(info.filename))
with ZipFile(src) as a,ZipFile(out) as b:
 assert a.namelist()==b.namelist()
 changed=[n for n in a.namelist() if a.read(n)!=b.read(n)]
 assert changed==['word/document.xml']
print('Saved:',out)
print('Verified: only literature-review content, comparison table and corresponding bibliography entries changed. All other XML elements and package parts preserved.')

