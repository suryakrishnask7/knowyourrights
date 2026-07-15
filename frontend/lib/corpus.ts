/**
 * lib/corpus.ts — Hardcoded legal corpus for Phase 1.
 *
 * Three scenarios, verified against the actual statutes:
 *   1. unpaid_wages      — Payment of Wages Act (central)
 *   2. wrongful_termination — IDA §25F (central) + state Shops & Establishments
 *   3. posh_complaint    — POSH Act 2013 (central)
 *
 * EXTENSION POINT (Phase 2): Replace CORPUS with a Postgres + pgvector query
 * inside retrieveChunks(). The caller signature does not change.
 */

export type Jurisdiction = "central" | "TN" | "MH" | "KA";
export type Category = "unpaid_wages" | "wrongful_termination" | "posh_complaint" | "tenant_landlord";

export type Chunk = {
  id: string;
  act: string;
  section: string;
  jurisdiction: Jurisdiction;
  category: Category;
  keywords: string[];
  text: string;
};

export type PathwayStep = {
  title: string;      // Short imperative — "Gather your documents"
  detail: string;     // Full explanatory sentence(s)
  docs?: string[];    // Optional list of specific documents to gather/prepare
};

export type Pathway = {
  authority: string;
  deadlineNote: string;
  steps: PathwayStep[];
};

// ─── Corpus ───────────────────────────────────────────────────────────────────

