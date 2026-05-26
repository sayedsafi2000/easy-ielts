/**
 * Seed full IELTS Academic Mock Test #1 with real content + answer keys.
 *
 * Run after `npm run seed`:  node scripts/seed_content.js
 */
const { pool, query } = require('../src/config/db');
const content = require('../src/models/contentModel');

// ─── Listening — 4 sections × 10 Qs (40 total) ──────────────
const LISTENING_SECTIONS = [
  {
    section_number: 1,
    title: 'Section 1',
    audio_duration: '05:20',
    question_range: '1–10',
    context: 'You will hear a conversation between a hotel receptionist and a customer who wants to make a conference booking. First you have some time to look at Questions 1 to 10.',
    audio_url: '/uploads/audio/sample-section-1.mp3',
    groups: [
      {
        label: 'Questions 1–5',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 1, prompt: "What is the main purpose of the customer's call?",
            options: ['A  To make a room booking for a family holiday','B  To enquire about conference room availability','C  To cancel an existing reservation'],
            correct_answer: 'B' },
          { question_number: 2, prompt: 'When does the customer want to hold the event?',
            options: ['A  The second week of March','B  The last week of April','C  The first week of May'],
            correct_answer: 'C' },
          { question_number: 3, prompt: 'How many delegates are expected to attend?',
            options: ['A  Around 40','B  Around 70','C  Around 100'],
            correct_answer: 'B' },
          { question_number: 4, prompt: 'Which catering option does the customer ask about?',
            options: ['A  Buffet lunch only','B  Full-day catering package','C  Morning refreshments only'],
            correct_answer: 'B' },
          { question_number: 5, prompt: 'What does the receptionist say about parking?',
            options: ['A  It is free for all delegates','B  It must be pre-booked and paid for','C  It is available on a first-come basis'],
            correct_answer: 'C' },
        ],
      },
      {
        label: 'Questions 6–10',
        instruction: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Oakwood Hotel — Conference Enquiry Form',
        questions: [
          { question_number: 6,  prefix: 'Company name:',          correct_answer: 'Bright Future Ltd' },
          { question_number: 7,  prefix: 'Contact name:',          correct_answer: 'Sarah Mitchell' },
          { question_number: 8,  prefix: 'Telephone number:',      correct_answer: '07943 211 654' },
          { question_number: 9,  prefix: 'Preferred date:',        correct_answer: '5 May' },
          { question_number: 10, prefix: 'Room layout required:',  correct_answer: 'theatre style|theatre' },
        ],
      },
    ],
  },
  {
    section_number: 2,
    title: 'Section 2',
    audio_duration: '04:55',
    question_range: '11–20',
    context: 'You will hear a talk given by the manager of a community sports centre about its facilities and upcoming changes. First you have some time to look at Questions 11 to 20.',
    audio_url: '/uploads/audio/sample-section-2.mp3',
    groups: [
      {
        label: 'Questions 11–14',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 11, prompt: 'The community sports centre was originally built as a:',
            options: ['A  school gymnasium','B  public baths','C  private leisure club'], correct_answer: 'B' },
          { question_number: 12, prompt: "What is the main reason for the centre's recent increase in membership?",
            options: ['A  Reduced membership fees','B  New equipment purchased last year','C  Its central location in the town'], correct_answer: 'A' },
          { question_number: 13, prompt: 'On weekday evenings, the swimming pool is reserved for:',
            options: ["A  children's swimming lessons","B  competitive training sessions","C  adult beginners' classes"], correct_answer: 'B' },
          { question_number: 14, prompt: 'What has recently been added to the centre?',
            options: ['A  An indoor climbing wall','B  A café and refreshment area','C  A new outdoor tennis court'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 15–20',
        instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Community Sports Centre — Key Information',
        questions: [
          { question_number: 15, prefix: 'Opening hours:',                          suffix: 'daily',                  correct_answer: '6am to 10pm|6am-10pm' },
          { question_number: 16, prefix: 'Annual adult membership:',                suffix: '£',                      correct_answer: '320' },
          { question_number: 17, prefix: 'Children under',                          suffix: 'years enter free',       correct_answer: '8' },
          { question_number: 18, prefix: 'New fitness studio opens:',                                                  correct_answer: 'next month|June' },
          { question_number: 19, prefix: 'Car park available after:',               suffix: 'pm at weekends',         correct_answer: '6' },
          { question_number: 20, prefix: 'Booking enquiries email:',                                                   correct_answer: 'bookings@oakwoodsports.uk|bookings@oakwoodsports.co.uk' },
        ],
      },
    ],
  },
  {
    section_number: 3,
    title: 'Section 3',
    audio_duration: '06:10',
    question_range: '21–30',
    context: 'You will hear a discussion between two university students, Emma and James, and their tutor about an upcoming group presentation. First you have some time to look at Questions 21 to 30.',
    audio_url: '/uploads/audio/sample-section-3.mp3',
    groups: [
      {
        label: 'Questions 21–26',
        instruction: 'Choose the correct letter, A, B or C.',
        type: 'mcq',
        questions: [
          { question_number: 21, prompt: "What is the main purpose of the students' meeting with the tutor?",
            options: ['A  To discuss their research findings so far','B  To plan the structure of their group presentation','C  To request an extension on their deadline'], correct_answer: 'B' },
          { question_number: 22, prompt: 'What problem does Emma mention about her research?',
            options: ['A  She cannot locate enough academic sources','B  The data she found is more than five years old','C  The library books she needs are currently on loan'], correct_answer: 'B' },
          { question_number: 23, prompt: 'What does James suggest as a way to resolve the timing issue?',
            options: ['A  Asking the tutor for a later submission date','B  Narrowing the focus of their research topic','C  Dividing the remaining work between three members'], correct_answer: 'B' },
          { question_number: 24, prompt: 'What aspect of the presentation does the tutor particularly emphasise?',
            options: ['A  The importance of a clear, structured introduction','B  Using high-quality visual aids throughout','C  Keeping the conclusion brief and focused'], correct_answer: 'A' },
          { question_number: 25, prompt: 'What does Emma agree to complete before Friday?',
            options: ['A  A draft of the literature review section','B  The slides for the methodology section','C  A list of the most recent statistics on the topic'], correct_answer: 'C' },
          { question_number: 26, prompt: 'What does the tutor recommend regarding references?',
            options: ['A  Including at least fifteen academic sources','B  Using only peer-reviewed journal articles','C  Citing sources both in slides and spoken delivery'], correct_answer: 'C' },
        ],
      },
      {
        label: 'Questions 27–30',
        instruction: 'What responsibility does the tutor assign to each person? Choose FOUR answers from the box and write the correct letter, A–E, next to Questions 27–30.',
        type: 'matching',
        match_options: [
          'A  Write the introduction',
          'B  Conduct further research',
          'C  Prepare the visual aids',
          'D  Draft the conclusion',
          'E  Review the final script',
        ],
        questions: [
          { question_number: 27, prompt: 'Emma',                  correct_answer: 'B  Conduct further research|B' },
          { question_number: 28, prompt: 'James',                 correct_answer: 'C  Prepare the visual aids|C' },
          { question_number: 29, prompt: 'Both Emma and James',   correct_answer: 'A  Write the introduction|A' },
          { question_number: 30, prompt: 'The tutor',             correct_answer: 'E  Review the final script|E' },
        ],
      },
    ],
  },
  {
    section_number: 4,
    title: 'Section 4',
    audio_duration: '07:00',
    question_range: '31–40',
    context: 'You will hear a university lecture on the topic of urban biodiversity. First you have some time to look at Questions 31 to 40.',
    audio_url: '/uploads/audio/sample-section-4.mp3',
    groups: [
      {
        label: 'Questions 31–40',
        instruction: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        type: 'form',
        form_title: 'Urban Biodiversity — Lecture Notes',
        questions: [
          { question_number: 31, prefix: 'Definition: presence of living organisms within',                       suffix: 'environments',                                  correct_answer: 'urban|city' },
          { question_number: 32, prefix: 'Primary threat to urban wildlife:',                                     suffix: 'due to construction',                            correct_answer: 'habitat loss' },
          { question_number: 33, prefix: 'Key indicator species:',                                                suffix: 'and bats',                                       correct_answer: 'birds' },
          { question_number: 34, prefix: 'Green corridors link urban',                                            suffix: 'to enable wildlife movement',                    correct_answer: 'parks' },
          { question_number: 35, prefix: 'Human benefit most cited:',                                             suffix: 'improvements',                                   correct_answer: 'mental health' },
          { question_number: 36, prefix: 'Roof gardens reduce local temperature by up to',                       suffix: '°C',                                             correct_answer: '5' },
          { question_number: 37, prefix: 'Water features attract',                                                suffix: 'and birds',                                      correct_answer: 'insects' },
          { question_number: 38, prefix: 'Most endangered urban group:',                                                                                                    correct_answer: 'pollinators' },
          { question_number: 39, prefix: 'Recommended action: plant',                                              suffix: 'in gardens',                                    correct_answer: 'native species|native plants' },
          { question_number: 40, prefix: 'Next lecture topic:',                                                    suffix: 'restoration projects',                          correct_answer: 'wetland' },
        ],
      },
    ],
  },
];

