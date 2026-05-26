/**
 * Phase 1 comprehensive seed:
 *
 *  1.  IELTS Academic Mock Test #2 — full content (Listening, Reading, Writing, Speaking)
 *  2.  IELTS General Training Mock Test #1 — Writing tasks only
 *  3.  Several fresh test attempts so the Awaiting Review page shows real data:
 *        • Aisha  → just submitted Listening (auto-score pending → show score)
 *        • Carlos → just submitted Reading
 *        • Priya  → just submitted Writing (pending examiner review)
 *        • James  → in-progress attempt (dashboard active test)
 *  4.  A new examiner: Dr. Emily Watson
 *
 * Run:  node scripts/seed_phase1.js
 */
require('dotenv').config();
const bcrypt  = require('bcryptjs');
const { pool, query } = require('../src/config/db');
const content = require('../src/models/contentModel');
const scoring = require('../src/lib/scoring');

// ─── Test #2: Listening content ─────────────────────────────
const T2_LISTENING = [
  {
    section_number: 1,
    title: 'Section 1',
    audio_duration: '05:10',
    question_range: '1–10',
    context: 'You will hear a telephone conversation between a travel agent and a customer who wants to book a package holiday. First you have some time to look at Questions 1 to 10.',
    audio_url: null,
    groups: [
      {
        label: 'Questions 1–5',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 1, prompt: 'What type of holiday is the customer interested in?',
            options: ['A  A skiing holiday', 'B  A beach resort holiday', 'C  A city break'], correct_answer: 'B' },
          { question_number: 2, prompt: 'When does the customer want to travel?',
            options: ['A  Early June', 'B  Mid July', 'C  Late August'], correct_answer: 'C' },
          { question_number: 3, prompt: 'How many people will be travelling?',
            options: ['A  Two adults', 'B  Two adults and one child', 'C  Two adults and two children'], correct_answer: 'C' },
          { question_number: 4, prompt: 'What is the customer\'s main concern about the destination?',
            options: ['A  The food quality', 'B  The distance from the airport', 'C  The availability of activities for children'], correct_answer: 'C' },
          { question_number: 5, prompt: 'What does the travel agent say about the hotel upgrade?',
            options: ['A  It is free of charge', 'B  It costs an additional fee', 'C  It is only available at certain times of year'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 6–10',
        instruction: 'Complete the booking form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Sunshine Travel — Holiday Booking Form',
        questions: [
          { question_number: 6,  prefix: 'Customer surname:', correct_answer: 'Henderson|henderson' },
          { question_number: 7,  prefix: 'Destination:', correct_answer: 'Tenerife' },
          { question_number: 8,  prefix: 'Number of nights:', correct_answer: '14' },
          { question_number: 9,  prefix: 'Room type:', correct_answer: 'sea view|sea-view' },
          { question_number: 10, prefix: 'Total price:', suffix: '£', correct_answer: '3600|3,600' },
        ],
      },
    ],
  },
  {
    section_number: 2,
    title: 'Section 2',
    audio_duration: '05:00',
    question_range: '11–20',
    context: 'You will hear a talk about a new public library being built in the town of Westbridge. First look at Questions 11 to 20.',
    audio_url: null,
    groups: [
      {
        label: 'Questions 11–15',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 11, prompt: 'When will the new library open?',
            options: ['A  Spring next year', 'B  Summer next year', 'C  Autumn next year'], correct_answer: 'A' },
          { question_number: 12, prompt: 'What is unusual about the building design?',
            options: ['A  It incorporates solar panels on the roof', 'B  It is built partly underground', 'C  It is made entirely of recycled materials'], correct_answer: 'B' },
          { question_number: 13, prompt: 'What will the ground floor be used for?',
            options: ['A  Children\'s section and café', 'B  Archive and local history collection', 'C  Adult fiction and reference'], correct_answer: 'A' },
          { question_number: 14, prompt: 'How many study rooms will be available?',
            options: ['A  Eight', 'B  Twelve', 'C  Twenty'], correct_answer: 'B' },
          { question_number: 15, prompt: 'What is being introduced for the first time?',
            options: ['A  A 3D printing facility', 'B  An outdoor reading garden', 'C  A recording studio for local musicians'], correct_answer: 'A' },
        ],
      },
      {
        label: 'Questions 16–20',
        instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Westbridge Library — Key Facts',
        questions: [
          { question_number: 16, prefix: 'Opening hours:', suffix: 'daily', correct_answer: '8am to 9pm|8am-9pm' },
          { question_number: 17, prefix: 'Annual membership:', suffix: '£', correct_answer: '0|free' },
          { question_number: 18, prefix: 'Number of books in collection:', correct_answer: '85000|85,000' },
          { question_number: 19, prefix: 'Parking spaces available:', correct_answer: '60' },
          { question_number: 20, prefix: 'Contact email:', correct_answer: 'library@westbridge.gov.uk' },
        ],
      },
    ],
  },
  {
    section_number: 3,
    title: 'Section 3',
    audio_duration: '06:20',
    question_range: '21–30',
    context: 'You will hear two students, Kai and Nadia, discussing their research project on consumer behaviour with their supervisor. Look at Questions 21 to 30.',
    audio_url: null,
    groups: [
      {
        label: 'Questions 21–26',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 21, prompt: 'What was the main finding of the students\' pilot study?',
            options: ['A  Consumers underestimate the influence of packaging on their choices', 'B  Price is the primary driver of purchasing decisions', 'C  Brand loyalty is declining among younger consumers'], correct_answer: 'A' },
          { question_number: 22, prompt: 'What problem does the supervisor identify with the questionnaire?',
            options: ['A  The sample size is too small', 'B  Some questions are leading', 'C  The survey is too long to complete online'], correct_answer: 'B' },
          { question_number: 23, prompt: 'What does Kai suggest doing to improve the study?',
            options: ['A  Conducting in-store interviews', 'B  Adding an eye-tracking component', 'C  Expanding the age range of participants'], correct_answer: 'B' },
          { question_number: 24, prompt: 'What does the supervisor say about online surveys?',
            options: ['A  They often produce unreliable data', 'B  They are unsuitable for this type of research', 'C  They can reach a wider range of participants quickly'], correct_answer: 'C' },
          { question_number: 25, prompt: 'Which aspect of the literature review does Nadia say needs updating?',
            options: ['A  The section on social media advertising', 'B  The discussion of neuroscience research', 'C  The analysis of retail store layouts'], correct_answer: 'A' },
          { question_number: 26, prompt: 'What does the supervisor suggest for the conclusion?',
            options: ['A  Including more quantitative data', 'B  Comparing their findings with a similar study', 'C  Recommending practical changes for retailers'], correct_answer: 'C' },
        ],
      },
      {
        label: 'Questions 27–30',
        instruction: 'What does each person agree to do before the next meeting? Write the correct letter, A–E, next to Questions 27–30.',
        type: 'matching',
        match_options: ['A  Revise the questionnaire', 'B  Review additional literature', 'C  Analyse the pilot data again', 'D  Contact a technology supplier', 'E  Write a draft methodology section'],
        questions: [
          { question_number: 27, prompt: 'Kai',       correct_answer: 'D  Contact a technology supplier|D' },
          { question_number: 28, prompt: 'Nadia',     correct_answer: 'B  Review additional literature|B' },
          { question_number: 29, prompt: 'Both',      correct_answer: 'A  Revise the questionnaire|A' },
          { question_number: 30, prompt: 'Supervisor', correct_answer: 'E  Write a draft methodology section|E' },
        ],
      },
    ],
  },
  {
    section_number: 4,
    title: 'Section 4',
    audio_duration: '07:15',
    question_range: '31–40',
    context: 'You will hear a lecture on the topic of microplastics in marine environments. Look at Questions 31 to 40.',
    audio_url: null,
    groups: [
      {
        label: 'Questions 31–40',
        instruction: 'Complete the lecture notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Microplastics in Marine Environments — Lecture Notes',
        questions: [
          { question_number: 31, prefix: 'Definition: plastic particles smaller than', suffix: 'mm', correct_answer: '5' },
          { question_number: 32, prefix: 'Primary source:', suffix: 'from synthetic clothing', correct_answer: 'microfibres|micro-fibres' },
          { question_number: 33, prefix: 'Secondary source: degradation of', suffix: 'waste', correct_answer: 'larger plastic|larger' },
          { question_number: 34, prefix: 'Most affected ecosystem:', suffix: 'zone', correct_answer: 'deep sea|deep ocean' },
          { question_number: 35, prefix: 'Risk to marine life:', suffix: 'of chemical pollutants', correct_answer: 'ingestion' },
          { question_number: 36, prefix: 'Estimated ocean concentration by 2050:', suffix: 'tonnes', correct_answer: '937|937 million' },
          { question_number: 37, prefix: 'Detection method in water:', correct_answer: 'spectroscopy' },
          { question_number: 38, prefix: 'Potential impact on human health:', suffix: 'through seafood consumption', correct_answer: 'hormone disruption|endocrine disruption' },
          { question_number: 39, prefix: 'Most effective policy response:', correct_answer: 'extended producer responsibility' },
          { question_number: 40, prefix: 'Next lecture topic:', correct_answer: 'bioplastics' },
        ],
      },
    ],
  },
];