export const CORPUS: Chunk[] = [
  // ── UNPAID WAGES ─────────────────────────────────────────────────────────
  {
    id: "pow-s3",
    act: "Payment of Wages Act, 1936",
    section: "Section 3",
    jurisdiction: "central",
    category: "unpaid_wages",
    keywords: ["wages", "payment", "responsible", "employer", "unpaid", "pay", "salary", "due"],
    text:
      "Every employer shall be responsible for the payment to persons employed by him of all wages required to be paid under the Payment of Wages Act, 1936. Where the employer is a company, the directors of the company who are responsible for the day-to-day management of the company shall be responsible for the payment of wages.",
  },
  {
    id: "pow-s5",
    act: "Payment of Wages Act, 1936",
    section: "Section 5",
    jurisdiction: "central",
    category: "unpaid_wages",
    keywords: ["wages", "time", "payment", "deadline", "delay", "monthly", "seven days", "ten days", "unpaid", "salary"],
    text:
      "Wages of every person employed upon the completion of the wage period shall be paid: (a) where the number of persons employed is less than one thousand — before the expiry of the seventh day after the last day of the wage period; (b) in any other case — before the expiry of the tenth day. All wages shall be paid on a working day. In the event of termination, wages must be paid before the expiry of the second working day after the day of termination.",
  },
  {
    id: "pow-s15",
    act: "Payment of Wages Act, 1936",
    section: "Section 15",
    jurisdiction: "central",
    category: "unpaid_wages",
    keywords: ["claim", "complaint", "authority", "deduction", "delay", "wages", "application", "remedy", "unpaid", "salary"],
    text:
      "The appropriate government may, by notification in the Official Gazette, appoint an Authority (the Payment of Wages Authority / Labour Commissioner) to hear and decide for any specified area claims arising out of deductions from wages or delay in payment of wages. An employed person may apply to the Authority within twelve months of the date on which the deduction or delay took place.",
  },

  // ── WRONGFUL TERMINATION — central ───────────────────────────────────────
  {
    id: "ida-s25f",
    act: "Industrial Disputes Act, 1947",
    section: "Section 25F",
    jurisdiction: "central",
    category: "wrongful_termination",
    keywords: ["retrenchment", "termination", "fired", "notice", "one month", "compensation", "workman", "wrongful", "layoff", "dismiss"],
    text:
      "No workman employed in any industry who has been in continuous service for not less than one year under an employer shall be retrenched unless: (a) the workman has been given one month's notice in writing indicating the reasons for retrenchment or the workman has been paid in lieu of such notice wages for the period of the notice; and (b) the workman has been paid, at the time of retrenchment, compensation equivalent to fifteen days' average pay for every completed year of continuous service or any part thereof in excess of six months.",
  },
  {
    id: "ida-s11a",
    act: "Industrial Disputes Act, 1947",
    section: "Section 11A",
    jurisdiction: "central",
    category: "wrongful_termination",
    keywords: ["dismissal", "discharge", "labour court", "tribunal", "reinstatement", "compensation", "wrongful", "terminate", "fired"],
    text:
      "Where an industrial dispute relating to the discharge or dismissal of a workman has been referred to a Labour Court or Tribunal, it shall examine the justification for the discharge or dismissal, even if the employer has followed the required procedure. The Labour Court / Tribunal may set aside the order of discharge or dismissal and direct reinstatement with back wages, or award compensation instead of reinstatement.",
  },

  // ── WRONGFUL TERMINATION — Tamil Nadu ────────────────────────────────────
  {
    id: "tn-se-s65",
    act: "Tamil Nadu Shops and Establishments Act, 1947",
    section: "Section 65",
    jurisdiction: "TN",
    category: "wrongful_termination",
    keywords: ["notice", "termination", "shops", "establishment", "employee", "fired", "dismiss", "one month", "Tamil Nadu", "TN"],
    text:
      "No employer shall terminate the service of an employee who has been in continuous employment for not less than six months, except for a reasonable cause and without giving such employee at least one month's notice or wages in lieu thereof. An employee aggrieved by such termination may appeal to the authority prescribed by the government within 30 days of the termination order.",
  },
  // ── WRONGFUL TERMINATION — Maharashtra ───────────────────────────────────
  {
    id: "mh-se-s66",
    act: "Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017",
    section: "Section 66",
    jurisdiction: "MH",
    category: "wrongful_termination",
    keywords: ["notice", "termination", "shops", "establishment", "employee", "fired", "dismiss", "Maharashtra", "MH", "notice period"],
    text:
      "No employer shall terminate the services of an employee (other than a probationer) except for a reasonable cause. For an employee employed for more than three months, the notice period required before termination is: (a) 30 days for employees with one year or more of service; (b) 14 days for employees with three months to one year of service. Wages in lieu of notice may be paid instead. An aggrieved employee may apply to the Shop Inspector or Authority within 60 days of termination.",
  },

  // ── WRONGFUL TERMINATION — Karnataka ─────────────────────────────────────
  {
    id: "ka-se-s44",
    act: "Karnataka Shops and Commercial Establishments Act, 1961",
    section: "Section 44",
    jurisdiction: "KA",
    category: "wrongful_termination",
    keywords: ["notice", "termination", "shops", "establishment", "employee", "fired", "dismiss", "Karnataka", "KA", "notice period"],
    text:
      "No employer shall terminate the services of a person who has been in his employment continuously for not less than six months except for a reasonable cause and without giving one month's notice in writing or wages in lieu thereof. An employee who considers his dismissal to be wrongful may appeal to the authority under the Act within 30 days of the date of order of termination. The authority may, if satisfied that the termination was unjustified, order reinstatement or award compensation.",
  },

  // ── POSH COMPLAINT ────────────────────────────────────────────────────────
  {
    id: "posh-s4",
    act: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
    section: "Section 4",
    jurisdiction: "central",
    category: "posh_complaint",
    keywords: ["internal committee", "ICC", "POSH", "sexual harassment", "workplace", "employer", "constitute"],
    text:
      "Every employer of a workplace where ten or more employees are employed shall constitute an Internal Committee (IC) at every office or branch. The IC shall consist of: (a) a Presiding Officer, who shall be a woman employed at a senior level at the workplace; (b) not less than two members from among employees preferably committed to women's causes or who have had experience in social work; (c) one member from among non-governmental organisations or associations committed to the cause of women. At least one-half of the total members of the IC shall be women.",
  },
  {
    id: "posh-s9",
    act: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
    section: "Section 9",
    jurisdiction: "central",
    category: "posh_complaint",
    keywords: ["complaint", "file", "aggrieved woman", "three months", "deadline", "POSH", "sexual harassment", "written complaint"],
    text:
      "An aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Committee within a period of three months from the date of the incident and in case of a series of incidents, within a period of three months from the date of the last incident. The Internal Committee may, for reasons to be recorded in writing, extend the time limit not exceeding three months if it is satisfied that the circumstances were such which prevented the woman from filing a complaint within the said period.",
  },
  {
    id: "posh-s13",
    act: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
    section: "Section 13",
    jurisdiction: "central",
    category: "posh_complaint",
    keywords: ["inquiry", "report", "recommendation", "action", "POSH", "60 days", "finding", "misconduct"],
    text:
      "On the completion of an inquiry under the Act, the Internal Committee shall provide a report of its findings to the employer within a period of ten days. The inquiry shall be completed within a period of ninety days. Where the IC concludes that the allegation against the respondent has been proved, it shall recommend to the employer: (a) to take action for sexual harassment as a misconduct; and (b) to deduct from the salary or wages of the respondent a sum as it deems appropriate to be paid to the aggrieved woman.",
  },

  // ── TENANT / LANDLORD ─────────────────────────────────────────────────────
  {
    id: "tpa-s106",
    act: "Transfer of Property Act, 1882",
    section: "Section 106",
    jurisdiction: "central",
    category: "tenant_landlord",
    keywords: ["notice", "lease", "terminate", "month to month", "15 days", "tenancy", "landlord", "tenant", "quit", "vacate", "notice period"],
    text:
      "In the absence of a contract or local usage to the contrary, a lease of immovable property for agricultural or manufacturing purpose shall be deemed a lease from year to year, terminable by six months' notice expiring with the end of a year of the tenancy. A lease of immovable property for any other purpose shall be deemed a lease from month to month, terminable on the part of either lessor or lessee by fifteen days' notice expiring with the end of a month of the tenancy. Every notice to quit must be in writing signed by or on behalf of the person giving it.",
  },
  {
    id: "tpa-s108",
    act: "Transfer of Property Act, 1882",
    section: "Section 108",
    jurisdiction: "central",
    category: "tenant_landlord",
    keywords: ["rights", "lessee", "tenant", "lessor", "landlord", "repair", "quiet possession", "defect", "liability", "enjoy", "maintenance"],
    text:
      "In the absence of a contract to the contrary, the lessor is bound to disclose any material defect in the property of which he is aware and the lessee could not discover with ordinary care. The lessor is bound to put the lessee in possession of the property. The lessee is entitled to quiet enjoyment of the property during the continuance of the lease. The lessor is bound to pay all public charges and rent accruing due in respect of the property during the lease. The lessee must return the property in as good a condition as it was when delivered, fair wear and tear excepted.",
  },
  {
    id: "mta-s4-5",
    act: "Model Tenancy Act, 2021",
    section: "Sections 4 & 5",
    jurisdiction: "central",
    category: "tenant_landlord",
    keywords: ["tenancy agreement", "written agreement", "security deposit", "advance", "rent authority", "two months", "six months", "receipt", "deposit", "refund"],
    text:
      "No person shall let or take on rent any premises except by an agreement in writing. The tenancy agreement shall be submitted by the landlord to the Rent Authority within two months from the date of its execution. The landlord shall not collect from the tenant more than two months' rent as security deposit for residential premises, and not more than six months' rent for non-residential premises. The security deposit shall be refunded by the landlord at the time of vacating, after deducting dues if any. The landlord shall issue a receipt for every payment received, including security deposit and advance rent.",
  },

  // ── TENANT / LANDLORD ── Tamil Nadu ──────────────────────────────────────
  {
    id: "tn-rrrlat-s21",
    act: "Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017",
    section: "Section 21",
    jurisdiction: "TN",
    category: "tenant_landlord",
    keywords: ["eviction", "tenant", "landlord", "Tamil Nadu", "TN", "rent", "arrears", "subletting", "damage", "own use", "vacate", "rent court"],
    text:
      "A landlord may apply to the Rent Court for an order of eviction of a tenant on the following grounds: (a) the tenant has not paid rent for a period of two months after it became due; (b) the tenant has sublet, assigned or otherwise parted with possession of the whole or part of the premises without the landlord's written consent; (c) the tenant has used the premises for a purpose other than that for which it was let; (d) the tenant has caused material damage to the premises; (e) the landlord requires the premises bona fide for occupation by himself or a member of his family. An eviction order shall direct the tenant to vacate within thirty days of the date of the order.",
  },

  // ── TENANT / LANDLORD ── Maharashtra ────────────────────────────────────
  {
    id: "mh-rca-s12",
    act: "Maharashtra Rent Control Act, 1999",
    section: "Section 12",
    jurisdiction: "MH",
    category: "tenant_landlord",
    keywords: ["eviction", "tenant", "landlord", "Maharashtra", "MH", "rent", "possession", "subletting", "own use", "arrears", "standard rent", "nuisance"],
    text:
      "A landlord shall not be entitled to recover possession of any premises so long as the tenant pays or is ready and willing to pay the standard rent and permitted increases and observes the conditions of the tenancy. A landlord may apply to the Court for recovery of possession on grounds including: (a) non-payment of rent for six months; (b) subletting without written consent of the landlord; (c) using the premises for a purpose other than agreed in the tenancy; (d) causing nuisance or annoyance to neighbouring occupiers; (e) the premises being required bona fide by the landlord for occupation by himself or his family members for residential purposes.",
  },

  // ── TENANT / LANDLORD ── Karnataka ──────────────────────────────────────
  {
    id: "ka-ra-s27",
    act: "Karnataka Rent Act, 1999",
    section: "Section 27",
    jurisdiction: "KA",
    category: "tenant_landlord",
    keywords: ["eviction", "tenant", "landlord", "Karnataka", "KA", "rent", "possession", "arrears", "subletting", "own use", "rent controller", "repair"],
    text:
      "A landlord seeking possession of premises from a tenant may apply to the Rent Controller on the following grounds: (a) the tenant has not paid the arrears of rent within thirty days of the expiry of a six-month period from the date arrears fell due; (b) the tenant has sublet, assigned, or parted with possession of the premises without the landlord's consent; (c) the tenant has caused substantial damage to the premises; (d) the premises is required reasonably and in good faith by the landlord for occupation by himself or any member of his family; (e) the premises requires urgent reconstruction or repair that cannot be carried out without the tenant vacating. The Rent Controller shall pass an eviction order only after hearing both parties and being satisfied that the ground is made out.",
  },
];