// ─── Reading — 3 passages × 13ish questions (40 total) ──────
const READING_PASSAGES = [
  {
    passage_number: 1,
    title: 'The Origins of Urban Planning',
    question_range: '1–13',
    body_text: `The Origins of Urban Planning

Urban planning, as a formal discipline, emerged in the late nineteenth century as cities across the industrialised world grappled with the consequences of rapid population growth. The Industrial Revolution had drawn millions of workers to urban centres, creating overcrowded slums, inadequate sanitation, and widespread disease. In response, reformers, engineers, and architects began to develop systematic approaches to managing the built environment.

One of the earliest and most influential figures in the history of urban planning was Baron Georges-Eugène Haussmann, appointed prefect of the Seine department in Paris by Napoleon III in 1853. Haussmann oversaw a massive reconstruction of the French capital, demolishing medieval street networks and replacing them with wide boulevards, uniform building facades, and modern sewage systems. While critics accused him of displacing thousands of working-class residents to build an environment suited to bourgeois tastes, his work established a template for large-scale urban intervention that influenced planners across Europe and the Americas.

In Britain, the response to urban squalor took a different form. The Public Health Act of 1875 established minimum standards for housing density, drainage, and ventilation — one of the first examples of government intervention in urban development. This legislative approach reflected a growing recognition that the market alone could not ensure liveable conditions for the urban poor. Ebenezer Howard extended this thinking at the turn of the twentieth century with his concept of the "garden city": self-contained communities surrounded by green belts, designed to combine the social benefits of urban life with the natural amenity of the countryside. The garden cities of Letchworth and Welwyn, built in Hertfordshire in 1903 and 1920 respectively, remain the most tangible expressions of Howard's ideas.

The twentieth century brought new ideological currents to urban planning. The Swiss-French architect Le Corbusier proposed a radical vision of the city as a machine for living — towers in a park, connected by high-speed roads, with strict separation of functions such as residence, commerce, and industry. His "Plan Voisin", presented in 1925, called for the demolition of most of central Paris and its replacement with eighteen uniform skyscrapers. The plan was never implemented, but its influence on post-war social housing developments in both Europe and North America was profound, and largely unhappy: many of the tower-block estates built in the 1960s and 1970s in its image have since been demolished.`,
    groups: [
      {
        label: 'Questions 1–4',
        instruction: 'Do the following statements agree with the information given in the Reading Passage?\nWrite  TRUE  if the statement agrees with the information\nWrite  FALSE  if the statement contradicts the information\nWrite  NOT GIVEN  if there is no information on this',
        type: 'tfng',
        options: ['TRUE','FALSE','NOT GIVEN'],
        questions: [
          { question_number: 1, text: 'Baron Haussmann was appointed to his position in Paris by Napoleon III.',                                  correct_answer: 'TRUE' },
          { question_number: 2, text: "Haussmann's redesign of Paris was praised by all of his contemporaries.",                                    correct_answer: 'FALSE' },
          { question_number: 3, text: 'The Public Health Act of 1875 was the first piece of legislation anywhere in the world to regulate housing.', correct_answer: 'NOT GIVEN' },
          { question_number: 4, text: 'Ebenezer Howard believed that urban and rural living environments could be successfully combined.',         correct_answer: 'TRUE' },
        ],
      },
      {
        label: 'Questions 5–6',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 5, text: 'According to the passage, what was the primary cause of urban problems in the nineteenth century?',
            options: ['A  A lack of government regulation of the building industry','B  Rapid population growth caused by industrialisation','C  Poor architectural planning in new residential areas','D  Large-scale international migration to European cities'], correct_answer: 'B' },
          { question_number: 6, text: "What does the author say about Le Corbusier's Plan Voisin?",
            options: ['A  It was successfully built in central Paris','B  It was immediately adopted by planners across Europe','C  It was never implemented but strongly influenced later housing','D  It was rejected because it was considered too conservative'], correct_answer: 'C' },
        ],
      },
      {
        label: 'Questions 7–9',
        instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 7, pre: 'The garden city of Letchworth was built in', suf: '.',           correct_answer: '1903' },
          { question_number: 8, pre: 'Le Corbusier described the ideal city as a',  suf: 'for living.', correct_answer: 'machine' },
          { question_number: 9, pre: "Howard's garden cities were surrounded by",   suf: '.',           correct_answer: 'green belts' },
        ],
      },
    ],
  },
  {
    passage_number: 2,
    title: 'The Science of Sleep',
    question_range: '14–26',
    body_text: `The Science of Sleep

Sleep is one of the most pervasive biological phenomena, yet it remains one of the least understood. Until relatively recently, scientists regarded sleep as a passive state — a kind of biological standby mode during which little of significance occurred. This view has been comprehensively overturned. We now know that sleep is an intensely active period during which the brain performs a range of critical functions that are impossible to complete while we are awake.

The most accepted explanation for why we sleep is the restoration hypothesis, first formally proposed by researchers in the 1970s. According to this theory, sleep provides the body and brain with the opportunity to repair cellular damage, consolidate memories, clear metabolic waste products, and regulate hormones. Support for this view came dramatically in 2013, when researchers at the University of Rochester published findings showing that the brain's glymphatic system — a network of channels surrounding blood vessels — is far more active during sleep than during wakefulness. This system appears to flush out potentially toxic proteins, including those associated with Alzheimer's disease.

Memory consolidation is another function strongly linked to sleep. Studies have consistently shown that people who sleep after learning new information perform significantly better in subsequent memory tests than those who remain awake. Sleep appears to replay and stabilise neural patterns formed during the day, transferring information from short-term to long-term memory. Different stages of sleep serve different memory functions: slow-wave sleep is associated with declarative memory — memories of facts and events — while rapid eye movement, or REM, sleep appears more important for procedural and emotional memories.

Despite decades of research, the precise amount of sleep required remains somewhat individual. Most adults function optimally on between seven and nine hours, but there is genuine genetic variation: a small proportion of the population carries mutations in genes such as DEC2 that allow them to function normally on as little as six hours. More concerning is the widespread tendency in modern societies to treat sleep deprivation as a minor inconvenience. Chronic short sleep is now associated with increased risk of obesity, type 2 diabetes, cardiovascular disease, and depression — a catalogue of consequences that researchers argue has been systematically underestimated.`,
    groups: [
      {
        label: 'Questions 14–18',
        instruction: 'Do the following statements agree with the claims of the writer?\nWrite  YES  if the statement agrees with the claims of the writer\nWrite  NO  if the statement contradicts the claims of the writer\nWrite  NOT GIVEN  if it is impossible to say what the writer thinks about this',
        type: 'tfng',
        options: ['YES','NO','NOT GIVEN'],
        questions: [
          { question_number: 14, text: 'Scientists have always recognised that sleep is an active process rather than a passive one.', correct_answer: 'NO' },
          { question_number: 15, text: 'The restoration hypothesis was first formally proposed in the 1970s.',                          correct_answer: 'YES' },
          { question_number: 16, text: 'The University of Rochester study was published in 2013.',                                      correct_answer: 'YES' },
          { question_number: 17, text: 'REM sleep is more important than slow-wave sleep for all types of memory.',                    correct_answer: 'NO' },
          { question_number: 18, text: 'All adults need exactly eight hours of sleep to function at their best.',                       correct_answer: 'NO' },
        ],
      },
      {
        label: 'Questions 19–21',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 19, text: 'What did the 2013 University of Rochester study demonstrate?',
            options: ['A  That the brain produces more memories during sleep than when awake','B  That the glymphatic system removes potentially toxic proteins during sleep','C  That people who sleep longer live significantly longer lives','D  That sleep deprivation causes immediate and irreversible brain damage'], correct_answer: 'B' },
          { question_number: 20, text: 'According to the passage, what is the role of slow-wave sleep?',
            options: ['A  Processing emotional memories from the previous day','B  Consolidating memories of facts and events','C  Replaying procedural skills learned through physical practice','D  Regulating the production of growth hormones in adults'], correct_answer: 'B' },
          { question_number: 21, text: 'What does the author suggest about modern attitudes to sleep deprivation?',
            options: ['A  People have been well informed about the risks for decades','B  The health consequences have been more serious than widely acknowledged','C  Governments have taken significant steps to address the problem','D  Genetic factors make some populations more vulnerable than others'], correct_answer: 'B' },
        ],
      },
      {
        label: 'Questions 22–26',
        instruction: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 22, pre: 'Sleep was once considered a',                                              suf: 'state by scientists.',                            correct_answer: 'passive' },
          { question_number: 23, pre: 'The glymphatic system works to flush out',                                 suf: 'from the brain during sleep.',                    correct_answer: 'toxic proteins' },
          { question_number: 24, pre: 'Sleep transfers information from short-term to',                           suf: 'memory.',                                         correct_answer: 'long-term' },
          { question_number: 25, pre: 'Some people carry mutations in genes such as',                             suf: 'that reduce their sleep requirements.',           correct_answer: 'DEC2' },
          { question_number: 26, pre: 'Chronic short sleep raises the risk of',                                    suf: ', among other serious conditions.',              correct_answer: 'obesity' },
        ],
      },
    ],
  },
  {
    passage_number: 3,
    title: 'The Roots of Behavioural Economics',
    question_range: '27–40',
    body_text: `The Roots of Behavioural Economics

For most of the twentieth century, mainstream economics operated on the assumption that people are rational agents — that they make decisions by carefully weighing available information, calculating likely outcomes, and selecting the option that maximises their personal utility. This model of human decision-making, known as the Rational Actor Model or Homo economicus, provided the theoretical foundation for a vast range of economic policies, financial instruments, and institutional designs.

The challenge to this orthodoxy came not from economics itself but from psychology. In the 1970s, Israeli psychologists Daniel Kahneman and Amos Tversky published a series of experiments demonstrating that human judgement systematically departs from the predictions of rational choice theory. In one classic study, participants were asked to choose between two options: a certain gain of £300, or a 50% chance of winning £700. Most people chose the certain gain, even though the expected value of the gamble was higher. When the same problem was framed in terms of losses rather than gains, however, the preferences reversed: participants became risk-seeking when facing potential losses.

This asymmetry — which Kahneman and Tversky termed loss aversion — became one of the pillars of Prospect Theory, which they published in 1979. Prospect Theory proposed that people evaluate outcomes relative to a reference point (typically the status quo), weight losses more heavily than equivalent gains, and are more sensitive to changes than to absolute levels of wealth. The theory won Kahneman the Nobel Prize in Economics in 2002 (Tversky had died in 1996 and was ineligible).

Behavioural economics has since moved well beyond the laboratory. Richard Thaler and Cass Sunstein's concept of the "nudge" — using the design of choice environments to steer people towards better decisions without restricting their freedom — has been adopted by governments worldwide. The United Kingdom established a Behavioural Insights Team, popularly known as the Nudge Unit, in 2010. Its interventions, ranging from changing the default enrolment policy for workplace pensions to rephrasing tax reminder letters, have generated measurable changes in behaviour at a fraction of the cost of conventional policy instruments. Critics, however, argue that nudging is inherently paternalistic and that its effects, while statistically significant in aggregate, are often modest for individuals.`,
    groups: [
      {
        label: 'Questions 27–32',
        instruction: 'Do the following statements agree with the information given in the Reading Passage?\nWrite  TRUE  if the statement agrees with the information\nWrite  FALSE  if the statement contradicts the information\nWrite  NOT GIVEN  if there is no information on this',
        type: 'tfng',
        options: ['TRUE','FALSE','NOT GIVEN'],
        questions: [
          { question_number: 27, text: 'The Rational Actor Model assumes people always make decisions to maximise their own benefit.', correct_answer: 'TRUE' },
          { question_number: 28, text: 'Kahneman and Tversky were both economists by training.',                                       correct_answer: 'FALSE' },
          { question_number: 29, text: 'In the classic study, most participants chose the certain gain of £300 over the gamble.',     correct_answer: 'TRUE' },
          { question_number: 30, text: 'Prospect Theory was published in 1979.',                                                       correct_answer: 'TRUE' },
          { question_number: 31, text: 'Amos Tversky received the Nobel Prize alongside Kahneman in 2002.',                            correct_answer: 'FALSE' },
          { question_number: 32, text: "The UK government's Behavioural Insights Team was created in 2010.",                            correct_answer: 'TRUE' },
        ],
      },
      {
        label: 'Questions 33–36',
        instruction: 'Choose the correct letter, A, B, C or D.',
        type: 'mcq',
        questions: [
          { question_number: 33, text: 'According to Prospect Theory, how do people evaluate potential outcomes?',
            options: ['A  By comparing them to absolute levels of their total current wealth','B  By calculating the precise statistical probability of each possible outcome','C  In relation to a reference point, usually their current situation','D  By consulting trusted advisers before committing to any decision'], correct_answer: 'C' },
          { question_number: 34, text: "What is described as a core finding of Kahneman and Tversky's research?",
            options: ['A  People are more motivated by the possibility of gains than by losses','B  People feel the impact of losses more strongly than equivalent gains','C  People make better decisions when they are given more time to think','D  People\u2019s preferences are entirely consistent across different situations'], correct_answer: 'B' },
          { question_number: 35, text: "What is the purpose of a 'nudge' as described in the passage?",
            options: ['A  To force people to make government-approved decisions','B  To guide choices through the design of the decision environment','C  To provide financial incentives for better personal behaviour','D  To restrict the number of options available to consumers'], correct_answer: 'B' },
          { question_number: 36, text: 'What criticism of nudging does the author mention?',
            options: ['A  It is too expensive to implement on a large scale','B  It has not been tested rigorously in laboratory conditions','C  It may be paternalistic and its individual effects are often modest','D  Governments have implemented it without the public\u2019s knowledge'], correct_answer: 'C' },
        ],
      },
      {
        label: 'Questions 37–40',
        instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
        type: 'fill',
        questions: [
          { question_number: 37, pre: 'The traditional economic model of human decision-making is known as the', suf: 'Model.',  correct_answer: 'Rational Actor' },
          { question_number: 38, pre: 'Kahneman and Tversky described the tendency to weigh losses more than gains as', suf: '.', correct_answer: 'loss aversion' },
          { question_number: 39, pre: 'Kahneman was awarded the Nobel Prize in Economics in', suf: '.',                          correct_answer: '2002' },
          { question_number: 40, pre: "The UK government's behavioural team is informally known as the", suf: '.',                correct_answer: 'Nudge Unit' },
        ],
      },
    ],
  },
];

