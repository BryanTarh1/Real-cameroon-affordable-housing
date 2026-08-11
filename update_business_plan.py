from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT=Path('/home/ubuntu/cameroon-affordable-housing')
ASSETS=ROOT/'business-plan-assets'; ASSETS.mkdir(exist_ok=True)
NAVY='#153243'; TEAL='#1B7F79'; GOLD='#D49A3A'; CORAL='#D96C4F'; GREEN='#3E8E62'; INK='#263238'; MUTED='#66747A'; GREY='#6B7280'
plt.rcParams['font.family']='DejaVu Sans'

def box(ax,x,y,w,h,title,subtitle='',color=NAVY,text='white',fs=10.5):
    p=FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.018,rounding_size=0.025',linewidth=0,facecolor=color); ax.add_patch(p)
    ax.text(x+w/2,y+h*.62,title,ha='center',va='center',color=text,fontsize=fs,weight='bold')
    if subtitle: ax.text(x+w/2,y+h*.30,subtitle,ha='center',va='center',color=text,fontsize=8.2,wrap=True)

def arrow(ax,x1,y1,x2,y2,label='',color=GOLD,rad=0):
    a=FancyArrowPatch((x1,y1),(x2,y2),arrowstyle='-|>',mutation_scale=14,linewidth=2,color=color,connectionstyle=f'arc3,rad={rad}'); ax.add_patch(a)
    if label: ax.text((x1+x2)/2,(y1+y2)/2+.035,label,ha='center',va='center',color=INK,fontsize=8,bbox=dict(facecolor='white',edgecolor='none',alpha=.9,pad=1.5))

def save(fig,name):
    p=ASSETS/name; fig.savefig(p,dpi=220,bbox_inches='tight',facecolor='white'); plt.close(fig); return p

# Settlement protection diagram
fig,ax=plt.subplots(figsize=(12,5.8)); ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis('off')
ax.text(.04,.93,'6. Settlement protection: make on-platform payment the safer choice',fontsize=17,weight='bold',color=NAVY)
ax.text(.04,.88,'The platform should not hold deposits in custom servers; use a compliant licensed payment partner and make benefits visible to the seeker.',fontsize=10.2,color=MUTED)
box(ax,.05,.56,.19,.19,'SEEKER','Pays through approved\nmobile-money rail',TEAL)
box(ax,.31,.56,.19,.19,'PLATFORM','Creates receipt,\ntracks agreement',NAVY)
box(ax,.57,.56,.19,.19,'LICENSED PSP / EMI','Processes funds,\nsettlement, controls',GREY)
box(ax,.81,.56,.14,.19,'OWNER','Receives release\nunder agreed trigger',GOLD,INK)
arrow(ax,.24,.65,.31,.65,'payment')
arrow(ax,.50,.65,.57,.65,'instruction')
arrow(ax,.76,.65,.81,.65,'release')
box(ax,.18,.20,.22,.18,'SEEKER BENEFIT','Digital receipt +\nprotection path',CORAL)
box(ax,.51,.20,.22,.18,'PLATFORM RECORD','Time, amount, property,\nparty and status',GREEN)
arrow(ax,.24,.56,.29,.38,'proof')
arrow(ax,.67,.38,.67,.56,'audit')
ax.text(.05,.06,'Control: no informal custody, no use of escrow float as interest revenue, and no launch before legal/payment-partner review.',fontsize=9.2,color=NAVY)
SETTLE=save(fig,'06_settlement_protection.png')

# Moderator audit diagram
fig,ax=plt.subplots(figsize=(12,5.9)); ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis('off')
ax.text(.04,.93,'7. Moderator integrity and anti-collusion control',fontsize=17,weight='bold',color=NAVY)
ax.text(.04,.88,'Verification income must be tied to evidence, random audits, seeker outcomes, and geographic batching.',fontsize=10.2,color=MUTED)
box(ax,.05,.58,.20,.18,'1. BATCH TASKS','Group 5–8 nearby\nproperties per trip',NAVY)
box(ax,.30,.58,.20,.18,'2. VERIFY','Photo + timestamp +\nlocation evidence',GREEN)
box(ax,.55,.58,.20,.18,'3. HOLD PAYOUT','Verification fee pending\nquality checks',GOLD,INK)
box(ax,.80,.58,.15,.18,'4. RELEASE','Pay moderator after\ncontrol passes',TEAL)
arrow(ax,.25,.67,.30,.67,'cluster')
arrow(ax,.50,.67,.55,.67,'evidence')
arrow(ax,.75,.67,.80,.67,'approved')
box(ax,.17,.21,.21,.18,'RANDOM AUDIT','Second moderator\nchecks ~5% sample',CORAL)
box(ax,.42,.21,.21,.18,'SEEKER FEEDBACK','Accuracy / scam /\nactive-property report',NAVY)
box(ax,.67,.21,.21,.18,'REPUTATION','Adjust moderator and\nagent visibility',GREEN)
arrow(ax,.65,.58,.54,.39,'audit sample')
arrow(ax,.42,.39,.38,.39,'feedback')
arrow(ax,.63,.30,.67,.30,'score')
ax.text(.05,.06,'Control: a moderator is paid for real verification work, but repeated inaccurate checks reduce reputation, visibility, and future payout eligibility.',fontsize=9.2,color=NAVY)
AUDIT=save(fig,'07_moderator_audit_controls.png')