// ─── Pathways ─────────────────────────────────────────────────────────────────

export const PATHWAYS: Record<string, Pathway> = {
  unpaid_wages: {
    authority: "Payment of Wages Authority / Labour Commissioner (jurisdictional district office)",
    deadlineNote: "File a claim within 12 months of the delayed or withheld payment (Section 15, Payment of Wages Act, 1936). Do not wait — the 12-month window runs from each individual delayed payday.",
    steps: [
      {
        title: "Gather and organise your evidence",
        detail:
          "Before approaching any authority, assemble a complete paper trail. Courts and authorities look for exact amounts, exact dates, and written proof that a payment was due. Without documents, your claim rests only on your word against your employer's.",
        docs: [
          "Payslips or salary statements for every delayed month",
          "Bank statements showing the absence of salary credit",
          "Your appointment letter or employment contract (shows agreed salary)",
          "Any WhatsApp messages, emails, or letters about salary delays",
          "Attendance records or biometric reports (if available)",
        ],
      },
      {
        title: "Send a formal written demand to your employer",
        detail:
          "Write a demand notice specifying the exact amount owed, the months it covers, and a 7-day deadline to pay. Send it via registered post (Speed Post with acknowledgement due) so you have legal proof of delivery. Keep the postal receipt — it is evidence of the date and delivery. Email alone is not sufficient as primary proof.",
      },
      {
        title: "File Form I before the Payment of Wages Authority",
        detail:
          "If the employer does not pay within 7 days, file an application under Section 15 of the Payment of Wages Act at the office of the Payment of Wages Authority (usually the Assistant Labour Commissioner) in your district. No court fee or lawyer is required. The form is available at the district Labour Office or online on your state Labour Department portal. Attach all gathered documents as annexures.",
        docs: [
          "Completed Form I (Application under Section 15)",
          "Copy of demand notice and postal receipt",
          "Copies of payslips / bank statements",
          "Copy of appointment letter",
          "Any other supporting evidence",
        ],
      },
      {
        title: "Attend the hearing — no lawyer required",
        detail:
          "The Authority will summon both you and your employer for a hearing, typically within 2–4 weeks of filing. You may appear in person. The Authority can order payment of the full withheld wages plus a penalty of up to ten times the withheld amount under Section 15(3). Keep attending every scheduled date — non-appearance can result in dismissal of the claim.",
      },
      {
        title: "Enforce the Authority's order if needed",
        detail:
          "If the employer ignores the Authority's order, the Authority can forward the order to the Collector (District Magistrate) for recovery as arrears of land revenue — meaning the employer's property can be attached. You may also file an execution application before the competent Magistrate's court. This step is rarely needed once the employer receives the Authority's summons.",
      },
    ],
  },

  wrongful_termination: {
    authority: "Labour Court (Industrial Disputes Act, 1947) for workmen in industry; State Shops & Establishments Authority for shop/commercial establishment employees.",
    deadlineNote: "State Shops & Establishments appeal deadlines are strict: Tamil Nadu — 30 days from termination; Maharashtra — 60 days; Karnataka — 30 days. For an industrial dispute under the ID Act, raise it within 3 years. Missing the S&E deadline can bar your appeal entirely.",
    steps: [
      {
        title: "Secure all documents immediately",
        detail:
          "Collect every document before you lose access to company systems. If you have been locked out, send a written request (registered post + email) to HR for copies. Your termination letter must state the reason for termination — if it does not, that itself is a violation under Section 25F of the Industrial Disputes Act.",
        docs: [
          "Appointment letter / offer letter",
          "Termination letter (note whether it gives a reason)",
          "Notice period pay or final settlement slip",
          "Last 6 months' salary slips / bank statements",
          "PF account statement (UAN portal)",
          "Any HR emails, show-cause notices, or warning letters",
          "ID proof and address proof",
        ],
      },
      {
        title: "Calculate what your employer owes you",
        detail:
          "Under Section 25F of the Industrial Disputes Act, a workman with 1+ year of continuous service is entitled to: (a) one month's notice or pay in lieu, and (b) retrenchment compensation at 15 days' average pay for every completed year of service. Under your state's Shops & Establishments Act, verify the notice period applicable to your tenure (TN: 1 month; MH: 14–30 days depending on tenure; KA: 1 month). If these were not paid, list the exact shortfall.",
      },
      {
        title: "Send a legal notice to your employer",
        detail:
          "Draft a notice citing the specific statutory provisions violated (e.g., IDA Section 25F, and the relevant S&E section for your state). Demand either reinstatement with back wages, or full retrenchment compensation including unpaid notice pay. Send via registered post. Retain the postal receipt and the returned acknowledgement card. This step creates an official record and often prompts employers to settle.",
      },
      {
        title: "File before the Conciliation Officer / Labour Commissioner",
        detail:
          "If the employer does not respond within 15 days, file a Statement of Claim (Form H under the ID Act Rules) with the Conciliation Officer (usually the Assistant Labour Commissioner) to formally raise an industrial dispute. For S&E employees, file a direct appeal before the prescribed State Authority within your state's deadline. The Conciliation Officer will call both parties for a settlement conference.",
        docs: [
          "Statement of Claim (Form H) or State S&E Appeal Form",
          "Copy of legal notice and postal receipt",
          "All employment documents listed in Step 1",
          "Calculation sheet of dues owed",
        ],
      },
      {
        title: "Proceed to Labour Court if conciliation fails",
        detail:
          "If conciliation fails (which the Officer records in a Failure Report), the government may refer the dispute to the Labour Court or Industrial Tribunal. Alternatively, for S&E matters, your appeal before the State Authority proceeds to a hearing. At the Labour Court, you may be represented by a union representative or a lawyer. The court can order reinstatement with full back wages, or award compensation in lieu of reinstatement.",
      },
      {
        title: "Consider parallel remedies",
        detail:
          "You can simultaneously: (a) file a complaint with your state's EPF Commissioner if provident fund was not paid during service; (b) file a complaint with the Inspector under the applicable S&E Act for procedural violations; (c) approach your trade union if you are a member. These parallel actions do not prejudice your main claim and can accelerate settlement.",
      },
    ],
  },

  posh_complaint: {
    authority: "Internal Committee (IC) at your workplace. If your employer has fewer than 10 employees or has not constituted an IC, file with the Local Committee (LC) at the District Women & Child Development / Social Welfare office.",
    deadlineNote: "File your written complaint within 3 months of the incident — or within 3 months of the last incident if it was a series of incidents. The IC may grant one extension of up to 3 more months if you can show circumstances prevented timely filing (Section 9, POSH Act, 2013).",
    steps: [
      {
        title: "Document every incident in writing",
        detail:
          "Write a detailed personal account of each incident as soon as possible — memory fades and contemporaneous notes carry more weight. For each incident note: exact date, time, location, what was said or done, any witnesses present, and how it affected you. Keep this document in a personal file outside company systems (your personal email or home).",
        docs: [
          "Written incident log (your own notes)",
          "Screenshots of offensive messages, emails, or chats",
          "Names and contact details of any witnesses",
          "Medical or counselling records if you sought help",
        ],
      },
      {
        title: "Identify the right authority to approach",
        detail:
          "First, check if your employer has an Internal Committee (IC): employers with 10 or more employees are legally required to constitute one under Section 4 of the POSH Act. The IC's constitution should be displayed at the workplace. If an IC exists, address your complaint to its Presiding Officer. If no IC exists or your employer has fewer than 10 employees, go directly to the Local Committee (LC) at your district's Women & Child Development office — the LC has identical powers.",
      },
      {
        title: "Submit your formal written complaint",
        detail:
          "Write a formal complaint letter (not just an email marked 'informal') addressed to the IC Presiding Officer or LC Chairperson. State the name of the respondent, describe each incident chronologically, list witnesses, and attach your supporting documents. Submit within 3 months of the incident. Make 6 copies — one for the IC/LC, one for yourself, and additional copies may be needed during inquiry. Obtain a written acknowledgement with a date stamp.",
        docs: [
          "Formal complaint letter (signed)",
          "Copies of all supporting documents",
          "Written acknowledgement from IC / LC",
        ],
      },
      {
        title: "Request interim relief if needed",
        detail:
          "Immediately upon filing, you may apply to the IC for interim measures under Section 12 of the POSH Act: transfer of yourself or the respondent to a different department, granting you special leave (paid, not counted against your leave balance), or restraining the respondent from reporting on your work. The IC must decide your interim relief application promptly — it does not have to wait for the inquiry to complete.",
      },
      {
        title: "Cooperate with the inquiry process",
        detail:
          "The IC must complete the inquiry within 90 days. You will be called for statements. You have the right to be heard in person and to present witnesses. The IC must follow principles of natural justice — the respondent also gets to respond. You are entitled to be accompanied by a colleague of your choice. Do not share the inquiry proceedings with others — confidentiality is mandatory under Section 16 and breach can lead to penalty.",
      },
      {
        title: "Act on the IC's findings",
        detail:
          "The IC submits its report to the employer within 10 days of completing the inquiry. The employer must act on the recommendations within 60 days. If the allegation is proved, recommendations can include: disciplinary action (including dismissal), deduction from the respondent's salary as compensation to you, or counselling. If the IC's recommendations are not implemented, you can complain to the District Officer (for LC cases) or approach the court.",
      },
      {
        title: "Escalate or file a criminal complaint if appropriate",
        detail:
          "The POSH process and criminal law run in parallel — filing a POSH complaint does not prevent you from also filing an FIR under Section 354A IPC (sexual harassment) or Section 509 IPC (words or gestures intending to insult the modesty of a woman) at your local police station. If dissatisfied with the IC's decision, appeal to the employer within 90 days; if that fails, approach the appropriate court. National Commission for Women (NCW) can also assist.",
      },
    ],
  },

  tenant_landlord: {
    authority: "Rent Court / Rent Controller (state-specific). For disputes on notice or deposit: civil court with jurisdiction, or State Rent Authority.",
    deadlineNote: "Notice periods under the Transfer of Property Act, 1882: 15 days for residential/non-agricultural leases, 6 months for agricultural or manufacturing leases. State rent laws may set different periods — check your tenancy agreement.",
    steps: [
      {
        title: "Read your tenancy agreement carefully",
        detail:
          "Your rights and obligations depend first on your written agreement. Check: the rent amount, notice period for termination (by either side), security deposit terms, and grounds for eviction listed in the agreement. Under the Model Tenancy Act, 2021, all tenancy agreements must be in writing and registered with the Rent Authority — an oral agreement is still enforceable but harder to prove.",
        docs: [
          "Signed tenancy / lease agreement",
          "Rent receipts for all payments made",
          "Bank statements showing rent debits",
          "Any written communication with the landlord",
        ],
      },
      {
        title: "Document the dispute with written communication",
        detail:
          "Whatever the dispute — security deposit refund, illegal eviction, rent increase without notice — communicate with your landlord in writing. Send a WhatsApp message (screenshot and save), an email, or a registered letter. If verbally told to vacate, respond in writing asking for written notice. This creates a paper trail that the Rent Court will rely on.",
      },
      {
        title: "Send a formal legal notice",
        detail:
          "If the landlord is refusing to return your deposit, is attempting illegal eviction, or has increased rent without proper notice, send a registered legal notice (ideally through an advocate) citing the relevant section of your state's Rent Act and demanding remediation within 15 days. Under the Model Tenancy Act, the landlord must refund the security deposit at the time of vacating, after deducting any legitimate dues.",
        docs: [
          "Copy of legal notice and postal receipt",
          "Tenancy agreement",
          "All rent receipts and bank statements",
        ],
      },
      {
        title: "File a complaint with the Rent Authority / Rent Court",
        detail:
          "If the landlord does not comply: in Tamil Nadu, file before the Rent Court under the TNRRRLT Act, 2017; in Maharashtra, file before the Court under the Maharashtra Rent Control Act, 1999; in Karnataka, file before the Rent Controller under the Karnataka Rent Act, 1999. The Rent Controller can order the landlord to return the deposit, regularise the tenancy, or prevent illegal eviction. No advance court fee required in many states — check local rules.",
        docs: [
          "Petition/application in prescribed format",
          "All tenancy and payment documents",
          "Copy of legal notice sent to landlord",
          "Proof of your identity and address",
        ],
      },
      {
        title: "Contest any eviction petition filed against you",
        detail:
          "A landlord can only legally evict a tenant on the specific grounds listed in the applicable Rent Act (e.g., non-payment of rent for 2 months in TN, or 6 months in MH; subletting without consent; bona fide own use). If the landlord files an eviction petition, file your written objection within the time given by the Rent Court. You may continue in possession until the Rent Court passes a final order. Seek legal aid if needed — every district has a Legal Services Authority providing free lawyers for eligible persons.",
      },
    ],
  },
};