// ─── Writing — Task 1 + Task 2 ─────────────────────────────
const WRITING_TASKS = [
  {
    task_number: 1,
    heading: 'WRITING TASK 1',
    instruction: 'You should spend about 20 minutes on this task.',
    prompt: 'The bar chart below shows the percentage of adults in four countries who used the internet for different purposes in 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    note: 'Write at least 150 words.',
    min_words: 150,
    time_minutes: 20,
    has_chart: true,
    chart_type: 'Bar Chart',
    chart_image_url: null,
    marking_notes: 'Students must reference all 4 countries. Look for comparison language and accurate data references.',
  },
  {
    task_number: 2,
    heading: 'WRITING TASK 2',
    instruction: 'You should spend about 40 minutes on this task.\nWrite about the following topic:',
    prompt: 'Some people believe that universities should focus on providing students with academic knowledge and skills, while others think that universities should prepare students for the demands of working life.\n\nDiscuss both these views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.',
    note: 'Write at least 250 words.',
    min_words: 250,
    time_minutes: 40,
    has_chart: false,
    marking_notes: 'Both views must be discussed before opinion. Look for clear thesis, body structure, cohesive devices.',
  },
];

// ─── Speaking — 3 parts ────────────────────────────────────
const SPEAKING_PARTS = [
  {
    part_number: 1,
    title: 'Part 1 — Introduction & Interview',
    duration: '4–5 minutes',
    description: "The examiner introduces themselves and confirms your identity. They ask you general questions about familiar topics such as your home, family, work, studies, and interests.",
    prep_time_seconds: 0,
    questions: [
      'Where do you live?',
      'What kind of work do you do?',
      'How do you usually spend your weekends?',
    ],
  },
  {
    part_number: 2,
    title: 'Part 2 — Individual Long Turn',
    duration: '3–4 minutes',
    description: 'You are given a task card with a topic and have 1 minute to prepare notes. You then speak about the topic for 1–2 minutes. The examiner may ask a brief follow-up question.',
    prep_time_seconds: 60,
    questions: [
      'Describe a person who has had a positive influence on your life. You should say: who this person is, how you know them, what they have done, and explain why they have been a positive influence.',
    ],
  },
  {
    part_number: 3,
    title: 'Part 3 — Two-way Discussion',
    duration: '4–5 minutes',
    description: 'The examiner asks further questions related to the topic in Part 2. This section involves more abstract discussion — expressing and justifying opinions, comparing ideas, and speculating.',
    prep_time_seconds: 0,
    questions: [
      'Why do you think role models are important for young people?',
      'How has the concept of leadership changed in recent years?',
    ],
  },
];

(async () => {
  try {
    const t = await query(`SELECT id FROM tests WHERE title = 'IELTS Academic Mock Test #1' LIMIT 1`);
    if (!t.rows[0]) {
      console.error('❌  "IELTS Academic Mock Test #1" not found. Run `npm run seed` first.');
      process.exit(1);
    }
    const testId = t.rows[0].id;
    console.log(`Seeding content for test ${testId}…`);

    await content.replaceListeningContent(testId, LISTENING_SECTIONS);
    console.log('  ✅  Listening — 4 sections, 40 questions');

    await content.replaceReadingContent(testId, READING_PASSAGES);
    console.log('  ✅  Reading — 3 passages, 40 questions');

    await content.replaceWritingContent(testId, WRITING_TASKS);
    console.log('  ✅  Writing — Task 1 + Task 2');

    await content.replaceSpeakingContent(testId, SPEAKING_PARTS);
    console.log('  ✅  Speaking — 3 parts');

    console.log('\n✅  Content seed complete.');
  } catch (err) {
    console.error('❌  Content seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