# Helpers for docx

def shade(cell,fill):
    tcPr=cell._tc.get_or_add_tcPr(); shd=tcPr.find(qn('w:shd'))
    if shd is None: shd=OxmlElement('w:shd'); tcPr.append(shd)
    shd.set(qn('w:fill'),fill.replace('#',''))

def celltext(cell,text,bold=False,color=INK,size=8.8):
    cell.text=''; p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(0); r=p.add_run(str(text)); r.bold=bold; r.font.size=Pt(size); r.font.color.rgb=RGBColor.from_string(color.replace('#','')); cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

def table(doc,headers,rows):
    t=doc.add_table(rows=1,cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
    for i,h in enumerate(headers): shade(t.rows[0].cells[i],NAVY); celltext(t.rows[0].cells[i],h,True,'FFFFFF',8.8)
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,v in enumerate(row): shade(cells[i],'F7F3EC' if ri%2==0 else 'FFFFFF'); celltext(cells[i],v)
    doc.add_paragraph().paragraph_format.space_after=Pt(1); return t

def heading(doc,text,level=1):
    p=doc.add_heading(text,level); p.style=f'Heading {level}'; return p

def caption(doc,text):
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(text); r.italic=True; r.font.size=Pt(9); r.font.color.rgb=RGBColor.from_string(MUTED.replace('#',''))

path=ROOT/'affordable-housing-cameroon-business-concept-plan.docx'
doc=Document(path)
heading(doc,'13. Strategic venture assessment',1)
doc.add_paragraph('The supplied assessment rates the concept at 7.0 out of 10 as a venture execution plan. This score is an internal strategic opinion, not an independently validated investment rating. It recognizes strong incentive alignment, a realistic transaction-linked revenue model, and a direct response to trust problems in informal rental markets. It also identifies operational leakage, moderator collusion, payment-regulation exposure, and moderator unit-economics risk as launch-critical issues.')
table(doc,['Strength','Why it matters','What must still be proven'],[
['Agent incentive alignment','A 70% share of the commission pool can make agents partners rather than competitors','The final fee must be accepted by agents and still fund platform operations'],
['Revenue linked to value','Verification and settlement services can produce revenue beyond a closed lease','Fees, refund rules, and payment costs must be tested locally'],
['Trust problem addressed','Field verification directly targets fake listings and lost deposits','Verification must be evidence-based and auditable'],
['Local operating model','Moderators create neighborhood-level coverage','Travel time, density, and moderator retention must be measured'],
])
heading(doc,'14. Critical loopholes and strategic fixes',1)
table(doc,['Risk / loophole','Failure mode','Professional control'],[
['Off-platform settlement','After a viewing, the seeker and agent exchange direct details and pay privately','Offer a digital receipt, traceable transaction history, possible cash-back or protection benefit, and formal dispute evidence for on-platform settlement'],
['Moderator-agent collusion','A moderator rubber-stamps a phantom or poor-quality property for the verification fee','Require photo, timestamp, location evidence; hold payout; apply random second-verifier audits; use seeker feedback'],
['Unlicensed escrow custody','The platform holds deposits or rent without the right partner or approval','Do not hold funds on custom platform servers; route settlement through an appropriate licensed payment partner after legal review'],
['Moderator churn','Transport costs consume the 1,200 XAF verification payout','Batch nearby tasks, target 5–8 properties per trip, and monitor net earnings after transport'],
['High fee leakage incentive','A large commission makes private settlement attractive','Use a transparent, proportionate fee and make on-platform protection measurably valuable'],
])
heading(doc,'15. Settlement protection architecture',1)
doc.add_paragraph('The strongest anti-leakage lever is not surveillance; it is making the platform the safer and more useful path at the moment money changes hands. A seeker should receive a traceable receipt, clear terms, and a defined dispute path. The platform should coordinate the workflow but should not assume that it can legally custody rental funds without an appropriate licensed partner and local review.')
doc.add_picture(str(SETTLE),width=Inches(6.9)); caption(doc,'Figure 6. Recommended settlement-protection flow using an approved payment partner.')
heading(doc,'16. Moderator economics and quality controls',1)
doc.add_paragraph('A 1,200 XAF net share can be attractive only when the moderator can complete enough nearby tasks per trip. Geographic batching is therefore both an operational and financial requirement. The platform should assign verification jobs by neighborhood, make travel assumptions visible, and track net earnings after transport rather than reporting gross fee volume alone.')
doc.add_picture(str(AUDIT),width=Inches(6.9)); caption(doc,'Figure 7. Moderator verification, payout hold, random audit, and reputation loop.')
table(doc,['Control','Minimum operating rule','Measurement'],[
['Evidence','Photo, timestamp, location evidence, and verification note required','Evidence completeness rate'],
['Payout hold','Verification payout remains pending until control checks pass','Average payout delay and exception rate'],
['Random audit','Second moderator checks a defined sample, suggested starting point 5%','Audit pass rate and discrepancy rate'],
['Seeker feedback','Post-contact or post-visit accuracy feedback collected','Verified-listing complaint rate'],
['Batching','Group 5–8 nearby properties when practical','Properties per trip and net moderator earnings'],
['Escalation','Repeated inaccurate checks trigger review or suspension','Moderator quality score and suspension rate'],
])
heading(doc,'17. Revised participant earning logic',1)
doc.add_paragraph('The original earning model remains valid as a proposed starting structure, but the revised model adds conditions that protect the economics and credibility of every participant.')
table(doc,['Participant','Base earning / benefit','New condition added by the assessment'],[
['Seeker','Safer search, cost visibility, receipt, and dispute path; possible transaction rebate if approved','The platform must create a visible monetary or legal-protection reason to stay on-platform'],
['Owner','Rent and deposit under the lease; qualified demand','Owner should understand what verification and settlement fees purchase'],
['Agent','70% illustrative share of closed-deal commission pool','Timestamped deal ownership, reputation, and protection against commission disputes'],
['Moderator','Verification share plus 10% illustrative closed-deal slice','Evidence, payout hold, random audits, batching, and reputation consequences'],
['Platform','20% illustrative commission share plus verification and settlement-service revenue','Must fund support, disputes, payment costs, compliance, and product maintenance'],
['Payment provider','Provider-defined processing fees','Must be appropriately licensed and contracted for the settlement flow'],
])
heading(doc,'18. Revised launch gates',1)
doc.add_paragraph('The assessment should change the order of implementation. Do not launch escrow, advertise guaranteed protection, or scale moderator recruitment until the relevant operational and legal controls are ready.')
table(doc,['Gate','Required evidence before proceeding'],[
['Demand and supply','Seekers use the service and owners or agents provide enough legitimate inventory'],
['Commission acceptance','Agents and owners accept the proposed fee and payout trigger'],
['Anti-leakage value','Seekers can identify a concrete benefit to completing settlement through the platform'],
['Moderator economics','Batched work leaves moderators with acceptable net income after transport'],
['Audit integrity','Second-verifier and feedback controls detect inaccurate or suspicious verification'],
['Payment compliance','A qualified payment partner and legal review confirm the settlement design'],
])
heading(doc,'19. Important regulatory and contractual caution',1)
doc.add_paragraph('The supplied assessment correctly identifies escrow as a potentially regulated activity. References to COBAC, BEAC, MTN MoMo, Orange Money, or any other provider should be treated as implementation hypotheses until confirmed through current legal advice, provider documentation, and a formal partnership process. The platform must not hold deposits or rent in an improvised wallet, treat customer funds as operating cash, or promise legal protection that has not been contractually and legally established.')
heading(doc,'20. Updated conclusion',1)
doc.add_paragraph('The concept is commercially promising but execution-sensitive. Its strongest feature is incentive alignment: agents, moderators, and the platform can earn from the same successful housing journey. Its greatest danger is assuming that a listing and a phone number are enough to preserve the transaction. The revised strategy is to build around protected settlement, auditable verification, clustered field operations, and tangible on-platform value for seekers and agents.')
doc.add_paragraph('The 7.0/10 assessment should therefore be interpreted as: strong concept and incentives, but not yet launch-ready until leakage, collusion, moderator economics, and payment compliance are resolved in a controlled pilot.')

# add footer note to all sections
for sec in doc.sections:
    p=sec.footer.paragraphs[0]
    if 'Illustrative model' not in p.text:
        p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run(' | Updated strategic assessment and control framework'); r.font.size=Pt(8); r.font.color.rgb=RGBColor.from_string(MUTED.replace('#',''))

out=ROOT/'affordable-housing-cameroon-business-concept-plan-revised.docx'; doc.save(out); print(out)