// ─── Test #2: Reading content ────────────────────────────────
const T2_READING = [
  {
    passage_number: 1,
    title: 'The History of Public Libraries',
    question_range: '1–13',
    body_text: `The History of Public Libraries

The concept of a public library — a collection of books freely accessible to any member of the community — is a surprisingly recent one. While the great libraries of antiquity, such as the Library of Alexandria, stored vast quantities of knowledge, these were invariably the preserve of scholars, priests, or the ruling class. Ordinary citizens had no practical means of accessing them, and indeed, most lacked the literacy to do so.

The earliest recognisably public libraries in the modern sense emerged in the mid-nineteenth century, when industrialisation had created large urban populations with a growing appetite for self-improvement. In Britain, the Public Libraries Act of 1850 was a landmark piece of legislation that gave local councils the power to levy a small tax to fund the construction and maintenance of libraries that were free to all. The Act was contested, with some councillors arguing that providing free books to the working classes would encourage idleness and unrest. Nevertheless, it passed, and within decades hundreds of towns had opened their own libraries.

In the United States, the development of public libraries owed much to the philanthropy of industrialist Andrew Carnegie. Between 1883 and 1929, Carnegie funded the construction of more than 2,500 library buildings across the English-speaking world, on the condition that the local municipality agreed to staff and maintain them. His motivating philosophy was that a free library was the greatest gift one could give to a community, since it was self-help rather than charity: the books were there, but citizens still had to put in the effort to read and learn.

Throughout the twentieth century, public libraries expanded their remit far beyond the lending of books. Gramophone records, then cassettes, then compact discs joined the collections. Reference services, children's reading programmes, adult literacy classes, and eventually internet terminals all became standard features. By the late twentieth century, the library had evolved from a repository of books into a community hub.

In the twenty-first century, libraries face significant challenges. The rise of the internet and e-books has led some to argue that physical library collections are becoming redundant. Library visitor numbers declined in many countries during the 2000s and 2010s, and several local authorities responded with closures and cuts. Yet defenders of the public library argue that it fulfils a social function that no digital alternative can replicate: it provides a safe, heated, quiet space, free of charge, where anyone — regardless of income, age, or background — is welcome to sit and read, study, or simply rest.`,
    groups: [
      {
        label: 'Questions 1–4',
        instruction: 'Do the following statements agree with the information given in the Reading Passage?\nWrite  TRUE  if the statement agrees with the information\nWrite  FALSE  if the statement contradicts the information\nWrite  NOT GIVEN  if there is no information on this',
        type: 'tfng',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        questions: [
          { question_number: 1, text: 'The Library of Alexandria was accessible to all citizens of the ancient world.', correct_answer: 'FALSE' },
          { question_number: 2, text: 'The British Public Libraries Act of 1850 was passed without opposition.', correct_answer: 'FALSE' },
          { question_number: 3, text: 'Andrew Carnegie believed that free libraries encouraged dependency rather than self-improvement.', correct_answer: 'FALSE' },
          { question_number: 4, text: 'Library visitor numbers fell in some countries during the 2000s and 2010s.', correct_answer: 'TRUE' },
        ],
      },
      {
        label: 'Questions 5–7',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 5, text: 'According to the passage, why did the Public Libraries Act of 1850 face opposition?',
            options: ['A  Critics argued that the tax would place an unfair burden on ratepayers', 'B  Some believed free libraries would cause the working class to become lazy and rebellious', 'C  Opponents felt that local councils lacked the capacity to manage libraries effectively', 'D  Critics thought literacy rates were too low to justify the cost'], correct_answer: 'B' },
          { question_number: 6, text: 'What condition did Carnegie attach to his library donations?',
            options: ['A  The library must be open for a minimum number of hours each week', 'B  His name must be displayed prominently on the building', 'C  The local authority must agree to fund the running costs', 'D  The library must be available to students before the general public'], correct_answer: 'C' },
          { question_number: 7, text: 'What does the author suggest is the unique value of a public library in the twenty-first century?',
            options: ['A  Its collection of rare and historical texts', 'B  Its role as a free, inclusive physical space for everyone', 'C  Its provision of internet access in underserved areas', 'D  Its contribution to local economic development'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 8–13',
        instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 8,  pre: 'In ancient times, great libraries were typically the preserve of scholars, priests, or the', suf: '.', correct_answer: 'ruling class' },
          { question_number: 9,  pre: 'The Public Libraries Act gave local councils the power to levy a small tax to fund', suf: 'that were free to all.', correct_answer: 'libraries' },
          { question_number: 10, pre: 'Carnegie described a free library as', suf: 'rather than charity.', correct_answer: 'self-help' },
          { question_number: 11, pre: 'In the twentieth century, libraries expanded beyond books to include', suf: 'records and other media.', correct_answer: 'gramophone' },
          { question_number: 12, pre: 'By the late twentieth century, the library had evolved into a', suf: '.', correct_answer: 'community hub' },
          { question_number: 13, pre: 'Defenders of libraries argue that no', suf: 'can replicate its social function.', correct_answer: 'digital alternative' },
        ],
      },
    ],
  },
  {
    passage_number: 2,
    title: 'The Neuroscience of Decision-Making',
    question_range: '14–26',
    body_text: `The Neuroscience of Decision-Making

Every moment of our waking lives, we make decisions — from the trivial (what to wear, what to eat) to the consequential (which career to pursue, whom to marry). For most of human history, philosophers and economists assumed these decisions were the product of rational deliberation: we weigh the available options, calculate their likely consequences, and select the one that best serves our interests. Neuroscience has increasingly challenged this picture.

The case that rational deliberation is not the primary engine of decision-making was made compellingly by neuroscientist Antonio Damasio in his 1994 book Descartes' Error. Damasio studied patients who had suffered damage to the ventromedial prefrontal cortex, a region of the brain associated with emotional processing. Despite retaining their intellectual capacities fully intact — their scores on IQ tests, their reasoning abilities, and their factual knowledge were unaffected — these patients became profoundly unable to make sensible decisions in daily life. They would deliberate endlessly over trivial choices, and when they did decide, their choices were frequently harmful to their own interests.

Damasio's explanation, known as the Somatic Marker Hypothesis, proposed that emotions function as a rapid shorthand for decision-making. When we contemplate a choice, the brain generates bodily feelings — what Damasio called somatic markers — that tag certain options as good or bad based on past experience. This emotional guidance system allows most decisions to be made rapidly and effectively, without the need for exhaustive conscious deliberation. The prefrontal damage had severed this system, leaving his patients intellectually capable but emotionally rudderless.

More recent research using brain imaging has confirmed and extended these findings. Studies using functional magnetic resonance imaging (fMRI) have shown that emotional and reward-processing regions of the brain, including the amygdala and nucleus accumbens, are activated well before the regions associated with conscious deliberation. In other words, the brain often "decides" before we are aware of deciding.

This insight has significant implications for fields ranging from marketing to public policy. If decisions are emotionally primed rather than rationally deliberated, then changing behaviour may require interventions that target the emotional rather than the informational. Anti-smoking campaigns that evoke disgust, for instance, have been found to be significantly more effective than those that simply present statistics about health risks.`,
    groups: [
      {
        label: 'Questions 14–18',
        instruction: 'Do the following statements agree with the claims of the writer?\nWrite  YES  if the statement agrees\nWrite  NO  if the statement contradicts\nWrite  NOT GIVEN  if impossible to say',
        type: 'tfng',
        options: ['YES', 'NO', 'NOT GIVEN'],
        questions: [
          { question_number: 14, text: 'Philosophers and economists traditionally believed that human decisions were primarily driven by emotion.', correct_answer: 'NO' },
          { question_number: 15, text: 'Damasio\'s patients with prefrontal damage showed reduced performance on IQ tests.', correct_answer: 'NO' },
          { question_number: 16, text: 'The Somatic Marker Hypothesis suggests emotions allow decisions to be made faster.', correct_answer: 'YES' },
          { question_number: 17, text: 'fMRI studies confirm that emotional brain regions activate before conscious deliberation begins.', correct_answer: 'YES' },
          { question_number: 18, text: 'The author believes that rational deliberation plays no role in any human decision.', correct_answer: 'NOT GIVEN' },
        ],
      },
      {
        label: 'Questions 19–21',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 19, text: 'What was notable about Damasio\'s patients?',
            options: ['A  They had lost all emotional responses completely', 'B  They retained intelligence but could not make effective decisions', 'C  They made rapid decisions but regretted them afterwards', 'D  Their memory for past experiences was severely impaired'], correct_answer: 'B' },
          { question_number: 20, text: 'According to the Somatic Marker Hypothesis, how do somatic markers function?',
            options: ['A  They systematically evaluate all possible outcomes before deciding', 'B  They generate a neutral signal when facing familiar situations', 'C  They use emotional signals from past experience to guide choices', 'D  They suppress emotional responses to allow rational thinking'], correct_answer: 'C' },
          { question_number: 21, text: 'What implication does the author suggest for public policy?',
            options: ['A  Behaviour change should focus on providing more accurate information', 'B  Emotional rather than informational interventions may be more effective', 'C  Decision-making education should be introduced in schools', 'D  Marketing should be more tightly regulated to protect consumers'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 22–26',
        instruction: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 22, pre: 'Damasio studied patients with damage to the', suf: 'prefrontal cortex.', correct_answer: 'ventromedial' },
          { question_number: 23, pre: 'Despite this, their', suf: 'and reasoning remained unaffected.', correct_answer: 'intellectual capacities|IQ' },
          { question_number: 24, pre: 'Somatic markers are bodily feelings that', suf: 'certain options as good or bad.', correct_answer: 'tag' },
          { question_number: 25, pre: 'The amygdala and', suf: 'are activated before conscious deliberation in decision-making.', correct_answer: 'nucleus accumbens' },
          { question_number: 26, pre: 'Anti-smoking campaigns that evoke', suf: 'are more effective than those presenting statistics.', correct_answer: 'disgust' },
        ],
      },
    ],
  },
  {
    passage_number: 3,
    title: 'The Economics of Renewable Energy',
    question_range: '27–40',
    body_text: `The Economics of Renewable Energy

For most of the twentieth century, renewable energy sources — solar, wind, hydroelectric and geothermal — were considered economically uncompetitive compared with fossil fuels. Coal and natural gas were abundant, cheap, and supported by decades of infrastructure investment and regulatory familiarity. Renewables, by contrast, were expensive to manufacture, required significant land area, and could not provide power on demand: the sun does not always shine, nor the wind always blow.

This picture has changed dramatically. The cost of generating electricity from solar photovoltaic (PV) panels has fallen by more than 89 percent since 2010, making solar in many markets the cheapest source of new electricity generation ever recorded. Onshore wind costs have fallen by around 70 percent over the same period. These reductions are not the result of any single breakthrough but of a sustained process of incremental improvements in manufacturing, installation, and supply chains, combined with the effects of scale as deployment expanded globally.

The consequences of this cost revolution are far-reaching. In many parts of the world, building new solar or wind capacity is now cheaper than continuing to operate existing coal or gas plants. Investment banks and energy companies that once dismissed renewables as marginal are now directing the majority of their new generation investment into solar and wind. The International Energy Agency projects that renewables will account for 80 percent of global new electricity capacity by 2030.

However, the transition is not without its challenges. Grid integration — the process of incorporating variable renewable sources into electricity networks designed for steady, dispatchable power — requires significant investment in storage, transmission, and smart grid technologies. Battery storage costs, while falling rapidly, remain high for large-scale deployment. There are also geopolitical dimensions: the rapid growth of solar manufacturing has been concentrated in a small number of countries, raising concerns about supply chain resilience and trade dependency.

Proponents of the energy transition argue that the economic and strategic case for renewables is now overwhelming. Critics counter that the intermittency problem remains unsolved at the scale required for a fully decarbonised grid, and that the costs of the necessary storage and grid upgrades have been systematically underestimated. The debate is no longer about whether renewables can compete on cost — they demonstrably can — but about the pace and completeness of the transition.`,
    groups: [
      {
        label: 'Questions 27–32',
        instruction: 'Do the following statements agree with the information given in the Reading Passage?\nWrite  TRUE  if the statement agrees\nWrite  FALSE  if the statement contradicts\nWrite  NOT GIVEN  if no information',
        type: 'tfng',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        questions: [
          { question_number: 27, text: 'Renewable energy was considered economically competitive with fossil fuels for most of the twentieth century.', correct_answer: 'FALSE' },
          { question_number: 28, text: 'Solar PV costs fell by more than 89 percent between 2010 and the time of writing.', correct_answer: 'TRUE' },
          { question_number: 29, text: 'The cost reductions in renewables were primarily the result of a single technological breakthrough.', correct_answer: 'FALSE' },
          { question_number: 30, text: 'The IEA predicts renewables will make up 80 percent of new global electricity capacity by 2030.', correct_answer: 'TRUE' },
          { question_number: 31, text: 'Battery storage costs have now reached a level suitable for large-scale deployment.', correct_answer: 'FALSE' },
          { question_number: 32, text: 'Critics of the energy transition argue mainly that renewables cannot compete on cost.', correct_answer: 'FALSE' },
        ],
      },
      {
        label: 'Questions 33–36',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 33, text: 'What does the author say is responsible for the cost reductions in renewables?',
            options: ['A  A single key technological innovation in solar panel design', 'B  Government subsidies reducing the market price artificially', 'C  Gradual improvements combined with the effects of scaling up', 'D  Competition from fossil fuel companies driving down prices'], correct_answer: 'C' },
          { question_number: 34, text: 'What does the passage say about investment in new electricity generation?',
            options: ['A  Banks are still reluctant to invest in renewable energy', 'B  Most new investment is now directed towards solar and wind', 'C  Investment in coal and gas has increased due to energy security concerns', 'D  Investment is evenly split between renewables and fossil fuels'], correct_answer: 'B' },
          { question_number: 35, text: 'What concern does the passage raise about solar manufacturing?',
            options: ['A  Environmental damage caused by solar panel production', 'B  The workforce skills required for installation are in short supply', 'C  Over-concentration in a few countries creates supply chain risks', 'D  The panels produced are not durable enough for long-term use'], correct_answer: 'C' },
          { question_number: 36, text: 'What does the passage say the current debate about renewables is focused on?',
            options: ['A  Whether renewables can compete with fossil fuels on cost', 'B  The pace and completeness of the transition rather than cost competitiveness', 'C  Whether battery storage technology will ever be commercially viable', 'D  The geopolitical implications of renewable energy dominance'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 37–40',
        instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 37, pre: 'Solar PV costs have fallen by more than', suf: 'percent since 2010.', correct_answer: '89' },
          { question_number: 38, pre: 'Onshore wind costs have fallen by around', suf: 'percent over the same period.', correct_answer: '70' },
          { question_number: 39, pre: 'Grid integration requires investment in storage, transmission, and', suf: 'technologies.', correct_answer: 'smart grid' },
          { question_number: 40, pre: 'Critics argue the costs of necessary storage and grid upgrades have been', suf: '.', correct_answer: 'systematically underestimated|underestimated' },
        ],
      },
    ],
  },
];

