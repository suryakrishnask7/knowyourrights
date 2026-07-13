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

export type Pathway = {
  authority: string;
  deadlineNote: string;
  steps: string[];
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
    authority: "Payment of Wages Authority / Labour Commissioner (jurisdictional)",
    deadlineNote: "File a claim within 12 months of the delayed or withheld payment (Section 15, Payment of Wages Act).",
    steps: [
      "Gather evidence: payslips, bank statements, employment contract, any written communication about salary.",
      "Send a written demand to your employer (via registered post) specifying the exact amount owed and a 7-day payment deadline. Keep the postal receipt.",
      "If unresolved, file Form I (Application under Section 15) before the Payment of Wages Authority in your district. No court fee required.",
      "Attend the hearing. The Authority can order payment of the unpaid wages plus a penalty of up to ten times the withheld amount.",
      "If the Authority's order is not complied with, apply to the Magistrate's court for execution of the order.",
    ],
  },

  wrongful_termination: {
    authority: "Labour Court (Industrial Disputes Act) or relevant State Shops & Establishments Authority",
    deadlineNote: "Raise an industrial dispute within 3 years of termination (ID Act). State S&E appeal deadlines vary: TN — 30 days; MH — 60 days; KA — 30 days.",
    steps: [
      "Collect all documents: appointment letter, termination letter, pay stubs, ID proof, any HR communication.",
      "Send a legal notice to the employer citing the specific violation (IDA §25F or relevant S&E section) and demand reinstatement or full retrenchment compensation.",
      "File a 'Statement of Claim' with the Labour Commissioner or Conciliation Officer to raise an industrial dispute formally.",
      "If conciliation fails, the government may refer the dispute to the Labour Court or Industrial Tribunal.",
      "Alternatively (for S&E establishments), file a direct appeal before the prescribed Authority under the applicable State Shops & Establishments Act within the state-specific deadline.",
      "Attend hearings; the Labour Court may order reinstatement with back wages or award compensation in lieu.",
    ],
  },

  posh_complaint: {
    authority: "Internal Committee (IC) at the workplace. If no IC exists (< 10 employees), file with the Local Committee (LC) constituted by the District Officer.",
    deadlineNote: "File complaint within 3 months of the incident (or last incident in a series). IC may grant one further extension of up to 3 months (Section 9, POSH Act 2013).",
    steps: [
      "Write down a detailed account of each incident — date, time, location, witnesses, and nature of the behaviour.",
      "Submit a written complaint to the Presiding Officer of your workplace's Internal Committee (IC) within 3 months of the incident.",
      "If your employer has fewer than 10 employees or has not constituted an IC, file with the Local Committee (LC) at the District Women & Child Development office.",
      "The IC must complete the inquiry within 90 days and submit its report to the employer within 10 days of completion.",
      "You are entitled to request interim relief (transfer, leave) from the IC during the inquiry.",
      "If dissatisfied with the IC's findings, appeal to the employer (or District Officer for LC cases) within 90 days of the recommendation.",
      "Criminal FIR under IPC Section 354A may be filed simultaneously at the local police station.",
    ],
  },
};
