export interface Translations {
  nav: {
    history: string;
    howItWorks: string;
    newQuery: string;
    translating: string;
    tagline: string;
  };
  homepage: {
    systemBadge: string;
    archiveBadge: string;
    jurisdictionBadge: string;
    heroKicker: string;
    heroTitle: string;
    heroDesc: string;
    startInquiry: string;
    howItWorksBtn: string;
    pillar1Title: string;
    pillar1Sub: string;
    pillar2Title: string;
    pillar2Sub: string;
    pillar3Title: string;
    pillar3Sub: string;
    methodologyKicker: string;
    methodologyTitle: string;
    methodologyDesc: string;
    stages: Array<{ num: string; title: string; desc: string }>;
    rigorKicker: string;
    rigorTitle: string;
    rigorDesc: string;
    rigorCards: Array<{ kicker: string; title: string; desc: string; footer: string }>;
    entryKicker: string;
    entryTitle: string;
    entryDesc: string;
  };
  entryGate: {
    nameLabel: string;
    nameHint: string;
    termsHeading: string;
    termsText: string;
    proceedBtn: string;
    termsWarning: string;
  };
  workspace: {
    statusKicker: string;
    applicantLabel: string;
    termsAcknowledged: string;
    backToOverview: string;
    kicker: string;
    title: string;
    subtitle: string;
    jurisdictionLabel: string;
    inputLabel: string;
    inputPlaceholder: string;
    analyzeBtn: string;
    jurisdictionsCovered: string;
    verifiedSources: string;
    exampleHeader: string;
    useThis: string;
  };
  howItWorksModal: {
    title: string;
    subtitle: string;
    close: string;
    steps: Array<{ num: string; title: string; desc: string }>;
  };
  historyModal: {
    title: string;
    subtitle: string;
    close: string;
    clearAll: string;
    emptyTitle: string;
    emptyDesc: string;
    openBrief: string;
    delete: string;
  };
  clarification: {
    header: string;
    stamp: string;
    intro: string;
    continueBtn: string;
    skipBtn: string;
  };
  loading: {
    activeBadge: string;
    heading: string;
    steps: string[];
  };
}

export const LOCALIZED_EXAMPLES: Record<string, Array<{ ref: string; label: string; text: string }>> = {
  en: [
    { ref: "EXAMPLE 01", label: "UNPAID OVERTIME", text: "My company makes me work 12 hours every day, but refuses to pay overtime wages." },
    { ref: "EXAMPLE 02", label: "GRATUITY WITHHELD", text: "I resigned after 5 years of continuous service, but my company is refusing to pay my gratuity." },
    { ref: "EXAMPLE 03", label: "UNLAWFUL EVICTION", text: "My landlord disconnected our electricity and water to force us out without a court order." },
    { ref: "EXAMPLE 04", label: "MATERNITY BENEFIT", text: "My employer dismissed me after I applied for statutory 26-week paid maternity leave." },
  ],
  ta: [
    { ref: "உதாரணம் 01", label: "கூடுதல் நேர ஊதியம் மறுப்பு", text: "நிறுவனம் என்னை தினமும் 12 மணிநேரம் வேலை செய்ய வைக்கிறது, ஆனால் கூடுதல் நேர ஊதியம் (Overtime) வழங்க மறுக்கிறது." },
    { ref: "உதாரணம் 02", label: "பணிக்கொடை (கிராஜூவிட்டி) நிறுத்தம்", text: "5 ஆண்டுகள் தொடர் பணிக்குப் பிறகு நான் ராஜினாமா செய்தேன், ஆனால் நிறுவனம் எனது பணிக்கொடையை வழங்க மறுக்கிறது." },
    { ref: "உதாரணம் 03", label: "சட்டவிரோத காலி செய்தல்", text: "நீதிமன்ற உத்தரவு இல்லாமல் எங்களை காலி செய்ய வைக்க வீட்டு உரிமையாளர் மின்சாரம் மற்றும் குடிநீர் இணைப்பை துண்டித்துள்ளார்." },
    { ref: "உதாரணம் 04", label: "மகப்பேறு விடுப்பு உரிமை", text: "சட்டரீதியான 26 வார ஊதியத்துடன் கூடிய மகப்பேறு விடுப்புக்கு விண்ணப்பித்த பிறகு நிறுவனம் என்னை பணியிலிருந்து நீக்கியது." },
  ],
  hi: [
    { ref: "उदाहरण 01", label: "ओवरटाइम वेतन का भुगतान नहीं", text: "कंपनी मुझसे रोज़ 12 घंटे काम करवाती है, लेकिन ओवरटाइम भत्ते का भुगतान करने से इनकार कर रही है।" },
    { ref: "उदाहरण 02", label: "ग्रेच्युटी का भुगतान रोका", text: "मैंने 5 साल लगातार सेवा के बाद इस्तीफा दिया, लेकिन कंपनी मेरी ग्रेच्युटी राशि देने से मना कर रही है।" },
    { ref: "उदाहरण 03", label: "गैर-कानूनी बेदखली", text: "मकान मालिक ने हमें ज़बरन निकालने के लिए बिना किसी अदालती आदेश के बिजली और पानी का कनेक्शन काट दिया है।" },
    { ref: "उदाहरण 04", label: "मातृत्व लाभ से इनकार", text: "वैधानिक 26 सप्ताह के सवेतन मातृत्व अवकाश के लिए आवेदन करने पर नियोक्ता ने मुझे नौकरी से निकाल दिया।" },
  ],
  te: [
    { ref: "ఉదాహరణ 01", label: "ఓవర్‌టైమ్ వేతనం ఎగవేత", text: "మా కంపెనీ ప్రతిరోజూ నాతో 12 గంటలు పనిచేయిస్తోంది, కానీ ఓవర్‌టైమ్ వేతనం ఇవ్వడానికి నిరాకరిస్తోంది." },
    { ref: "ఉదాహరణ 02", label: "గ్రాట్యుటీ చెల్లింపు నిలిపివేత", text: "నేను 5 సంవత్సరాల నిరంతర సేవ తర్వాత రాజీనామా చేశాను, కానీ కంపెనీ నా గ్రాట్యుటీ చెల్లించడానికి నిరాకరిస్తోంది." },
    { ref: "ఉదాహరణ 03", label: "చట్టవిరుద్ధ ఖాళీ చేయించడం", text: "కోర్టు ఉత్తర్వులు లేకుండా మమ్మల్ని ఇల్లు ఖాళీ చేయించేందుకు ఇంటి యజమాని కరెంట్ మరియు నీటి సరఫరా నిలిపివేశారు." },
    { ref: "ఉదాహరణ 04", label: "ప్రసూతి సెలవు ప్రయోజనం", text: "చట్టబద్ధమైన 26 వారాల వేతనంతో కూడిన ప్రసూతి సెలవులకు దరఖాస్తు చేసినందుకు నా యజమాని నన్ను ఉద్యోగం నుండి తొలగించారు." },
  ],
  kn: [
    { ref: "ಉದಾಹರಣೆ 01", label: "ಹೆಚ್ಚುವರಿ ಕೆಲಸದ ವೇತನ ಬಾಕಿ", text: "ನನ್ನ ಕಂಪನಿಯು ಪ್ರತಿದಿನ 12 ಗಂಟೆಗಳ ಕಾಲ ಕೆಲಸ ಮಾಡಿಸಿಕೊಳ್ಳುತ್ತದೆ, ಆದರೆ ಓವರ್‌ಟೈಮ್ ವೇತನ ನೀಡಲು ನಿರಾಕರಿಸುತ್ತಿದೆ." },
    { ref: "ಉದಾಹರಣೆ 02", label: "ಗ್ರಾಚ್ಯುಟಿ ಪಾವತಿ ತಡೆಹಿಡಿಯುವಿಕೆ", text: "ನಾನು 5 ವರ್ಷಗಳ ನಿರಂತರ ಸೇವೆಯ ನಂತರ ರಾಜೀನಾಮೆ ನೀಡಿದೆ, ಆದರೆ ಕಂಪನಿಯು ನನ್ನ ಗ್ರಾಚ್ಯುಟಿ ನೀಡಲು ನಿರಾಕರಿಸುತ್ತಿದೆ." },
    { ref: "ಉದಾಹರಣೆ 03", label: "ಕಾನೂನುಬಾಹಿರ ತೆರವು", text: "ಯಾವುದೇ ನ್ಯಾಯಾಲಯದ ಆದೇಶವಿಲ್ಲದೆ ನಮ್ಮನ್ನು ಖಾಲಿ ಮಾಡಿಸಲು ಮನೆ ಮಾಲೀಕರು ವಿದ್ಯುತ್ ಮತ್ತು ನೀರಿನ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿದ್ದಾರೆ." },
    { ref: "ಉದಾಹರಣೆ 04", label: "ಹೆರಿಗೆ ರಜೆ ಸೌಲಭ್ಯ ನಿರಾಕರಣೆ", text: "ಶಾಸನಬದ್ಧ 26 ವಾರಗಳ ವೇತನ ಸಹಿತ ಹೆರಿಗೆ ರಜೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ನಂತರ ನನ್ನ ಉದ್ಯೋಗದಾತರು ನನ್ನನ್ನು ವಜಾಗೊಳಿಸಿದ್ದಾರೆ." },
  ],
  mr: [
    { ref: "उदाहरण 01", label: "ओव्हरटाईम वेतनाची थकबाकी", text: "कंपनी माझ्याकडून दररोज १२ तास काम करून घेते, परंतु ओव्हरटाईम वेतन देण्यास नकार देत आहे." },
    { ref: "उदाहरण 02", label: "ग्रॅच्युइटी रोखून ठेवणे", text: "मी सलग ५ वर्षे सेवा पूर्ण करून राजीनामा दिला, परंतु कंपनी माझी ग्रॅच्युइटी देण्यास नकार देत आहे." },
    { ref: "उदाहरण 03", label: "बेकायदेशीर निष्कासन", text: "घरमालकाने कोणत्याही न्यायालयीन आदेशाशिवाय घर रिकामे करण्यासाठी आमची वीज आणि पाणीपुरवठा खंडित केला आहे." },
    { ref: "उदाहरण 04", label: "मातृत्व लाभ नाकारणे", text: "कायदेशीर २६ आठवड्यांच्या सवेतन मातृत्व रजेसाठी अर्ज केल्यानंतर माझ्या मालकाने मला नोकरीवरून काढून टाकले." },
  ],
};