// ─── Test #2: Writing tasks ──────────────────────────────────
const T2_WRITING = [
  {
    task_number: 1,
    heading: 'WRITING TASK 1',
    instruction: 'You should spend about 20 minutes on this task.',
    prompt: 'The line graph below shows the percentage of renewable energy as a share of total electricity generation in four countries between 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    note: 'Write at least 150 words.',
    min_words: 150,
    time_minutes: 20,
    has_chart: true,
    chart_type: 'Line Graph',
    chart_image_url: null,
    marking_notes: 'Students must reference all 4 countries and identify key trends: Germany rising sharply, UK moderate growth, USA slow growth, Australia volatile.',
  },
  {
    task_number: 2,
    heading: 'WRITING TASK 2',
    instruction: 'You should spend about 40 minutes on this task.\nWrite about the following topic:',
    prompt: 'Some people believe that the most important factor in a successful business is having a good leader. Others believe that other factors, such as the quality of the product or the skill of the workforce, are more important.\n\nDiscuss both these views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    note: 'Write at least 250 words.',
    min_words: 250,
    time_minutes: 40,
    has_chart: false,
    marking_notes: 'Both leadership and other factors must be addressed. Good answers will evaluate leadership alongside product quality and workforce skill.',
  },
];

// ─── Test #2: Speaking parts ─────────────────────────────────
const T2_SPEAKING = [
  {
    part_number: 1,
    title: 'Part 1 — Introduction & Interview',
    duration: '4–5 minutes',
    description: 'General questions about familiar topics.',
    prep_time_seconds: 0,
    questions: [
      'Do you live in a house or an apartment?',
      'What kind of music do you enjoy listening to?',
      'How do you usually spend your evenings?',
      'Do you enjoy cooking? Why or why not?',
    ],
  },
  {
    part_number: 2,
    title: 'Part 2 — Individual Long Turn',
    duration: '3–4 minutes',
    description: 'Cue card topic with 1 minute preparation.',
    prep_time_seconds: 60,
    questions: [
      'Describe a skill you have learned that you find useful in everyday life. You should say: what the skill is, how you learned it, how long it took to learn, and explain why you find it useful.',
    ],
  },
  {
    part_number: 3,
    title: 'Part 3 — Two-way Discussion',
    duration: '4–5 minutes',
    description: 'Abstract discussion on the Part 2 theme.',
    prep_time_seconds: 0,
    questions: [
      'Do you think schools spend enough time teaching practical life skills?',
      'How has technology changed the kinds of skills people need in modern society?',
      'Some people say that soft skills are more important than technical skills in the workplace. Do you agree?',
    ],
  },
];

// ─── GT Test #1: Writing tasks only ─────────────────────────
const GT_WRITING = [
  {
    task_number: 1,
    heading: 'WRITING TASK 1',
    instruction: 'You should spend about 20 minutes on this task.',
    prompt: 'You recently stayed at a hotel and were very disappointed with the service. Write a letter to the hotel manager.\n\nIn your letter:\n• describe what you expected when you booked\n• explain what went wrong during your stay\n• say what you would like the hotel to do.',
    note: 'Write at least 150 words. You do NOT need to write any addresses.',
    min_words: 150,
    time_minutes: 20,
    has_chart: false,
    marking_notes: 'Formal register required. Must cover all three bullet points. Assess clarity of purpose and appropriate letter conventions.',
  },
  {
    task_number: 2,
    heading: 'WRITING TASK 2',
    instruction: 'You should spend about 40 minutes on this task.\nWrite about the following topic:',
    prompt: 'In many countries, the government provides financial support to people who are unable to find work. Some people believe this support encourages people not to look for jobs.\n\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    note: 'Write at least 250 words.',
    min_words: 250,
    time_minutes: 40,
    has_chart: false,
    marking_notes: 'Requires a clear position. Both sides should be considered even in a strong agree/disagree essay.',
  },
];

// ─── Main ────────────────────────────────────────────────────
(async () => {
  try {
    // ── Get test IDs ────────────────────────────────────────
    const t = async (title) => {
      const { rows } = await query(`SELECT id FROM tests WHERE title ILIKE $1 LIMIT 1`, [`%${title}%`]);
      if (!rows[0]) throw new Error(`Test not found: ${title}`);
      return rows[0].id;
    };
    const test2Id = await t('Academic Mock Test #2');
    const gtId    = await t('General Training Mock Test');

    // ── Seed Test #2 content ────────────────────────────────
    console.log('Seeding Mock Test #2 content…');
    await content.replaceListeningContent(test2Id, T2_LISTENING);
    console.log('  ✅  Listening — 4 sections, 40 questions');
    await content.replaceReadingContent(test2Id, T2_READING);
    console.log('  ✅  Reading — 3 passages, 40 questions');
    await content.replaceWritingContent(test2Id, T2_WRITING);
    console.log('  ✅  Writing — Task 1 + Task 2');
    await content.replaceSpeakingContent(test2Id, T2_SPEAKING);
    console.log('  ✅  Speaking — 3 parts');

    // ── Seed GT Test #1 writing ─────────────────────────────
    console.log('\nSeeding GT Mock Test #1 writing tasks…');
    await content.replaceWritingContent(gtId, GT_WRITING);
    console.log('  ✅  Writing tasks seeded');

    // ── Seed new examiner ───────────────────────────────────
    console.log('\nCreating examiner: Dr. Emily Watson…');
    const existingExaminer = await query(`SELECT id FROM profiles WHERE email='emily.watson@ieltsjournal.com' LIMIT 1`);
    if (!existingExaminer.rows[0]) {
      const ph = await bcrypt.hash('Examiner123!', 10);
      const ep = await query(
        `INSERT INTO profiles (email, password_hash, full_name, role, plan, email_verified)
         VALUES ('emily.watson@ieltsjournal.com',$1,'Dr. Emily Watson','examiner','premium',TRUE)
         RETURNING id`,
        [ph]
      );
      await query(
        `INSERT INTO examiners (profile_id, specialization, rating)
         VALUES ($1, $2, 4.9) ON CONFLICT (profile_id) DO NOTHING`,
        [ep.rows[0].id, ['Writing', 'Speaking']]
      );
      console.log('  ✅  Dr. Emily Watson created (emily.watson@ieltsjournal.com / Examiner123!)');
    } else {
      console.log('  ℹ️   Dr. Emily Watson already exists');
    }

    // ── Seed fresh attempts for Awaiting Review demo ─────────
    console.log('\nSeeding fresh test attempts for Awaiting Review demo…');

    const studentEmails = [
      'aisha.rahman@demo.com',
      'carlos.mendez@demo.com',
      'priya.sharma@demo.com',
      'james.okafor@demo.com',
      'li.wei@demo.com',
    ];
    const students = [];
    for (const email of studentEmails) {
      const { rows } = await query(`SELECT id, full_name FROM profiles WHERE email=$1 LIMIT 1`, [email]);
      if (rows[0]) students.push(rows[0]);
    }
    const adminRes = await query(`SELECT id FROM profiles WHERE role='admin' LIMIT 1`);
    const adminId  = adminRes.rows[0]?.id ?? null;

    const [aisha, carlos, priya, james, liwei] = students;

    // Aisha: just submitted Listening on Test #2 → should show real auto-score
    if (aisha) {
      const existing = await query(
        `SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 AND status='submitted' LIMIT 1`,
        [aisha.id, test2Id]
      );
      if (!existing.rows[0]) {
        const a = await query(
          `INSERT INTO test_attempts (student_id, test_id, track, format, module, status, started_at, submitted_at)
           VALUES ($1, $2, 'academic', 'single', 'listening', 'submitted', NOW()-INTERVAL '1 hour', NOW()-INTERVAL '5 minutes')
           RETURNING id`,
          [aisha.id, test2Id]
        );
        const attemptId = a.rows[0].id;

        // Perfect listening answers for Test #2 Q1-Q40
        const answers = { 1:'B',2:'C',3:'C',4:'C',5:'B',6:'Henderson',7:'Tenerife',8:'14',9:'sea view',10:'3600',11:'A',12:'B',13:'A',14:'B',15:'A',16:'8am to 9pm',17:'0',18:'85000',19:'60',20:'library@westbridge.gov.uk',21:'A',22:'B',23:'B',24:'C',25:'A',26:'C',27:'D',28:'B',29:'A',30:'E',31:'5',32:'microfibres',33:'larger plastic',34:'deep sea',35:'ingestion',36:'937',37:'spectroscopy',38:'hormone disruption',39:'extended producer responsibility',40:'bioplastics' };

        // Get answer key
        const { getListeningAnswerKey } = content;
        const key    = await getListeningAnswerKey(test2Id);
        const grade  = require('../src/lib/scoring').gradeMcqStyle(key, answers, 'listening', 'academic');

        // Save session
        await query(
          `INSERT INTO test_sessions (attempt_id, module, duration_seconds, started_at, expires_at, submitted_at)
           VALUES ($1, 'listening', 1800, NOW()-INTERVAL '1 hour', NOW()+INTERVAL '30 minutes', NOW()-INTERVAL '5 minutes')
           ON CONFLICT DO NOTHING`,
          [attemptId]
        );

        // Save result
        await query(
          `INSERT INTO results (attempt_id, student_id, module, band_score, feedback, criteria, published_at)
           VALUES ($1,$2,'listening',$3,$4,$5::jsonb, NOW()-INTERVAL '4 minutes')`,
          [attemptId, aisha.id, grade.band,
            `${grade.rawScore} / ${grade.totalQuestions} correct.`,
            JSON.stringify({ rawScore: grade.rawScore, totalQuestions: grade.totalQuestions })]
        );

        console.log(`  ✅  Aisha: Listening submitted → Band ${grade.band} (${grade.rawScore}/40)`);
      }
    }

    // Carlos: just submitted Reading on Test #2
    if (carlos) {
      const existing = await query(
        `SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 AND module='reading' AND status='submitted' LIMIT 1`,
        [carlos.id, test2Id]
      );
      if (!existing.rows[0]) {
        const a = await query(
          `INSERT INTO test_attempts (student_id, test_id, track, format, module, status, started_at, submitted_at)
           VALUES ($1, $2, 'academic', 'single', 'reading', 'submitted', NOW()-INTERVAL '70 minutes', NOW()-INTERVAL '10 minutes')
           RETURNING id`,
          [carlos.id, test2Id]
        );
        const attemptId = a.rows[0].id;

        // Most correct (35/40 ≈ Band 8.0)
        const answers = { 1:'FALSE',2:'FALSE',3:'FALSE',4:'TRUE',5:'B',6:'C',7:'B',8:'ruling class',9:'libraries',10:'self-help',11:'gramophone',12:'community hub',13:'digital alternative',14:'NO',15:'NO',16:'YES',17:'YES',18:'NOT GIVEN',19:'B',20:'C',21:'B',22:'ventromedial',23:'intellectual capacities',24:'tag',25:'nucleus accumbens',26:'disgust',27:'FALSE',28:'TRUE',29:'FALSE',30:'TRUE',31:'FALSE',32:'FALSE',33:'C',34:'B',35:'C',36:'B',37:'89',38:'70',39:'smart grid',40:'underestimated' };

        const { getReadingAnswerKey } = content;
        const key   = await getReadingAnswerKey(test2Id);
        const grade = require('../src/lib/scoring').gradeMcqStyle(key, answers, 'reading', 'academic');

        await query(
          `INSERT INTO test_sessions (attempt_id, module, duration_seconds, started_at, expires_at, submitted_at)
           VALUES ($1, 'reading', 3600, NOW()-INTERVAL '70 minutes', NOW()+INTERVAL '10 minutes', NOW()-INTERVAL '10 minutes')
           ON CONFLICT DO NOTHING`,
          [attemptId]
        );
        await query(
          `INSERT INTO results (attempt_id, student_id, module, band_score, feedback, criteria, published_at)
           VALUES ($1,$2,'reading',$3,$4,$5::jsonb, NOW()-INTERVAL '9 minutes')`,
          [attemptId, carlos.id, grade.band,
            `${grade.rawScore} / ${grade.totalQuestions} correct.`,
            JSON.stringify({ rawScore: grade.rawScore, totalQuestions: grade.totalQuestions })]
        );
        console.log(`  ✅  Carlos: Reading submitted → Band ${grade.band} (${grade.rawScore}/40)`);
      }
    }

    // Priya: submitted Writing on Test #2 → pending review
    if (priya) {
      const existing = await query(
        `SELECT id FROM test_attempts WHERE student_id=$1 AND test_id=$2 AND module='writing' AND status='submitted' LIMIT 1`,
        [priya.id, test2Id]
      );
      if (!existing.rows[0]) {
        const a = await query(
          `INSERT INTO test_attempts (student_id, test_id, track, format, module, status, started_at, submitted_at)
           VALUES ($1, $2, 'academic', 'single', 'writing', 'submitted', NOW()-INTERVAL '2 hours', NOW()-INTERVAL '30 minutes')
           RETURNING id`,
          [priya.id, test2Id]
        );
        const attemptId = a.rows[0].id;
        await query(
          `INSERT INTO submissions (attempt_id, student_id, module, answers, word_count, status, submitted_at)
           VALUES ($1,$2,'writing',$3::jsonb,380,'pending',NOW()-INTERVAL '30 minutes')`,
          [attemptId, priya.id, JSON.stringify({
            task1: 'The line graph illustrates the share of renewable energy across four countries from 2000 to 2020. Overall, Germany showed the most dramatic increase, while Australia experienced the most volatile pattern.\n\nIn 2000, all four countries generated a relatively small proportion of electricity from renewable sources, with none exceeding 15%. By 2020, Germany had risen sharply to approximately 44%, driven largely by strong government policy incentives for solar and wind energy. The United Kingdom showed moderate but steady growth, reaching around 37% by 2020. The United States, despite being the world\'s largest economy, saw only modest growth from around 8% to 20%, reflecting its continued reliance on fossil fuels. Australia\'s trajectory was the most erratic, spiking briefly in 2012 before declining and then recovering to approximately 29% by 2020.\n\nIn summary, while all four countries increased their renewable share, the pace and consistency of change varied significantly, with Germany emerging as the clear leader by the end of the period.',
            task2: 'The question of whether strong leadership is the most critical factor in business success is widely debated. While visionary leadership undoubtedly plays an important role, I believe that it is only one of several equally significant elements.\n\nThose who emphasise leadership argue that a company\'s strategic direction, culture, and ability to adapt in a crisis all depend on the quality of its management. Companies such as Apple under Steve Jobs or SpaceX under Elon Musk are frequently cited as examples of how a singular, decisive leader can transform an industry. Without such figures at the helm, even well-resourced organisations can drift into mediocrity or fail to capitalise on opportunities.\n\nHowever, leadership alone cannot sustain a business if the product or service it offers is fundamentally flawed. The most gifted leader cannot indefinitely sell something that customers do not want or need. Similarly, a highly skilled and motivated workforce is essential to executing any strategic vision. Even the clearest plan fails without people who can deliver it. In many successful technology companies, for instance, it is the collective expertise of engineers and designers rather than the CEO that drives innovation.\n\nIn my view, the most successful organisations achieve a balance: effective leadership provides direction and inspiration, while a quality product builds customer loyalty and a skilled workforce delivers results. Overemphasising any single factor at the expense of others creates fragility. The greatest businesses tend to be those where strong leadership, excellent products, and talented employees reinforce one another.',
          })]
        );
        console.log('  ✅  Priya: Writing submitted → pending review');
      }
    }

    // James: in-progress attempt on Test #2 (shows on dashboard as active test)
    if (james) {
      const existingActive = await query(
        `SELECT id FROM test_attempts WHERE student_id=$1 AND status='in_progress' LIMIT 1`,
        [james.id]
      );
      if (!existingActive.rows[0]) {
        await query(
          `INSERT INTO test_attempts (student_id, test_id, track, format, status, started_at)
           VALUES ($1,$2,'academic','full','in_progress',NOW()-INTERVAL '20 minutes')`,
          [james.id, test2Id]
        );
        console.log('  ✅  James: in-progress full mock test (shows as active on dashboard)');
      }
    }

    // Li Wei: book a speaking session on GT test
    if (liwei) {
      const existingBook = await query(
        `SELECT id FROM speaking_bookings WHERE student_id=$1 AND status='confirmed' AND scheduled_at > NOW() LIMIT 1`,
        [liwei.id]
      );
      if (!existingBook.rows[0]) {
        await query(
          `INSERT INTO speaking_bookings (student_id, scheduled_at, status, meeting_link)
           VALUES ($1, NOW()+INTERVAL '3 days'+INTERVAL '14 hours', 'confirmed', 'https://meet.google.com/demo-liww3')`,
          [liwei.id]
        );
        console.log('  ✅  Li Wei: speaking session booked (3 days from now)');
      }
    }

    console.log('\n✅  Phase 1 seed complete!');
    console.log('');
    console.log('New content:');
    console.log('  • IELTS Academic Mock Test #2 — full content (40L + 40R + Writing + Speaking)');
    console.log('  • IELTS General Training Mock Test #1 — Writing tasks');
    console.log('  • Dr. Emily Watson (examiner): emily.watson@ieltsjournal.com / Examiner123!');
    console.log('');
    console.log('Awaiting Review demo:');
    console.log('  • Aisha Rahman: Listening submitted → real band score shown');
    console.log('  • Carlos Mendez: Reading submitted → real band score shown');
    console.log('  • Priya Sharma: Writing submitted → pending examiner review');
    console.log('  • James Okafor: In-progress full test (shows on dashboard)');
    console.log('  • Li Wei: Speaking session booked for 3 days from now');
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