export const UI_TRANSLATIONS: Record<string, Translations> = {
  en: {
    nav: {
      history: "HISTORY",
      howItWorks: "HOW IT WORKS",
      newQuery: "+ NEW QUERY",
      translating: "TRANSLATING...",
      tagline: "EST. · INDIAN STATUTORY ARCHIVE",
    },
    homepage: {
      systemBadge: "● STATUTORY INFORMATION SYSTEM",
      archiveBadge: "MINISTRY OF LABOUR & HOUSING ARCHIVE",
      jurisdictionBadge: "JURISDICTION: TN · MH · KA · CENTRAL",
      heroKicker: "STATUTORY RIGHTS FOR WORKERS & TENANTS",
      heroTitle: "Plain-language legal clarity grounded in Indian statute.",
      heroDesc:
        "Workers and tenants across India have enforceable rights under Central codes and State enactments, but the protections are buried under archaic legalese and fragmented state rules. KnowYourRights cuts through the opacity: matching your grievance to verified Indian law, honestly evaluating evidence sufficiency, and outlining your concrete procedural pathway.",
      startInquiry: "[ START INQUIRY ]",
      howItWorksBtn: "HOW IT WORKS ↓",
      pillar1Title: "CENTRAL & STATE",
      pillar1Sub: "Jurisdiction-specific",
      pillar2Title: "EVIDENCE-HONEST",
      pillar2Sub: "Precondition checks",
      pillar3Title: "OFFICIAL NOTICES",
      pillar3Sub: "Statutory drafting",
      methodologyKicker: "METHODOLOGY & REASONING",
      methodologyTitle: "How KnowYourRights evaluates your situation",
      methodologyDesc:
        "Legal problems are not abstract puzzles. We translate everyday disputes into verifiable statutory positions through a structured four-stage evaluation.",
      stages: [
        {
          num: "§ 1",
          title: "Plain-Language Grievance Intake",
          desc: "Describe what occurred in plain everyday words — whether your salary was withheld, PF deductions were never deposited to EPFO, you were dismissed without notice, or your landlord refuses to refund a security deposit. You do not need to know statutory terms or legal jargon.",
        },
        {
          num: "§ 2",
          title: "Jurisdiction-Aware Statutory Search",
          desc: "In India, labour and tenancy fall under concurrent legislative jurisdiction. The system identifies applicable Central enactments (such as the Payment of Wages Act or Industrial Disputes Act) and combines them with state-specific laws for Tamil Nadu, Maharashtra, or Karnataka.",
        },
        {
          num: "§ 3",
          title: "Evidence Sufficiency & Targeted Clarification",
          desc: "Instead of guessing or delivering overconfident claims, the system objectively tests whether essential statutory preconditions are met (such as continuous service tenure or wage limits). If critical facts are missing, it asks targeted clarifying questions before advising.",
        },
        {
          num: "§ 4",
          title: "Actionable Procedural Recourse & Notice Drafting",
          desc: "Rights without procedural remedies are ineffective. You receive the designated judicial authority (Labour Commissioner, Rent Controller, or DLSA), statutory limitation periods, evidentiary documents needed, and an automated formal legal notice ready for delivery.",
        },
      ],
      rigorKicker: "INSTITUTIONAL RIGOR",
      rigorTitle: "Built for statutory accuracy, not conversational guesswork",
      rigorDesc:
        "Generic conversational AI regularly hallucinates legal citations and provides inaccurate advice. KnowYourRights is architected with strict statutory safeguards.",
      rigorCards: [
        {
          kicker: "[ CITATION FIDELITY ]",
          title: "Grounded in Verified Statute",
          desc: "Every conclusion cites actual enactments, sections, and schedules from the Indian statutory archive. We never invent nonexistent provisions or cite fictitious case precedents.",
          footer: "E.g. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ EVIDENCE INTEGRITY ]",
          title: "Honest About Uncertainty",
          desc: "If statutory preconditions are unverified, our Evidence Sufficiency engine explicitly assigns a Low or Medium confidence score and highlights missing facts rather than guessing.",
          footer: "Evaluation: High · Medium · Low",
        },
        {
          kicker: "[ CONFLICT OF LAWS ]",
          title: "State Jurisdiction Aware",
          desc: "Under Article 254 of the Indian Constitution, State laws modify Central labour frameworks. A tenancy claim in Bengaluru adheres to Karnataka law, not Tamil Nadu or Maharashtra rules.",
          footer: "Resolves: Central vs State Precedence",
        },
      ],
      entryKicker: "ENTRY OF INQUIRY & ACKNOWLEDGEMENT",
      entryTitle: "Begin your legal inquiry",
      entryDesc: "Provide your name and acknowledge statutory terms to enter the query workspace.",
    },
    entryGate: {
      nameLabel: "WHAT SHOULD WE CALL YOU?",
      nameHint: "Used solely to address you and draft formal notices. Never shared or sold.",
      termsHeading: "Statutory Research & Non-Representation Acknowledgment",
      termsText:
        "I understand that KnowYourRights provides statutory legal information and procedural guidance based on Indian law, not individualized legal advice or attorney representation. I agree to the terms of service and statutory research methodology.",
      proceedBtn: "PROCEED TO INQUIRY",
      termsWarning: "* Check the statutory research acknowledgment above to proceed.",
    },
    workspace: {
      statusKicker: "INQUIRY WORKSPACE",
      applicantLabel: "APPLICANT:",
      termsAcknowledged: "TERMS ACKNOWLEDGED ✓",
      backToOverview: "← Back to overview",
      kicker: "LEGAL INFORMATION & RECOURSE",
      title: "Tell us what happened.",
      subtitle: "We'll find the law.",
      jurisdictionLabel: "WHERE DOES THIS APPLY?",
      inputLabel: "WHAT HAPPENED?",
      inputPlaceholder: "Tell us what happened...",
      analyzeBtn: "[ ANALYZE CASE ]",
      jurisdictionsCovered: "JURISDICTIONS COVERED",
      verifiedSources: "VERIFIED LEGAL SOURCES",
      exampleHeader: "START WITH AN EXAMPLE",
      useThis: "USE THIS →",
    },
    howItWorksModal: {
      title: "How KnowYourRights Works",
      subtitle: "SYSTEM ARCHITECTURE",
      close: "✕ CLOSE",
      steps: [
        {
          num: "01",
          title: "TELL US WHAT HAPPENED",
          desc: "Describe your situation in your own words. We identify the important details, such as what happened, when it happened, and what you are claiming.",
        },
        {
          num: "02",
          title: "UNDERSTAND YOUR LEGAL ISSUE",
          desc: "We identify what kind of legal problem you're facing and determine which areas of law may apply.",
        },
        {
          num: "03",
          title: "FIND THE RELEVANT LAW",
          desc: "We search Indian laws and relevant state-specific provisions to find the rules that apply to your situation.",
        },
        {
          num: "04",
          title: "CHECK WHETHER THE LAW FITS",
          desc: "We check the legal requirements against the facts you provided to see whether there is enough evidence to support an answer.",
        },
        {
          num: "05",
          title: "BUILD YOUR CASE SUMMARY",
          desc: "We bring the relevant laws, sections, evidence, and practical next steps together into a clear legal information summary.",
        },
      ],
    },
    historyModal: {
      title: "Case Inquiry History",
      subtitle: "BROWSER SESSION ARCHIVE",
      close: "✕ CLOSE",
      clearAll: "[ Clear all history ]",
      emptyTitle: "No past inquiries recorded in this browser session yet.",
      emptyDesc: "Submit a legal query to see it saved here automatically.",
      openBrief: "[ OPEN CASE BRIEF → ]",
      delete: "Delete",
    },
    clarification: {
      header: "STATUTORY INTAKE",
      stamp: "STATUTORY INTAKE",
      intro: "One fact is needed before we can determine which statutory provisions apply.",
      continueBtn: "CONTINUE →",
      skipBtn: "SKIP",
    },
    loading: {
      activeBadge: "STATUTORY ENGINE ACTIVE",
      heading: "Analyzing Legal Situation",
      steps: [
        "Analyzing facts and identifying legal issue",
        "Searching relevant Indian statutes and state provisions",
        "Validating legal requirements against your facts",
        "Synthesizing statutory guidance and action steps",
      ],
    },
  },

  ta: {
    nav: {
      history: "வரலாறு",
      howItWorks: "எவ்வாறு செயல்படுகிறது",
      newQuery: "+ புதிய கேள்வி",
      translating: "மொழிபெயர்க்கப்படுகிறது...",
      tagline: "நிறுவப்பட்டது · இந்திய சட்ட ஆவணக் காப்பகம்",
    },
    homepage: {
      systemBadge: "● சட்ட தகவல் அமைப்பு",
      archiveBadge: "தொழிலாளர் & வீட்டுவசதி அமைச்சக ஆவணக் காப்பகம்",
      jurisdictionBadge: "அதிகார வரம்பு: தமிழ்நாடு · மகாராஷ்டிரா · கர்நாடகா · மத்திய அரசு",
      heroKicker: "தொழிலாளர்கள் & வாடகைதாரர்களுக்கான சட்ட உரிமைகள்",
      heroTitle: "இந்திய சட்டங்களின்படி நேரடியான, தெளிவான சட்ட வழிகாட்டல்.",
      heroDesc:
        "இந்தியா முழுவதும் உள்ள தொழிலாளர்கள் மற்றும் வாடகைதாரர்களுக்கு மத்திய மற்றும் மாநில சட்டங்களின் கீழ் உரிமைகள் உள்ளன. KnowYourRights உங்கள் புகாரை சரிபார்க்கப்பட்ட இந்திய சட்டங்களுடன் ஒப்பிட்டு, ஆதாரங்களை நேர்மையாக மதிப்பீடு செய்து, அடுத்த கட்ட சட்ட நடைமுறைகளை தெளிவாக்குகிறது.",
      startInquiry: "[ விசாரணையைத் தொடங்கவும் ]",
      howItWorksBtn: "எவ்வாறு செயல்படுகிறது ↓",
      pillar1Title: "மத்திய & மாநில சட்டம்",
      pillar1Sub: "அதிகார வரம்பு சார்ந்தது",
      pillar2Title: "ஆதார உண்மைத்தன்மை",
      pillar2Sub: "முன்நிபந்தனை சோதனைகள்",
      pillar3Title: "அதிகாரப்பூர்வ நோட்டீஸ்",
      pillar3Sub: "சட்ட அறிவிப்பு வரைவு",
      methodologyKicker: "முறையியல் & சட்ட பகுப்பாய்வு",
      methodologyTitle: "KnowYourRights உங்கள் பிரச்சனையை எவ்வாறு மதிப்பீடு செய்கிறது",
      methodologyDesc:
        "சட்ட சிக்கல்கள் புதிர்கள் அல்ல. நான்கு அடுக்கு கட்டமைக்கப்பட்ட மதிப்பீட்டின் மூலம் உங்கள் அன்றாட புகார்களை சட்டப்பூர்வ தீர்வாக மாற்றுகிறோம்.",
      stages: [
        {
          num: "§ 1",
          title: "எளிய வார்த்தைகளில் புகார் பதிவு",
          desc: "ஊதியம் நிறுத்தி வைக்கப்பட்டதா, பி.எஃப் தொகை கணக்கில் வரவு வைக்கப்படவில்லையா, முன்னறிவிப்பின்றி பணிநீக்கம் செய்யப்பட்டீர்களா, அல்லது வாடகை முன்பணத்தை உரிமையாளர் தர மறுக்கிறாரா என்பதை எளிய வார்த்தைகளில் விவரியுங்கள்.",
        },
        {
          num: "§ 2",
          title: "அதிகார வரம்பு சார்ந்த சட்டத் தேடல்",
          desc: "தொழிலாளர் மற்றும் வாடகை விவகாரங்கள் மத்திய மற்றும் மாநில அதிகார வரம்பிற்கு உட்பட்டவை. மத்திய சட்டங்களுடன் சேர்த்து தமிழ்நாடு, மகாராஷ்டிரா அல்லது கர்நாடக மாநில சட்டங்களையும் ஒருங்கிணைக்கிறோம்.",
        },
        {
          num: "§ 3",
          title: "ஆதாரங்களின் போதுமான தன்மை & தெளிவுபடுத்தல்",
          desc: "வெறும் யூகங்களை வழங்காமல், சட்டப்பூர்வ முன்நிபந்தனைகள் பூர்த்தி செய்யப்பட்டுள்ளனவா என சரிபார்க்கிறோம். கூடுதல் விவரங்கள் தேவைப்பட்டால் துல்லியமான கேள்விகளைக் கேட்டு தெளிவுபடுத்துகிறோம்.",
        },
        {
          num: "§ 4",
          title: "செயல்பாட்டு சட்ட நடைமுறைகள் & நோட்டீஸ் வரைவு",
          desc: "நடைமுறை தீர்வுகள் இல்லாத உரிமைகளால் பயனில்லை. அணுக வேண்டிய நீதிமன்றம்/அதிகாரி, காலக்கெடு, தேவையான ஆவணங்கள் மற்றும் உடனடியாக அனுப்பக்கூடிய அதிகாரப்பூர்வ சட்ட அறிவிப்பை வழங்குகிறோம்.",
        },
      ],
      rigorKicker: "நம்பகமான சட்ட துல்லியம்",
      rigorTitle: "யூகங்கள் இன்றி, இந்திய சட்ட விதிகளின் துல்லியமான அடிப்படையில் உருவாக்கப்பட்டது",
      rigorDesc:
        "பொதுவான AI மாதிரிகள் இல்லாத சட்டப் பிரிவுகளை தவறாகக் கூறும் வாய்ப்புள்ளது. KnowYourRights உண்மையான இந்திய சட்ட விதிகளுக்கு உட்பட்டு பாதுகாப்பாக வடிவமைக்கப்பட்டுள்ளது.",
      rigorCards: [
        {
          kicker: "[ சட்டப் பிரிவு நம்பகத்தன்மை ]",
          title: "சரிபார்க்கப்பட்ட சட்டப் பிரிவுகள்",
          desc: "ஒவ்வொரு முடிவும் இந்திய சட்டக் காப்பகத்தின் உண்மையான சட்டங்கள் மற்றும் பிரிவுகளை மட்டுமே மேற்கோள் காட்டுகிறது. இல்லாத பிரிவுகளை நாங்களாக உருவாக்க மாட்டோம்.",
          footer: "எ.கா. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ ஆதாரங்களின் உண்மைத்தன்மை ]",
          title: "நேர்மையான மதிப்பீடு",
          desc: "சட்ட நிபந்தனைகள் முழுமையாக நிரூபிக்கப்படாவிட்டால், யூகிக்காமல் எங்கள் அமைப்பு அதை நடுத்தர அல்லது குறைந்த சான்று என நேர்மையாகக் குறிப்பிடுகிறது.",
          footer: "மதிப்பீடு: அதிகம் · மிதமான · குறைவு",
        },
        {
          kicker: "[ மாநில சட்ட முரண்பாடுகள் ]",
          title: "மாநில சட்ட முன்னுரிமை",
          desc: "இந்திய அரசியலமைப்பின் 254-வது பிரிவின்படி, மாநில சட்டங்கள் மத்திய சட்டங்களை மாற்றியமைக்கலாம். பெங்களூரு வாடகை விவகாரத்திற்கு கர்நாடக சட்டமே பொருந்தும்.",
          footer: "தீர்க்கிறது: மத்திய vs மாநில முன்னுரிமை",
        },
      ],
      entryKicker: "விசாரணை பதிவு & ஒப்புதல்",
      entryTitle: "உங்கள் சட்ட விசாரணையைத் தொடங்குங்கள்",
      entryDesc: "உங்கள் பெயரை உள்ளிட்டு, சட்ட விதிகளுக்கு ஒப்புதல் அளித்து விசாரணைப் பகுதிக்கு செல்லவும்.",
    },
    entryGate: {
      nameLabel: "உங்கள் பெயர் என்ன?",
      nameHint: "உங்களை அழைக்கவும் சட்ட நோட்டீஸ் தயாரிக்கவும் மட்டுமே பயன்படுத்தப்படுகிறது. பிறருடன் பகிரப்படாது.",
      termsHeading: "சட்டத் தகவல் & பொறுப்பு மறுப்பு ஒப்புதல்",
      termsText:
        "KnowYourRights இந்திய சட்டங்களின் அடிப்படையில் சட்ட தகவல் மற்றும் வழிகாட்டலை மட்டுமே வழங்குகிறது, இது வழக்கறிஞரின் நேரடி ஆலோசனைக்கு மாற்றாகாது என்பதை ஒப்புக்கொள்கிறேன்.",
      proceedBtn: "விசாரணைக்கு செல்லவும்",
      termsWarning: "* தொடர மேலே உள்ள சட்ட ஒப்புதல் பெட்டியைத் தேர்ந்தெடுக்கவும்.",
    },
    workspace: {
      statusKicker: "விசாரணைப் பகுதி",
      applicantLabel: "விண்ணப்பதாரர்:",
      termsAcknowledged: "விதிமுறைகள் ஏற்கப்பட்டன ✓",
      backToOverview: "← முகப்புக்குத் திரும்பு",
      kicker: "சட்டத் தகவல் & தீர்வுகள்",
      title: "நடந்ததை எங்களிடம் கூறுங்கள்.",
      subtitle: "பொருந்தும் சட்டத்தை நாங்கள் கண்டறிவோம்.",
      jurisdictionLabel: "இது எங்கு பொருந்தும்?",
      inputLabel: "என்ன நடந்தது?",
      inputPlaceholder: "உங்கள் நிலைமையை எளிய தமிழில் விவரியுங்கள்...",
      analyzeBtn: "[ வழக்கை பகுப்பாய்வு செய் ]",
      jurisdictionsCovered: "உட்பட்ட அதிகார வரம்புகள்",
      verifiedSources: "சரிபார்க்கப்பட்ட சட்ட மூலங்கள்",
      exampleHeader: "உதாரண வினவல்களுடன் தொடங்குங்கள்",
      useThis: "இதைப் பயன்படுத்து →",
    },
    howItWorksModal: {
      title: "KnowYourRights எவ்வாறு செயல்படுகிறது",
      subtitle: "கணினி கட்டமைப்பு",
      close: "✕ மூடு",
      steps: [
        {
          num: "01",
          title: "நடந்ததை விவரியுங்கள்",
          desc: "உங்கள் வார்த்தைகளில் நிலைமையை விவரியுங்கள். என்ன நடந்தது, எப்போது நடந்தது என்பதை நாங்கள் அடையாளம் காண்கிறோம்.",
        },
        {
          num: "02",
          title: "சட்ட சிக்கலைப் புரிந்து கொள்ளுங்கள்",
          desc: "உங்கள் பிரச்சனை எந்த சட்டப் பிரிவின் கீழ் வருகிறது என்பதை ஆய்வு செய்கிறோம்.",
        },
        {
          num: "03",
          title: "பொருந்தும் சட்டத்தைக் கண்டறியுங்கள்",
          desc: "இந்திய மத்திய மற்றும் மாநில சட்டங்களில் உங்கள் பிரச்சனைக்குரிய விதிகளைத் தேடுகிறோம்.",
        },
        {
          num: "04",
          title: "சட்டம் பொருந்துகிறதா என சரிபாருங்கள்",
          desc: "நீங்கள் வழங்கிய தகவல்களின் அடிப்படையில் சட்ட நிபந்தனைகள் பூர்த்தி செய்யப்படுகின்றனவா என ஆய்வு செய்கிறோம்.",
        },
        {
          num: "05",
          title: "வழக்கு சுருக்கத்தை பெறுங்கள்",
          desc: "பொருந்தும் சட்டங்கள், பிரிவுகள், ஆதாரங்கள் மற்றும் அடுத்த கட்ட நடைமுறைகளை ஒருங்கிணைத்து தெளிவான சுருக்கத்தை வழங்குகிறோம்.",
        },
      ],
    },
    historyModal: {
      title: "வழக்கு விசாரணை வரலாறு",
      subtitle: "உலாவி அமர்வு காப்பகம்",
      close: "✕ மூடு",
      clearAll: "[ வரலாற்றை அழிக்கவும் ]",
      emptyTitle: "இந்த உலாவி அமர்வில் முந்தைய விசாரணைகள் எதுவும் இல்லை.",
      emptyDesc: "தானாக இங்கே சேமிக்க ஒரு சட்டக் கேள்வியை சமர்ப்பிக்கவும்.",
      openBrief: "[ வழக்கை திறக்க → ]",
      delete: "நீக்கு",
    },
    clarification: {
      header: "சட்ட விபரப் பதிவு",
      stamp: "சட்ட விபரப் பதிவு",
      intro: "எந்த சட்டப் பிரிவுகள் பொருந்தும் என்பதைத் தீர்மானிக்க ஒரு கூடுதல் விபரம் தேவைப்படுகிறது.",
      continueBtn: "தொடர்க →",
      skipBtn: "தவிர்க்கவும்",
    },
    loading: {
      activeBadge: "சட்ட பகுப்பாய்வி செயல்படுகிறது",
      heading: "சட்ட நிலைமையை பகுப்பாய்வு செய்கிறது",
      steps: [
        "உண்மைகளை ஆய்வு செய்து சட்ட சிக்கலை அடையாளம் காண்கிறது",
        "மத்திய மற்றும் மாநில சட்டப் பிரிவுகளைத் தேடுகிறது",
        "சட்டப்பூர்வ முன்நிபந்தனைகளை சரிபார்க்கிறது",
        "சட்ட வழிகாட்டல் மற்றும் அடுத்த கட்ட படிகளை உருவாக்குகிறது",
      ],
    },
  },

  hi: {
    nav: {
      history: "इतिहास",
      howItWorks: "यह कैसे काम करता है",
      newQuery: "+ नया प्रश्न",
      translating: "अनुवाद हो रहा है...",
      tagline: "स्थापित · भारतीय वैधानिक अभिलेखागार",
    },
    homepage: {
      systemBadge: "● वैधानिक सूचना प्रणाली",
      archiveBadge: "श्रम एवं आवास मंत्रालय अभिलेखागार",
      jurisdictionBadge: "अधिकार क्षेत्र: तमिलनाडु · महाराष्ट्र · कर्नाटक · केन्द्रीय",
      heroKicker: "श्रमिकों और किरायेदारों के वैधानिक अधिकार",
      heroTitle: "भारतीय कानूनों पर आधारित स्पष्ट एवं सरल विधिक मार्गदर्शन।",
      heroDesc:
        "भारत भर के श्रमिकों और किरायेदारों को केंद्रीय संहिताओं और राज्य कानूनों के तहत कानूनी अधिकार प्राप्त हैं। KnowYourRights आपकी शिकायत को सत्यापित भारतीय कानूनों से मिलाता है, साक्ष्यों का निष्पक्ष मूल्यांकन करता है और आपकी कानूनी प्रक्रिया स्पष्ट करता है।",
      startInquiry: "[ जांच शुरू करें ]",
      howItWorksBtn: "यह कैसे काम करता है ↓",
      pillar1Title: "केंद्रीय एवं राज्य कानून",
      pillar1Sub: "अधिकार क्षेत्र विशिष्ट",
      pillar2Title: "साक्ष्य निष्पक्षता",
      pillar2Sub: "पूर्वापेक्षा सत्यापन",
      pillar3Title: "आधिकारिक कानूनी नोटिस",
      pillar3Sub: "वैधानिक प्रारूपण",
      methodologyKicker: "पद्धति एवं विधिक तर्क",
      methodologyTitle: "KnowYourRights आपकी स्थिति का मूल्यांकन कैसे करता है",
      methodologyDesc:
        "विधिक समस्याएं कोई अमूर्त पहेली नहीं हैं। हम एक संरचित चार-चरणीय मूल्यांकन के माध्यम से आपके विवादों को कानूनी स्थिति में बदलते हैं।",
      stages: [
        {
          num: "§ 1",
          title: "सरल भाषा में शिकायत दर्ज करना",
          desc: "जो हुआ उसे अपने सामान्य शब्दों में बताएं — वेतन रुका हुआ हो, पीएफ जमा न हुआ हो, बिना नोटिस बर्खास्तगी हो, या मकान मालिक सुरक्षा जमा राशि वापस न कर रहा हो।",
        },
        {
          num: "§ 2",
          title: "क्षेत्र-आधारित वैधानिक खोज",
          desc: "श्रम और किरायेदारी समवर्ती सूची में आते हैं। प्रणाली लागू केंद्रीय अधिनियमों को तमिलनाडु, महाराष्ट्र या कर्नाटक के राज्य कानूनों के साथ जोड़ती है।",
        },
        {
          num: "§ 3",
          title: "साक्ष्य पर्याप्तता एवं स्पष्टीकरण",
          desc: "अनुमान लगाने के बजाय, प्रणाली यह जांचती है कि क्या कानूनी शर्तें पूरी होती हैं। यदि महत्वपूर्ण तथ्य गायब हैं, तो यह लक्षित प्रश्न पूछती है।",
        },
        {
          num: "§ 4",
          title: "कार्यवाही योग्य कानूनी प्रक्रिया एवं नोटिस",
          desc: "प्रक्रियात्मक उपचार के बिना अधिकार अधूरे हैं। आपको सक्षम प्राधिकारी, कानूनी समय सीमा, आवश्यक दस्तावेज और तैयार कानूनी नोटिस प्राप्त होता है।",
        },
      ],
      rigorKicker: "संस्थागत सटीकता",
      rigorTitle: "सत्यापित कानूनों पर आधारित, अनुमानों पर नहीं",
      rigorDesc:
        "सामान्य एआई मॉडल अक्सर गलत कानूनी धाराएं उद्धृत करते हैं। KnowYourRights को सख्त वैधानिक सुरक्षा नियमों के साथ तैयार किया गया है।",
      rigorCards: [
        {
          kicker: "[ धारा प्रामाणिकता ]",
          title: "सत्यापित कानूनों पर आधारित",
          desc: "प्रत्येक निष्कर्ष भारतीय वैधानिक अभिलेखागार से वास्तविक अधिनियमों और धाराओं को उद्धृत करता है।",
          footer: "उदा. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ साक्ष्य सत्यता ]",
          title: "अनिश्चितता के प्रति ईमानदार",
          desc: "यदि कानूनी शर्तें अपुष्ट हैं, तो हमारा सिस्टम अनुमान लगाने के बजाय मध्यम या निम्न विश्वास स्कोर देता है।",
          footer: "मूल्यांकन: उच्च · मध्यम · निम्न",
        },
        {
          kicker: "[ राज्य कानून प्राथमिकता ]",
          title: "राज्य क्षेत्राधिकार के प्रति सचेत",
          desc: "संविधान के अनुच्छेद 254 के तहत राज्य कानून केंद्रीय कानूनों को संशोधित करते हैं। बेंगलुरु का विवाद कर्नाटक कानून से हल होगा।",
          footer: "समाधान: केंद्रीय बनाम राज्य वरीयता",
        },
      ],
      entryKicker: "जांच प्रवेश एवं स्वीकृति",
      entryTitle: "अपनी कानूनी जांच शुरू करें",
      entryDesc: "अपना नाम दर्ज करें और वर्कस्पेस में प्रवेश के लिए वैधानिक शर्तों को स्वीकार करें।",
    },
    entryGate: {
      nameLabel: "हम आपको किस नाम से संबोधित करें?",
      nameHint: "केवल आपको संबोधित करने और नोटिस तैयार करने के लिए उपयोग किया जाता है। कभी साझा नहीं किया जाता।",
      termsHeading: "वैधानिक अनुसंधान एवं अनाधिवक्ता स्वीकृति",
      termsText:
        "मैं समझता हूं कि KnowYourRights भारतीय कानून के आधार पर कानूनी जानकारी प्रदान करता है, न कि व्यक्तिगत कानूनी सलाह या अधिवक्ता प्रतिनिधित्व।",
      proceedBtn: "जांच आगे बढ़ाएं",
      termsWarning: "* आगे बढ़ने के लिए कृपया ऊपर दिए गए स्वीकृति बॉक्स को चेक करें।",
    },
    workspace: {
      statusKicker: "जांच वर्कस्पेस",
      applicantLabel: "आवेदक:",
      termsAcknowledged: "शर्तें स्वीकृत ✓",
      backToOverview: "← मुख्य पृष्ठ पर वापस जाएं",
      kicker: "विधिक जानकारी एवं उपचार",
      title: "बताएं क्या हुआ।",
      subtitle: "हम कानून ढूंढेंगे।",
      jurisdictionLabel: "यह मामला कहाँ लागू होता है?",
      inputLabel: "क्या हुआ था?",
      inputPlaceholder: "अपनी स्थिति सरल हिंदी में बताएं...",
      analyzeBtn: "[ मामले का विश्लेषण करें ]",
      jurisdictionsCovered: "शामिल अधिकार क्षेत्र",
      verifiedSources: "सत्यापित विधिक स्रोत",
      exampleHeader: "उदाहरण से शुरू करें",
      useThis: "इसका उपयोग करें →",
    },
    howItWorksModal: {
      title: "KnowYourRights कैसे काम करता है",
      subtitle: "सिस्टम संरचना",
      close: "✕ बंद करें",
      steps: [
        {
          num: "01",
          title: "बताएं क्या हुआ",
          desc: "अपनी स्थिति सरल शब्दों में बताएं। हम महत्वपूर्ण विवरण जैसे घटना और दावे की पहचान करते हैं।",
        },
        {
          num: "02",
          title: "कानूनी मुद्दे को समझें",
          desc: "हम पहचानते हैं कि आप किस प्रकार की कानूनी समस्या का सामना कर रहे हैं।",
        },
        {
          num: "03",
          title: "संबंधित कानून खोजें",
          desc: "हम उन भारतीय व राज्य कानूनों को खोजते हैं जो आपकी स्थिति पर लागू होते हैं।",
        },
        {
          num: "04",
          title: "जांचें कि क्या कानून लागू होता है",
          desc: "हम तथ्यों के आधार पर कानूनी आवश्यकताओं का परीक्षण करते हैं।",
        },
        {
          num: "05",
          title: "मामले का सारांश प्राप्त करें",
          desc: "हम प्रासंगिक कानूनों, धाराओं, साक्ष्यों और व्यावहारिक कदमों को एक स्पष्ट सारांश में जोड़ते हैं।",
        },
      ],
    },
    historyModal: {
      title: "मामला पूछताछ इतिहास",
      subtitle: "ब्राउज़र सत्र अभिलेखागार",
      close: "✕ बंद करें",
      clearAll: "[ सारा इतिहास हटाएं ]",
      emptyTitle: "इस ब्राउज़र सत्र में अभी तक कोई पूछताछ दर्ज नहीं है।",
      emptyDesc: "स्वचालित रूप से सहेजने के लिए कोई कानूनी प्रश्न दर्ज करें।",
      openBrief: "[ केस विवरण खोलें → ]",
      delete: "हटाएं",
    },
    clarification: {
      header: "वैधानिक विवरण प्रविष्टि",
      stamp: "वैधानिक विवरण प्रविष्टि",
      intro: "यह निर्धारित करने के लिए एक तथ्य की आवश्यकता है कि कौन से प्रावधान लागू होते हैं।",
      continueBtn: "आगे बढ़ें →",
      skipBtn: "छोड़ें",
    },
    loading: {
      activeBadge: "वैधानिक इंजन सक्रिय",
      heading: "कानूनी स्थिति का विश्लेषण जारी है",
      steps: [
        "तथ्यों का विश्लेषण और कानूनी मुद्दे की पहचान",
        "प्रासंगिक भारतीय और राज्य कानूनों की खोज",
        "आपके तथ्यों के आधार पर कानूनी शर्तों का सत्यापन",
        "वैधानिक मार्गदर्शन और कानूनी कदमों का निर्माण",
      ],
    },
  },

  te: {
    nav: {
      history: "చరిత్ర",
      howItWorks: "ఇది ఎలా పనిచేస్తుంది",
      newQuery: "+ కొత్త ప్రశ్న",
      translating: "అనువదిస్తోంది...",
      tagline: "స్థాపించబడింది · భారత చట్టబద్ధమైన ఆర్కైవ్",
    },
    homepage: {
      systemBadge: "● చట్టబద్ధమైన సమాచార వ్యవస్థ",
      archiveBadge: "కార్మిక & గృహనిర్మాణ మంత్రిత్వ శాఖ ఆర్కైవ్",
      jurisdictionBadge: "పరిధి: తమిళనాడు · మహారాష్ట్ర · కర్ణాటక · కేంద్రం",
      heroKicker: "కార్మికులు & అద్దెదారుల చట్టబద్ధమైన హక్కులు",
      heroTitle: "భారత చట్టాల ఆధారంగా స్పష్టమైన మరియు సులభమైన న్యాయ మార్గదర్శనం.",
      heroDesc:
        "భారతదేశ వ్యాప్తంగా ఉన్న కార్మికులు మరియు అద్దెదారులకు చట్టబద్ధమైన హక్కులు ఉన్నాయి. KnowYourRights మీ సమస్యను ధృవీకరించబడిన భారతీయ చట్టాలతో సరిపోల్చి, సాక్ష్యాలను నిష్పాక్షికంగా విశ్లేషించి, తదుపరి చట్టపరమైన మార్గాన్ని వివరిస్తుంది.",
      startInquiry: "[ విచారణ ప్రారంభించండి ]",
      howItWorksBtn: "ఇది ఎలా పనిచేస్తుంది ↓",
      pillar1Title: "కేంద్ర & రాష్ట్ర చట్టాలు",
      pillar1Sub: "పరిధి ఆధారితం",
      pillar2Title: "సాక్ష్యాల ప్రామాణికత",
      pillar2Sub: "నిబంధనల తనిఖీ",
      pillar3Title: "అధికారిక లీగల్ నోటీసు",
      pillar3Sub: "చట్టబద్ధమైన ముసాయిదా",
      methodologyKicker: "విధానం & న్యాయ విశ్లేషణ",
      methodologyTitle: "KnowYourRights మీ పరిస్థితిని ఎలా అంచనా వేస్తుంది",
      methodologyDesc:
        "చట్టపరమైన సమస్యలు సంక్లిష్టమైనవి కావు. నిర్మాణాత్మకమైన నాలుగు దశల మూల్యాంకనం ద్వారా మీ రోజువారీ వివాదాలను చట్టబద్ధమైన పరిష్కారాలుగా మారుస్తాము.",
      stages: [
        {
          num: "§ 1",
          title: "సాధారణ భాషలో ఫిర్యాదు నమోదు",
          desc: "జీతం నిలిపివేయబడినా, పీఎఫ్ జమ కాకపోయినా, నోటీసు లేకుండా తొలగించినా, లేదా యజమాని సెక్యూరిటీ డిపాజిట్ తిరిగి ఇవ్వకపోయినా సాధారణ మాటల్లో వివరించండి.",
        },
        {
          num: "§ 2",
          title: "పరిధి ఆధారిత చట్టాల శోధన",
          desc: "కార్మిక మరియు అద్దె చట్టాలు కేంద్ర, రాష్ట్ర ఉమ్మడి పరిధిలోకి వస్తాయి. కేంద్ర చట్టాలతో పాటు తమిళనాడు, మహారాష్ట్ర లేదా కర్ణాటక రాష్ట్ర చట్టాలను సమన్వయం చేస్తాము.",
        },
        {
          num: "§ 3",
          title: "సాక్ష్యాల సరిపోలిక & స్పష్టత",
          desc: "అంచనాలు వేయకుండా చట్టబద్ధమైన నిబంధనలు పూర్తయ్యాయో లేదో తనిఖీ చేస్తాము. అదనపు వివరాలు అవసరమైతే స్పష్టమైన ప్రశ్నలను అడుగుతాము.",
        },
        {
          num: "§ 4",
          title: "చట్టపరమైన పరిష్కారం & నోటీసు ముసాయిదా",
          desc: "పరిష్కారం లేని హక్కులు నిరుపయోగం. సంప్రదించాల్సిన అధికారి, కాలపరిమితి, అవసరమైన పత్రాలు మరియు సిద్ధంగా ఉన్న లీగల్ నోటీసును అందిస్తాము.",
        },
      ],
      rigorKicker: "సంస్థాగత ఖచ్చితత్వం",
      rigorTitle: "ఊహల ఆధారంగా కాకుండా ధృవీకరించబడిన చట్టాల ఆధారంగా రూపొందించబడింది",
      rigorDesc:
        "సాధారణ AI నమూనాలు తప్పుడు చట్టాలను ఉటంకిస్తాయి. KnowYourRights కఠినమైన చట్టపరమైన రక్షణలతో నిర్మించబడింది.",
      rigorCards: [
        {
          kicker: "[ చట్ట నిబంధనల ఖచ్చితత్వం ]",
          title: "ధృవీకరించబడిన చట్టాలపై ఆధారపడింది",
          desc: "ప్రతి ముగింపు వాస్తవ భారతీయ చట్టాలు మరియు విభాగాలను మాత్రమే ఉటంకిస్తుంది.",
          footer: "ఉదా. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ సాక్ష్యాల సమగ్రత ]",
          title: "నిష్పాక్షిక అంచనా",
          desc: "చట్టపరమైన నిబంధనలు అసంపూర్తిగా ఉంటే, ఊహించకుండా మా వ్యవస్థ మధ్యస్థ లేదా తక్కువ స్కోరును ఇస్తుంది.",
          footer: "అంచనా: అధిక · మధ్యస్థ · తక్కువ",
        },
        {
          kicker: "[ రాష్ట్ర చట్టాల ప్రాధాన్యత ]",
          title: "రాష్ట్ర పరిధిపై అవగాహన",
          desc: "రాజ్యాంగంలోని అధికరణ 254 ప్రకారం రాష్ట్ర చట్టాలకు ప్రాధాన్యత ఉంటుంది. బెంగళూరు అద్దె వివాదానికి కర్ణాటక చట్టమే వర్తిస్తుంది.",
          footer: "పరిష్కారం: కేంద్ర vs రాష్ట్ర ప్రాధాన్యత",
        },
      ],
      entryKicker: "విచారణ ప్రవేశం & అంగీకారం",
      entryTitle: "మీ చట్టపరమైన విచారణను ప్రారంభించండి",
      entryDesc: "మీ పేరును నమోదు చేసి, విచారణ ప్రదేశంలోకి ప్రవేశించడానికి చట్టపరమైన నిబంధనలను అంగీకరించండి.",
    },
    entryGate: {
      nameLabel: "మిమ్మల్ని ఏ పేరుతో సంబోధించాలి?",
      nameHint: "మిమ్మల్ని సంబోధించడానికి మరియు నోటీసు తయారు చేయడానికి మాత్రమే ఉపయోగించబడుతుంది.",
      termsHeading: "చట్టబద్ధమైన సమాచార & ప్రాతినిధ్య రహిత అంగీకారం",
      termsText:
        "KnowYourRights భారత చట్టాల ఆధారంగా చట్టపరమైన సమాచారం మరియు మార్గదర్శకత్వాన్ని మాత్రమే అందిస్తుందని, ఇది న్యాయవాది సలహా కాదని నేను అర్థం చేసుకున్నాను.",
      proceedBtn: "విచారణకు వెళ్లండి",
      termsWarning: "* కొనసాగడానికి దయచేసి పైన ఉన్న అంగీకార పెట్టెను ఎంచుకోండి.",
    },
    workspace: {
      statusKicker: "విచారణ స్థలం",
      applicantLabel: "దరఖాస్తుదారు:",
      termsAcknowledged: "నిబంధనలు అంగీకరించబడ్డాయి ✓",
      backToOverview: "← హోమ్‌కు తిరిగి వెళ్లండి",
      kicker: "చట్టపరమైన సమాచారం & పరిష్కారాలు",
      title: "ఏమి జరిగిందో మాకు చెప్పండి.",
      subtitle: "మేము వర్తించే చట్టాన్ని కనుగొంటాము.",
      jurisdictionLabel: "ఇది ఎక్కడ వర్తిస్తుంది?",
      inputLabel: "ఏమి జరిగింది?",
      inputPlaceholder: "మీ పరిస్థితిని సాధారణ తెలుగులో వివరించండి...",
      analyzeBtn: "[ కేసును విశ్లేషించండి ]",
      jurisdictionsCovered: "కవర్ చేయబడిన అధికార పరిధులు",
      verifiedSources: "ధృవీకరించబడిన చట్టపరమైన వనరులు",
      exampleHeader: "ఉదాహరణ ప్రశ్నలతో ప్రారంభించండి",
      useThis: "దీన్ని ఉపయోగించండి →",
    },
    howItWorksModal: {
      title: "KnowYourRights ఎలా పనిచేస్తుంది",
      subtitle: "సిస్టమ్ నిర్మాణం",
      close: "✕ మూసివేయి",
      steps: [
        {
          num: "01",
          title: "ఏమి జరిగిందో చెప్పండి",
          desc: "మీ మాటల్లో పరిస్థితిని వివరించండి. ఏమి జరిగింది, ఎప్పుడు జరిగిందో మేము గుర్తిస్తాము.",
        },
        {
          num: "02",
          title: "చట్టపరమైన సమస్యను అర్థం చేసుకోండి",
          desc: "మీరు ఎలాంటి చట్టపరమైన సమస్యను ఎదుర్కొంటున్నారో మేము గుర్తిస్తాము.",
        },
        {
          num: "03",
          title: "వర్తించే చట్టాన్ని కనుగొనండి",
          desc: "మీ పరిస్థితికి వర్తించే భారతీయ మరియు రాష్ట్ర చట్టాలను శోధిస్తాము.",
        },
        {
          num: "04",
          title: "చట్టం వర్తిస్తుందో లేదో తనిఖీ చేయండి",
          desc: "మీ వివరాల ఆధారంగా చట్టపరమైన అవసరాలను పరీక్షిస్తాము.",
        },
        {
          num: "05",
          title: "కేసు సారాంశాన్ని పొందండి",
          desc: "చట్టాలు, విభాగాలు, సాక్ష్యాలు మరియు తదుపరి దశలను స్పష్టమైన సారాంశంగా అందిస్తాము.",
        },
      ],
    },
    historyModal: {
      title: "కేసు విచారణ చరిత్ర",
      subtitle: "బ్రౌజర్ సెషన్ ఆర్కైవ్",
      close: "✕ మూసివేయి",
      clearAll: "[ చరిత్రను క్లియర్ చేయండి ]",
      emptyTitle: "ఈ బ్రౌజర్ సెషన్‌లో ఇంకా ఎలాంటి విచారణలు నమోదు కాలేదు.",
      emptyDesc: "ఆటోమేటిక్‌గా ఇక్కడ సేవ్ కావడానికి చట్టపరమైన ప్రశ్నను సమర్పించండి.",
      openBrief: "[ కేసు వివరాలను తెరవండి → ]",
      delete: "తొలగించు",
    },
    clarification: {
      header: "చట్టబద్ధమైన వివరాల నమోదు",
      stamp: "చట్టబద్ధమైన వివరాల నమోదు",
      intro: "ఏ చట్టపరమైన నిబంధనలు వర్తిస్తాయో నిర్ణయించడానికి ఒక అదనపు వాస్తవం అవసరం.",
      continueBtn: "కొనసాగించండి →",
      skipBtn: "దాటవేయి",
    },
    loading: {
      activeBadge: "చట్టపరమైన ఇంజిన్ సక్రియంగా ఉంది",
      heading: "చట్టపరమైన పరిస్థితిని విశ్లేషిస్తోంది",
      steps: [
        "వాస్తవాలను విశ్లేషించి చట్టపరమైన సమస్యను గుర్తించడం",
        "సంబంధిత భారతీయ మరియు రాష్ట్ర చట్టాలను శోధించడం",
        "మీ వాస్తవాల ఆధారంగా చట్టపరమైన నిబంధనలను ధృవీకరించడం",
        "చట్టబద్ధమైన మార్గదర్శకత్వం మరియు చర్యలను రూపొందించడం",
      ],
    },
  },

  kn: {
    nav: {
      history: "ಇತಿಹಾಸ",
      howItWorks: "ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
      newQuery: "+ ಹೊಸ ಪ್ರಶ್ನೆ",
      translating: "ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ...",
      tagline: "ಸ್ಥಾಪನೆ · ಭಾರತೀಯ ಶಾಸನಬದ್ಧ ದಾಖಲೆಗಳು",
    },
    homepage: {
      systemBadge: "● ಶಾಸನಬದ್ಧ ಮಾಹಿತಿ ವ್ಯವಸ್ಥೆ",
      archiveBadge: "ಕಾರ್ಮಿಕ ಮತ್ತು ವಸತಿ ಸಚಿವಾಲಯದ ದಾಖಲೆಗಳು",
      jurisdictionBadge: "ವ್ಯಾಪ್ತಿ: ತಮಿಳುನಾಡು · ಮಹಾರಾಷ್ಟ್ರ · ಕರ್ನಾಟಕ · ಕೇಂದ್ರ",
      heroKicker: "ಕಾರ್ಮಿಕರು ಮತ್ತು ಬಾಡಿಗೆದಾರರ ಶಾಸನಬದ್ಧ ಹಕ್ಕುಗಳು",
      heroTitle: "ಭಾರತೀಯ ಶಾಸನಗಳ ಆಧಾರದ ಮೇಲೆ ಸ್ಪಷ್ಟ ಕಾನೂನು ಮಾರ್ಗದರ್ಶನ.",
      heroDesc:
        "ಕಾರ್ಮಿಕರು ಮತ್ತು ಬಾಡಿಗೆದಾರರಿಗೆ ಕಾನೂನುಬದ್ಧ ಹಕ್ಕುಗಳಿವೆ. KnowYourRights ನಿಮ್ಮ ದೂರನ್ನು ಪರಿಶೀಲಿಸಿದ ಕಾನೂನುಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ, ಸಾಕ್ಷ್ಯಗಳನ್ನು ನಿಷ್ಪಕ್ಷಪಾತವಾಗಿ ಪರಿಶೀಲಿಸಿ, ನಿಮ್ಮ ಮುಂದಿನ ಕಾನೂನು ಹಂತಗಳನ್ನು ಸ್ಪಷ್ಟಪಡಿಸುತ್ತದೆ.",
      startInquiry: "[ ವಿಚಾರಣೆ ಪ್ರಾರಂಭಿಸಿ ]",
      howItWorksBtn: "ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ↓",
      pillar1Title: "ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ",
      pillar1Sub: "ವ್ಯಾಪ್ತಿ-ನಿರ್ದಿಷ್ಟ",
      pillar2Title: "ಸಾಕ್ಷ್ಯ ಪ್ರಾಮಾಣಿಕತೆ",
      pillar2Sub: "ಷರತ್ತುಗಳ ಪರಿಶೀಲನೆ",
      pillar3Title: "ಅಧಿಕೃತ ನೋಟಿಸ್",
      pillar3Sub: "ಶಾಸನಬದ್ಧ ಕರಡು",
      methodologyKicker: "ವಿಧಾನ ಮತ್ತು ತಾರ್ಕಿಕತೆ",
      methodologyTitle: "KnowYourRights ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಹೇಗೆ ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತದೆ",
      methodologyDesc:
        "ನಾಲ್ಕು ಹಂತಗಳ ರಚನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನದ ಮೂಲಕ ನಿಮ್ಮ ದೈನಂದಿನ ವಿವಾದಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದಾದ ಶಾಸನಬದ್ಧ ಸ್ಥಾನಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತೇವೆ.",
      stages: [
        {
          num: "§ 1",
          title: "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ದೂರು ಸಲ್ಲಿಕೆ",
          desc: "ವೇತನ ತಡೆಹಿಡಿಯಲಾಗಿದೆಯೇ, ಪಿಎಫ್ ಜಮೆಯಾಗಿಲ್ಲವೇ, ನೋಟಿಸ್ ಇಲ್ಲದೆ ವಜಾಗೊಳಿಸಲಾಗಿದೆಯೇ, ಅಥವಾ ಬಾಡಿಗೆ ಮುಂಗಡವನ್ನು ಹಿಂದಿರುಗಿಸಲು ಮಾಲೀಕರು ನಿರಾಕರಿಸುತ್ತಿದ್ದಾರೆಯೇ ಎಂಬುದನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ.",
        },
        {
          num: "§ 2",
          title: "ವ್ಯಾಪ್ತಿ-ಆಧಾರಿತ ಶಾಸನಬದ್ಧ ಹುಡುಕಾಟ",
          desc: "ಕಾರ್ಮಿಕ ಮತ್ತು ಬಾಡಿಗೆ ವಿಷಯಗಳು ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ವ್ಯಾಪ್ತಿಗೆ ಬರುತ್ತವೆ. ಕೇಂದ್ರ ಕಾನೂನುಗಳ ಜೊತೆಗೆ ಕರ್ನಾಟಕ, ತಮಿಳುನಾಡು ಅಥವಾ ಮಹಾರಾಷ್ಟ್ರ ರಾಜ್ಯ ಕಾನೂನುಗಳನ್ನು ಸಂಯೋಜಿಸುತ್ತೇವೆ.",
        },
        {
          num: "§ 3",
          title: "ಸಾಕ್ಷ್ಯ ಸಮರ್ಪಕತೆ ಮತ್ತು ಸ್ಪಷ್ಟೀಕರಣ",
          desc: "ಊಹಿಸುವ ಬದಲು, ಶಾಸನಬದ್ಧ ಷರತ್ತುಗಳು ಪೂರೈಸಲ್ಪಟ್ಟಿವೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸುತ್ತೇವೆ. ಅಗತ್ಯವಿದ್ದರೆ ಸ್ಪಷ್ಟ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ಸ್ಪಷ್ಟಪಡಿಸುತ್ತೇವೆ.",
        },
        {
          num: "§ 4",
          title: "ಕಾನೂನು ಪರಿಹಾರ ಮತ್ತು ನೋಟಿಸ್ ಕರಡು",
          desc: "ಸಂಪರ್ಕಿಸಬೇಕಾದ ಪ್ರಾಧಿಕಾರ, ಕಾಲಮಿತಿ, ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು ಮತ್ತು ಸಿದ್ಧ ಕಾನೂನು ನೋಟಿಸ್ ಅನ್ನು ನಾವು ಒದಗಿಸುತ್ತೇವೆ.",
        },
      ],
      rigorKicker: "ಸಂಸ್ಥಾಗತ ನಿಖರತೆ",
      rigorTitle: "ಊಹೆಗಳ ಮೇಲಲ್ಲ, ಶಾಸನಬದ್ಧ ನಿಖರತೆಯ ಮೇಲೆ ನಿರ್ಮಿಸಲಾಗಿದೆ",
      rigorDesc:
        "ಸಾಮಾನ್ಯ AI ತಪ್ಪು ಕಾನೂನುಗಳನ್ನು ಉಲ್ಲೇಖಿಸಬಹುದು. KnowYourRights ಕಟ್ಟುನಿಟ್ಟಾದ ಕಾನೂನು ಸುರಕ್ಷತೆಗಳೊಂದಿಗೆ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
      rigorCards: [
        {
          kicker: "[ ಉಲ್ಲೇಖ ನಿಷ್ಠೆ ]",
          title: "ಪರಿಶೀಲಿಸಿದ ಕಾನೂನುಗಳ ಆಧಾರ",
          desc: "ಪ್ರತಿ ತೀರ್ಮಾನವು ವಾಸ್ತವಿಕ ಭಾರತೀಯ ಶಾಸನಗಳನ್ನು ಮಾತ್ರ ಉಲ್ಲೇಖಿಸುತ್ತದೆ.",
          footer: "ಉದಾ. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ ಸಾಕ್ಷ್ಯ ಸಮಗ್ರತೆ ]",
          title: "ಪ್ರಾಮಾಣಿಕ ಮೌಲ್ಯಮಾಪನ",
          desc: "ಷರತ್ತುಗಳು ಅಪೂರ್ಣವಾಗಿದ್ದರೆ, ಊಹಿಸದೆ ಮಧ್ಯಮ ಅಥವಾ ಕಡಿಮೆ ಸ್ಕೋರ್ ನೀಡಲಾಗುತ್ತದೆ.",
          footer: "ಮೌಲ್ಯಮಾಪನ: ಉನ್ನತ · ಮಧ್ಯಮ · ಕಡಿಮೆ",
        },
        {
          kicker: "[ ರಾಜ್ಯ ಕಾನೂನು ಆದ್ಯತೆ ]",
          title: "ರಾಜ್ಯ ವ್ಯಾಪ್ತಿಯ ಅರಿವು",
          desc: "ಸಂವಿಧಾನದ 254 ನೇ ವಿಧಿಯ ಅಡಿಯಲ್ಲಿ ರಾಜ್ಯ ಕಾನೂನುಗಳಿಗೆ ಆದ್ಯತೆ ಇರುತ್ತದೆ.",
          footer: "ಪರಿಹಾರ: ಕೇಂದ್ರ vs ರಾಜ್ಯ ಆದ್ಯತೆ",
        },
      ],
      entryKicker: "ವಿಚಾರಣೆ ಪ್ರವೇಶ ಮತ್ತು ಒಪ್ಪಿಗೆ",
      entryTitle: "ನಿಮ್ಮ ಕಾನೂನು ವಿಚಾರಣೆ ಪ್ರಾರಂಭಿಸಿ",
      entryDesc: "ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ನಿಯಮಗಳನ್ನು ಒಪ್ಪಿಕೊಂಡು ವಿಚಾರಣೆ ಸ್ಥಳಕ್ಕೆ ಪ್ರವೇಶಿಸಿ.",
    },
    entryGate: {
      nameLabel: "ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಬೇಕು?",
      nameHint: "ನಿಮ್ಮನ್ನು ಸಂಬೋಧಿಸಲು ಮತ್ತು ನೋಟಿಸ್ ಸಿದ್ಧಪಡಿಸಲು ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ.",
      termsHeading: "ಶಾಸನಬದ್ಧ ಸಂಶೋಧನೆ ಮತ್ತು ಪ್ರಾತಿನಿಧ್ಯ ರಹಿತ ಒಪ್ಪಿಗೆ",
      termsText:
        "KnowYourRights ಭಾರತೀಯ ಕಾನೂನಿನ ಆಧಾರದ ಮೇಲೆ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನೀಡುತ್ತದೆ, ಇದು ವಕೀಲರ ಸಲಹೆಯಲ್ಲ ಎಂಬುದನ್ನು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ.",
      proceedBtn: "ವಿಚಾರಣೆಗೆ ಮುಂದುವರಿಯಿರಿ",
      termsWarning: "* ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ಮೇಲಿನ ಒಪ್ಪಿಗೆ ಪೆಟ್ಟಿಗೆಯನ್ನು ಗುರುತಿಸಿ.",
    },
    workspace: {
      statusKicker: "ವಿಚಾರಣಾ ಕಾರ್ಯಸ್ಥಳ",
      applicantLabel: "ಅರ್ಜಿದಾರರು:",
      termsAcknowledged: "ನಿಯಮಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಲಾಗಿದೆ ✓",
      backToOverview: "← ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
      kicker: "ಕಾನೂನು ಮಾಹಿತಿ ಮತ್ತು ಪರಿಹಾರ",
      title: "ಏನಾಯಿತು ಎಂದು ನಮಗೆ ತಿಳಿಸಿ.",
      subtitle: "ನಾವು ಅನ್ವಯವಾಗುವ ಕಾನೂನನ್ನು ಕಂಡುಕೊಳ್ಳುತ್ತೇವೆ.",
      jurisdictionLabel: "ಇದು ಎಲ್ಲಿ ಅನ್ವಯಿಸುತ್ತದೆ?",
      inputLabel: "ಏನಾಯಿತು?",
      inputPlaceholder: "ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಸರಳ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ...",
      analyzeBtn: "[ ಪ್ರಕರಣವನ್ನು ವಿಶ್ಲೇಷಿಸಿ ]",
      jurisdictionsCovered: "ಒಳಪಟ್ಟ ವ್ಯಾಪ್ತಿಗಳು",
      verifiedSources: "ಪರಿಶೀಲಿಸಿದ ಕಾನೂನು ಮೂಲಗಳು",
      exampleHeader: "ಉದಾಹರಣೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ",
      useThis: "ಇದನ್ನು ಬಳಸಿ →",
    },
    howItWorksModal: {
      title: "KnowYourRights ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
      subtitle: "ವ್ಯವಸ್ಥೆಯ ವಾಸ್ತುಶಿಲ್ಪ",
      close: "✕ ಮುಚ್ಚಿ",
      steps: [
        {
          num: "01",
          title: "ಏನಾಯಿತು ಎಂದು ತಿಳಿಸಿ",
          desc: "ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ವಿವರಿಸಿ. ನಾವು ಪ್ರಮುಖ ವಿವರಗಳನ್ನು ಗುರುತಿಸುತ್ತೇವೆ.",
        },
        {
          num: "02",
          title: "ಕಾನೂನು ಸಮಸ್ಯೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ",
          desc: "ಯಾವ ರೀತಿಯ ಕಾನೂನು ಸಮಸ್ಯೆ ಎದುರಾಗಿದೆ ಎಂಬುದನ್ನು ನಾವು ಗುರುತಿಸುತ್ತೇವೆ.",
        },
        {
          num: "03",
          title: "ಸಂಬಂಧಿತ ಕಾನೂನನ್ನು ಹುಡುಕಿ",
          desc: "ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಗೆ ಅನ್ವಯವಾಗುವ ಭಾರತೀಯ ಮತ್ತು ರಾಜ್ಯ ಕಾನೂನುಗಳನ್ನು ಹುಡುಕುತ್ತೇವೆ.",
        },
        {
          num: "04",
          title: "ಕಾನೂನು ಹೊಂದಾಣಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ",
          desc: "ವಾಸ್ತವಾಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಕಾನೂನು ಅಗತ್ಯತೆಗಳನ್ನು ಪರೀಕ್ಷಿಸುತ್ತೇವೆ.",
        },
        {
          num: "05",
          title: "ಪ್ರಕರಣದ ಸಾರಾಂಶ ಪಡೆಯಿರಿ",
          desc: "ಕಾನೂನುಗಳು, ವಿಭಾಗಗಳು ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳನ್ನು ಸ್ಪಷ್ಟ ಸಾರಾಂಶದಲ್ಲಿ ಒದಗಿಸುತ್ತೇವೆ.",
        },
      ],
    },
    historyModal: {
      title: "ಪ್ರಕರಣ ವಿಚಾರಣೆ ಇತಿಹಾಸ",
      subtitle: "ಬ್ರೌಸರ್ ಸೆಷನ್ ದಾಖಲೆ",
      close: "✕ ಮುಚ್ಚಿ",
      clearAll: "[ ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ ]",
      emptyTitle: "ಈ ಬ್ರೌಸರ್ ಸೆಷನ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ವಿಚಾರಣೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
      emptyDesc: "ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಉಳಿಸಲು ಕಾನೂನು ಪ್ರಶ್ನೆಯನ್ನು ಸಲ್ಲಿಸಿ.",
      openBrief: "[ ಪ್ರಕರಣವನ್ನು ತೆರೆಯಿರಿ → ]",
      delete: "ಅಳಿಸಿ",
    },
    clarification: {
      header: "ಶಾಸನಬದ್ಧ ಮಾಹಿತಿ ದಾಖಲು",
      stamp: "ಶಾಸನಬದ್ಧ ಮಾಹಿತಿ ದಾಖಲು",
      intro: "ಯಾವ ನಿಬಂಧನೆಗಳು ಅನ್ವಯಿಸುತ್ತವೆ ಎಂದು ನಿರ್ಧರಿಸಲು ಒಂದು ಹೆಚ್ಚುವರಿ ವಿವರ ಬೇಕಾಗಿದೆ.",
      continueBtn: "ಮುಂದುವರಿಯಿರಿ →",
      skipBtn: "ಬಿಟ್ಟುಬಿಡಿ",
    },
    loading: {
      activeBadge: "ಶಾಸನಬದ್ಧ ಎಂಜಿನ್ ಸಕ್ರಿಯವಾಗಿದೆ",
      heading: "ಕಾನೂನು ಪರಿಸ್ಥಿತಿಯ ವಿಶ್ಲೇಷಣೆ ನಡೆಯುತ್ತಿದೆ",
      steps: [
        "ವಾಸ್ತವಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಕಾನೂನು ಸಮಸ್ಯೆಯನ್ನು ಗುರುತಿಸುವುದು",
        "ಸಂಬಂಧಿತ ಭಾರತೀಯ ಮತ್ತು ರಾಜ್ಯ ಕಾನೂನುಗಳನ್ನು ಹುಡುಕುವುದು",
        "ಶಾಸನಬದ್ಧ ಷರತ್ತುಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದು",
        "ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳನ್ನು ಸಂಶ್ಲೇಷಿಸುವುದು",
      ],
    },
  },

  mr: {
    nav: {
      history: "इतिहास",
      howItWorks: "हे कसे कार्य करते",
      newQuery: "+ नवीन प्रश्न",
      translating: "भाषांतर होत आहे...",
      tagline: "स्थापित · भारतीय वैधानिक अभिलेखागार",
    },
    homepage: {
      systemBadge: "● वैधानिक माहिती प्रणाली",
      archiveBadge: "कामगार आणि गृहनिर्माण मंत्रालय अभिलेखागार",
      jurisdictionBadge: "अधिकारक्षेत्र: महाराष्ट्र · तामिळनाडू · कर्नाटक · केंद्रीय",
      heroKicker: "कामगार आणि भाडेकरूंचे वैधानिक अधिकार",
      heroTitle: "भारतीय कायद्यांवर आधारित स्पष्ट आणि सुलभ कायदेशीर मार्गदर्शन.",
      heroDesc:
        "कामगार आणि भाडेकरूंना केंद्रीय आणि राज्य कायद्यांतर्गत कायदेशीर अधिकार आहेत. KnowYourRights तुमची तक्रार सत्यापित भारतीय कायद्यांशी जुळवून घेते, पुराव्यांचे प्रामाणिकपणे मूल्यमापन करते आणि कायदेशीर मार्ग स्पष्ट करते.",
      startInquiry: "[ चौकशी सुरू करा ]",
      howItWorksBtn: "हे कसे कार्य करते ↓",
      pillar1Title: "केंद्रीय आणि राज्य",
      pillar1Sub: "अधिकारक्षेत्र-विशिष्ट",
      pillar2Title: "पुरावा प्रामाणिकपणा",
      pillar2Sub: "अटींची पडताळणी",
      pillar3Title: "अधिकृत कायदेशीर नोटीस",
      pillar3Sub: "वैधानिक मसुदा",
      methodologyKicker: "पद्धती आणि कायदेशीर तर्क",
      methodologyTitle: "KnowYourRights तुमच्या परिस्थितीचे मूल्यांकन कसे करते",
      methodologyDesc:
        "कायदेशीर समस्या अमूर्त कोडी नाहीत. आम्ही चार टप्प्यांच्या संरचित मूल्यांकनाद्वारे तुमच्या दैनंदिन विवादांना कायदेशीर स्थितीत रूपांतरित करतो.",
      stages: [
        {
          num: "§ 1",
          title: "सोप्या भाषेत तक्रार नोंदणी",
          desc: "पगार रोखला गेला असेल, पीएफ जमा झाला नसेल, नोटीसशिवाय कामावरून काढले असेल किंवा घरमालक अनामत रक्कम परत करत नसेल तर साध्या भाषेत सांगा.",
        },
        {
          num: "§ 2",
          title: "अधिकारक्षेत्र-आधारित कायदेशीर शोध",
          desc: "कामगार आणि भाडेकरू कायदे समवर्ती कक्षेत येतात. आम्ही केंद्रीय कायद्यांसह महाराष्ट्र, तामिळनाडू किंवा कर्नाटकच्या राज्य कायद्यांचा समन्वय साधतो.",
        },
        {
          num: "§ 3",
          title: "पुरावा पुरेसेपणा आणि स्पष्टीकरण",
          desc: "अंदाज लावण्याऐवजी, कायदेशीर अटी पूर्ण झाल्या आहेत का ते तपासतो. महत्त्वाचे तपशील आवश्यक असल्यास प्रश्न विचारून स्पष्ट करतो.",
        },
        {
          num: "§ 4",
          title: "कायदेशीर प्रक्रिया आणि नोटीस मसुदा",
          desc: "अधिकार केवळ कागदावर राहू नयेत म्हणून सक्षम अधिकारी, कालमर्यादा, आवश्यक कागदपत्रे आणि तयार कायदेशीर नोटीस प्रदान करतो.",
        },
      ],
      rigorKicker: "संस्थात्मक अचूकता",
      rigorTitle: "अंदाजांवर नव्हे, तर वैधानिक अचूकतेवर आधारित",
      rigorDesc:
        "सामान्य AI मॉडेल्स अनेकदा चुकीचे कायदे उद्धृत करतात. KnowYourRights कठोर कायदेशीर सुरक्षेसह तयार केले गेले आहे.",
      rigorCards: [
        {
          kicker: "[ कलम अचूकता ]",
          title: "सत्यापित कायद्यांवर आधारित",
          desc: "प्रत्येक निष्कर्ष भारतीय वैधानिक अभिलेखागारातील वास्तविक कायदे आणि कलमांवर आधारित असतो.",
          footer: "उदा. Payment of Wages Act § 15(2)",
        },
        {
          kicker: "[ पुरावा सत्यता ]",
          title: "अनिश्चिततेबाबत प्रामाणिक",
          desc: "अटी अपूर्ण असल्यास अंदाज न लावता मध्यम किंवा कमी स्कोअर दिला जातो.",
          footer: "मूल्यांकन: उच्च · मध्यम · कमी",
        },
        {
          kicker: "[ राज्य कायदा प्राधान्य ]",
          title: "राज्य अधिकारक्षेत्राची जाणीव",
          desc: "घटनेच्या कलम २५४ अन्वये राज्य कायद्यांना प्राधान्य असते. मुंबईतील वादाला महाराष्ट्र कायदा लागू होईल.",
          footer: "निराकरण: केंद्रीय वि. राज्य प्राधान्य",
        },
      ],
      entryKicker: "चौकशी प्रवेश आणि स्वीकृती",
      entryTitle: "तुमची कायदेशीर चौकशी सुरू करा",
      entryDesc: "तुमचे नाव प्रविष्ट करा आणि अटी स्वीकारून चौकशी क्षेत्रात प्रवेश करा.",
    },
    entryGate: {
      nameLabel: "आम्ही तुम्हाला कोणत्या नावाने संबोधित करावे?",
      nameHint: "केवळ तुम्हाला संबोधित करण्यासाठी आणि नोटीस तयार करण्यासाठी वापरले जाते.",
      termsHeading: "वैधानिक संशोधन आणि प्रतिनिधित्व विरहित स्वीकृती",
      termsText:
        "KnowYourRights भारतीय कायद्यावर आधारित माहिती देते, हा वकिलाचा सल्ला नाही हे मी समजतो/समजते.",
      proceedBtn: "चौकशीसाठी पुढे जा",
      termsWarning: "* पुढे जाण्यासाठी कृपया वरील स्वीकृती बॉक्स निवडा.",
    },
    workspace: {
      statusKicker: "चौकशी क्षेत्र",
      applicantLabel: "अर्जदार:",
      termsAcknowledged: "अटी स्वीकारल्या ✓",
      backToOverview: "← मुख्यपृष्ठावर परत जा",
      kicker: "कायदेशीर माहिती आणि उपाय",
      title: "काय घडले ते सांगा.",
      subtitle: "आम्ही लागू कायदा शोधू.",
      jurisdictionLabel: "हे कुठे लागू होते?",
      inputLabel: "काय घडले होते?",
      inputPlaceholder: "तुमची परिस्थिती सोप्या मराठीत सांगा...",
      analyzeBtn: "[ प्रकरणाचे विश्लेषण करा ]",
      jurisdictionsCovered: "समाविष्ट अधिकारक्षेत्र",
      verifiedSources: "सत्यापित कायदेशीर स्रोत",
      exampleHeader: "उदाहरणाने सुरुवात करा",
      useThis: "हे वापरा →",
    },
    howItWorksModal: {
      title: "KnowYourRights कसे कार्य करते",
      subtitle: "प्रणाली रचना",
      close: "✕ बंद करा",
      steps: [
        {
          num: "01",
          title: "काय घडले ते सांगा",
          desc: "तुमच्या शब्दांत परिस्थिती सांगा. आम्ही महत्त्वाचे मुद्दे ओळखतो.",
        },
        {
          num: "02",
          title: "कायदेशीर मुद्दा समजून घ्या",
          desc: "कोणत्या प्रकारची कायदेशीर समस्या आहे ते आम्ही ओळखतो.",
        },
        {
          num: "03",
          title: "संबंधित कायदा शोधा",
          desc: "तुमच्या परिस्थितीला लागू होणारे भारतीय व राज्य कायदे शोधतो.",
        },
        {
          num: "04",
          title: "कायदेशीर निकष तपासा",
          desc: "तथ्यांच्या आधारे कायदेशीर आवश्यकता तपासतो.",
        },
        {
          num: "05",
          title: "प्रकरणाचा सारांश मिळवा",
          desc: "कायदे, कलमे, पुरावे आणि पुढील पावले एका स्पष्ट सारांशात देतो.",
        },
      ],
    },
    historyModal: {
      title: "प्रकरण चौकशी इतिहास",
      subtitle: "ब्राउझर सत्र अभिलेखागार",
      close: "✕ बंद करा",
      clearAll: "[ सर्व इतिहास हटवा ]",
      emptyTitle: "या ब्राउझर सत्रात अजून कोणतीही चौकशी नोंदवलेली नाही.",
      emptyDesc: "येथे स्वयंचलितपणे सेव्ह करण्यासाठी कायदेशीर प्रश्न सबमिट करा.",
      openBrief: "[ केस विवरण उघडा → ]",
      delete: "हटवा",
    },
    clarification: {
      header: "वैधानिक तपशील नोंदणी",
      stamp: "वैधानिक तपशील नोंदणी",
      intro: "कोणती कलमे लागू होतात हे ठरवण्यासाठी एका अतिरिक्त तपशीलाची आवश्यकता आहे.",
      continueBtn: "पुढे जा →",
      skipBtn: "वगळा",
    },
    loading: {
      activeBadge: "वैधानिक इंजिन सक्रिय आहे",
      heading: "कायदेशीर परिस्थितीचे विश्लेषण सुरू आहे",
      steps: [
        "तथ्यांचे विश्लेषण आणि कायदेशीर मुद्दा ओळखणे",
        "संबंधित भारतीय आणि राज्य कायदे शोधणे",
        "कायदेशीर अटींची पडताळणी करणे",
        "कायदेशीर मार्गदर्शन आणि पुढील पावले तयार करणे",
      ],
    },
  },
};
