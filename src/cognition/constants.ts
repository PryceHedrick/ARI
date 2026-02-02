/**
 * ARI Cognitive Layer 0: Constants
 *
 * All cognitive patterns, frameworks, and reference data.
 *
 * @module cognition/constants
 * @version 1.0.0
 */

import type { CognitiveBias, CognitiveDistortion, WisdomTradition, CardinalVirtue } from './types.js';

// =============================================================================
// PILLAR METADATA
// =============================================================================

export const PILLAR_ICONS = {
  LOGOS: '🧠',
  ETHOS: '❤️',
  PATHOS: '🌱',
} as const;

export const PILLAR_NAMES = {
  LOGOS: 'Reason',
  ETHOS: 'Character',
  PATHOS: 'Growth',
} as const;

export const PILLAR_DESCRIPTIONS = {
  LOGOS: 'Algorithmic decision-making using probability theory, expected value, and systems thinking',
  ETHOS: 'Emotional intelligence, bias awareness, and disciplined decision-making',
  PATHOS: 'Continuous learning, wisdom integration, and reflective growth',
} as const;

export const PILLAR_COLORS = {
  LOGOS: '#3b82f6', // Blue
  ETHOS: '#f97316', // Orange
  PATHOS: '#10b981', // Green
} as const;

// =============================================================================
// LOGOS: COGNITIVE BIAS PATTERNS
// =============================================================================

/**
 * Detection patterns for the 10 cognitive biases
 */
export const BIAS_PATTERNS: Record<
  CognitiveBias,
  {
    patterns: RegExp[];
    description: string;
    mitigation: string;
    source: string;
    examples: string[];
    severity_weight: number;
  }
> = {
  CONFIRMATION_BIAS: {
    patterns: [
      /\b(confirms?|supports?|validates?|proves?) (my|our|the) (theory|belief|view|hypothesis|idea|position)\b/i,
      /\b(I|we) knew (it|this) (would|was going to)\b/i,
      /\bjust as (I|we) (expected|thought|predicted|anticipated)\b/i,
      /\b(ignore|dismiss|overlook|discount).*contradicting\b/i,
      /\b(see|shows?|demonstrate?s?) (exactly )?what (I|we) (thought|expected|believed)\b/i,
      /\bthis (supports|backs up|confirms) (what|that)\b/i,
    ],
    description: 'Seeking information that confirms existing beliefs while ignoring contradicting evidence',
    mitigation: 'Actively seek contradicting evidence. Ask: "What would change my mind?" Consult someone with an opposing view.',
    source: 'Nickerson, R.S. (1998). Confirmation Bias: A Ubiquitous Phenomenon in Many Guises. Review of General Psychology.',
    examples: [
      'Only reading news sources that align with your views',
      'Interpreting ambiguous data as supporting your hypothesis',
      'Dismissing critics as "not understanding"',
    ],
    severity_weight: 0.8,
  },

  SUNK_COST_FALLACY: {
    patterns: [
      /\b(already|too much) (invested|spent|committed|put in)\b/i,
      /\bcan't (quit|stop|give up|walk away) now\b/i,
      /\bcome (this|too) far (to|now)\b/i,
      /\b(wasted|lost) if (we|I) (stop|quit|leave)\b/i,
      /\bthrow(ing)? away (all that|everything)\b/i,
      /\bafter (all|everything) (we've|I've) (done|invested|spent)\b/i,
      /\b(invested|spent) too much to\b/i,
    ],
    description: 'Continuing a course of action because of past investments rather than future value',
    mitigation: 'Ignore past costs completely. Ask: "If I were starting fresh today with no investment, would I make this choice?"',
    source: 'Arkes, H.R. & Blumer, C. (1985). The Psychology of Sunk Cost. Organizational Behavior and Human Decision Processes.',
    examples: [
      'Watching a bad movie to the end because you paid for the ticket',
      'Staying in a failing project because of time already spent',
      'Keeping stock that\'s declining because you "already lost so much"',
    ],
    severity_weight: 0.7,
  },

  RECENCY_BIAS: {
    patterns: [
      /\b(just|recently|yesterday|last week|today|this morning) (happened|saw|heard|read|noticed)\b/i,
      /\bthis time (it's|is) different\b/i,
      /\btrend (is|seems|looks|appears)\b/i,
      /\bthings (are|have been) (different|changing) (now|lately|recently)\b/i,
      /\b(given|considering|based on) recent (events?|news|developments?)\b/i,
      /\blately\b/i,
      /\bin (the past|recent) (few|couple|several) (days?|weeks?|months?)\b/i,
    ],
    description: 'Overweighting recent events compared to historical data or base rates',
    mitigation: 'Examine longer time horizons. Compare recent to 3-month, 1-year, and 5-year data. Ask: "What\'s the base rate?"',
    source: 'Tversky, A. & Kahneman, D. (1973). Availability: A Heuristic for Judging Frequency and Probability. Cognitive Psychology.',
    examples: [
      'Thinking plane crashes are common after seeing one in the news',
      'Overestimating market risk after a recent downturn',
      'Assuming a pattern from just 2-3 recent data points',
    ],
    severity_weight: 0.6,
  },

  LOSS_AVERSION: {
    patterns: [
      /\bcan't afford to lose\b/i,
      /\b(scared|afraid|worried|terrified) of losing\b/i,
      /\bprotect (what we have|my|our|the)\b/i,
      /\b(too much|a lot|so much) to lose\b/i,
      /\bdon't want to (lose|give up|risk)\b/i,
      /\bloss(es)? (would|could|might) (hurt|be devastating|be terrible)\b/i,
      /\bpreserve (what|the)\b/i,
    ],
    description: 'Feeling losses roughly twice as strongly as equivalent gains, leading to excessive risk aversion',
    mitigation: 'Frame the decision in terms of gains, not losses. Calculate expected value objectively. Consider opportunity cost of not acting.',
    source: 'Kahneman, D. & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk. Econometrica.',
    examples: [
      'Holding losing investments too long hoping to "break even"',
      'Rejecting a bet with 50% chance to win $200 vs lose $100',
      'Overinsuring against unlikely but emotionally salient losses',
    ],
    severity_weight: 0.75,
  },

  OVERCONFIDENCE: {
    patterns: [
      /\b(definitely|certainly|surely|absolutely|100%|guaranteed|no doubt)\b/i,
      /\bno (way|chance|doubt|question|possibility)\b/i,
      /\b(I|we) (know|am sure|are certain|am positive|am confident)\b/i,
      /\bcan't (fail|go wrong|lose|miss)\b/i,
      /\bimpossible (to|that|for)\b/i,
      /\bwithout (a|any) doubt\b/i,
      /\b(obvious|clear|evident) that\b/i,
    ],
    description: 'Excessive certainty in one\'s own predictions, judgments, or abilities',
    mitigation: 'Assign specific probabilities instead of using "certain" language. Ask: "What probability would I assign to being wrong?"',
    source: 'Fischhoff, B., Slovic, P. & Lichtenstein, S. (1977). Knowing with Certainty: The Appropriateness of Extreme Confidence. Journal of Experimental Psychology.',
    examples: [
      'Being 90% confident in predictions that are right only 60% of the time',
      'Thinking "I\'ve done my research, I can\'t be wrong"',
      'Underestimating project timelines by 2-3x consistently',
    ],
    severity_weight: 0.85,
  },

  ANCHORING: {
    patterns: [
      /\b(initial|first|original|starting|opening) (offer|price|estimate|number|figure|value)\b/i,
      /\bstarted at\b/i,
      /\b(compared|relative|versus) to (the|that|their)\b/i,
      /\b(asking|list|sticker) price\b/i,
      /\b(down|up) from\b/i,
      /\b(50|40|30|20|10)% off\b/i,
      /\boriginal(ly)?\b/i,
    ],
    description: 'Over-relying on the first piece of information encountered (the "anchor")',
    mitigation: 'Generate your own estimate before hearing others. Consider multiple anchors. Ask: "What if this number was 2x higher/lower?"',
    source: 'Tversky, A. & Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases. Science.',
    examples: [
      'Negotiating around a seller\'s first offer instead of your own valuation',
      'Thinking $500 is cheap because it was "originally $1000"',
      'Salary negotiations anchored on current salary, not market rate',
    ],
    severity_weight: 0.65,
  },

  AVAILABILITY_HEURISTIC: {
    patterns: [
      /\b(remember|recall) (when|that|the time)\b/i,
      /\b(saw|heard|read) (about|that) (a|the|this)\b/i,
      /\b(common|frequent|happens? a lot|widespread)\b/i,
      /\b(news|media|everyone|people) (says?|reports?|talks? about)\b/i,
      /\bheard of (many|lots of|several)\b/i,
      /\bexamples? (come|spring) to mind\b/i,
      /\bI can (think of|name) (many|several|lots)\b/i,
    ],
    description: 'Judging probability or frequency by how easily examples come to mind (vividness, not prevalence)',
    mitigation: 'Look up actual base rates and statistics. Don\'t rely on memorable anecdotes. Ask: "Is this common or just memorable?"',
    source: 'Tversky, A. & Kahneman, D. (1973). Availability: A Heuristic for Judging Frequency and Probability. Cognitive Psychology.',
    examples: [
      'Fearing plane crashes more than car accidents (despite statistics)',
      'Thinking violent crime is increasing because of vivid news coverage',
      'Overestimating startup success because you hear about unicorns, not failures',
    ],
    severity_weight: 0.6,
  },

  HINDSIGHT_BIAS: {
    patterns: [
      /\b(knew|obvious|predictable|inevitable) (all along|from the start|beforehand)\b/i,
      /\bshould have (known|seen|expected|predicted)\b/i,
      /\b(of course|naturally|obviously) (it|this|that) (happened|would|was going to)\b/i,
      /\b(bound|destined|fated) to (fail|happen|succeed)\b/i,
      /\bI (told|said|warned) (you|them)\b/i,
      /\bin (hindsight|retrospect)\b/i,
      /\blooking back,? (it was|it's) (clear|obvious)\b/i,
    ],
    description: 'Believing past events were more predictable than they actually were ("I knew it all along")',
    mitigation: 'Record predictions BEFORE outcomes are known. Review your actual prediction accuracy. Ask: "Did I really predict this?"',
    source: 'Fischhoff, B. (1975). Hindsight ≠ Foresight: The Effect of Outcome Knowledge on Judgment Under Uncertainty. Journal of Experimental Psychology.',
    examples: [
      'Thinking "I knew the market would crash" after the crash',
      'Criticizing past decisions with information you didn\'t have then',
      'Believing a startup\'s failure was "obvious" from the start',
    ],
    severity_weight: 0.5,
  },

  GAMBLERS_FALLACY: {
    patterns: [
      /\b(due|overdue|must be time) (for|to)\b/i,
      /\b(bound|has) to (change|turn around|happen|come|hit)\b/i,
      /\b(streak|run) (can't|won't|couldn't) (continue|last|go on)\b/i,
      /\blaw of averages\b/i,
      /\bafter (so many|that many) (losses|wins|times)\b/i,
      /\bregress(ion)? to (the )?mean\b/i,
      /\bstatistically (must|has to|should)\b/i,
    ],
    description: 'Believing that past random events affect future independent probabilities',
    mitigation: 'Remember: Each independent event has the same probability. Coin doesn\'t know or care about past flips. Past results don\'t change future odds.',
    source: 'Tversky, A. & Kahneman, D. (1971). Belief in the Law of Small Numbers. Psychological Bulletin.',
    examples: [
      'Thinking "red is due" at roulette after 5 blacks',
      'Expecting a "reversion" in coin flips',
      'Assuming a lucky streak must end soon',
    ],
    severity_weight: 0.55,
  },

  DUNNING_KRUGER: {
    patterns: [
      /\b(easy|simple|obvious|straightforward|trivial|no-brainer)\b/i,
      /\b(anyone|everyone|any idiot) (can|could|would) (do|understand|figure out)\b/i,
      /\b(don't|doesn't|won't) need (expert|help|experience|training)\b/i,
      /\b(already|basically|pretty much) (know|understand|get it)\b/i,
      /\bhow hard (can|could) it be\b/i,
      /\bjust (need to|have to|gotta)\b/i,
      /\bI (get|understand) the (basics|fundamentals|gist)\b/i,
    ],
    description: 'Overestimating competence in areas where one has limited knowledge; experts tend to underestimate',
    mitigation: 'Seek expert feedback. Measure actual performance against benchmarks. Ask: "What don\'t I know that I don\'t know?"',
    source: 'Kruger, J. & Dunning, D. (1999). Unskilled and Unaware of It: How Difficulties in Recognizing One\'s Own Incompetence Lead to Inflated Self-Assessments. Journal of Personality and Social Psychology.',
    examples: [
      'Novice thinking they\'re ready after reading one book',
      'Beginner critiquing expert\'s work',
      'Thinking "I could write a better X" without trying',
    ],
    severity_weight: 0.7,
  },
};

// =============================================================================
// PATHOS: COGNITIVE DISTORTION PATTERNS
// =============================================================================

/**
 * Detection patterns for the 10 cognitive distortions (David Burns)
 */
export const DISTORTION_PATTERNS: Record<
  CognitiveDistortion,
  {
    patterns: RegExp[];
    description: string;
    reframeStrategy: string;
    examples: string[];
    actionable: string;
  }
> = {
  ALL_OR_NOTHING: {
    patterns: [
      /\b(completely|totally|entirely|absolutely|utterly) (ruined|failed|destroyed|worthless|useless)\b/i,
      /\b(always|never|every time|constantly|forever)\b/i,
      /\b(perfect|flawless) or (worthless|useless|failure|nothing)\b/i,
      /\b(100%|0%) (success|failure)\b/i,
      /\b(complete|total|utter) (disaster|failure|success)\b/i,
    ],
    description: 'Seeing things in black-and-white categories with no middle ground',
    reframeStrategy: 'Find the gray area. Ask: "What percentage is accurate?" "What\'s the partial success?"',
    examples: [
      '"I ate one cookie, my diet is ruined."',
      '"If I\'m not perfect, I\'m a failure."',
      '"Either they love me or they hate me."',
    ],
    actionable: 'Rate the situation on a scale of 1-10 instead of pass/fail',
  },

  OVERGENERALIZATION: {
    patterns: [
      /\bthis always happens (to me)?\b/i,
      /\b(I|we) (always|never) (succeed|fail|get|win|lose)\b/i,
      /\beveryone (thinks|says|knows|believes)\b/i,
      /\bno one (ever|will|would|has|does)\b/i,
      /\bnothing (ever|good|works)\b/i,
      /\beverything (is|goes|turns out) (wrong|bad|terrible)\b/i,
    ],
    description: 'Seeing a single negative event as an endless pattern of defeat',
    reframeStrategy: 'Look at actual data. Ask: "How often has this actually happened?" "What\'s the real frequency?"',
    examples: [
      '"I failed this interview. I always mess up interviews."',
      '"This relationship didn\'t work. I\'ll never find anyone."',
      '"I made one mistake. Everything I do is wrong."',
    ],
    actionable: 'Count actual instances - how many times has this really happened?',
  },

  MENTAL_FILTER: {
    patterns: [
      /\bbut (that one|the one) (thing|person|comment|criticism)\b/i,
      /\b(focused|fixated|dwelling) on (the negative|what went wrong|that one thing)\b/i,
      /\b(ignore|forget|dismiss|overlook) (the positive|what went well|everything else)\b/i,
      /\ball I (can see|notice|think about) is\b/i,
      /\b(ruined|spoiled) (by|because of) (that one|the)\b/i,
    ],
    description: 'Focusing exclusively on negative details while filtering out all positives',
    reframeStrategy: 'List three positive things. Ask: "What went right?" "What would a friend notice?"',
    examples: [
      '"10 people praised my talk but 1 person criticized it, so it was terrible."',
      '"Yes I got promoted but my desk is messy."',
      '"The vacation was great but I got sunburned on day 3."',
    ],
    actionable: 'Write down three things that went well today',
  },

  CATASTROPHIZING: {
    patterns: [
      /\b(disaster|catastrophe|catastrophic|the end|worst thing ever)\b/i,
      /\bwhat if (everything|it all) (goes wrong|fails|falls apart)\b/i,
      /\b(my life|career|everything|world) is (over|ruined|ended)\b/i,
      /\b(can't|won't|couldn't) (survive|recover|handle|cope|bear)\b/i,
      /\b(terrible|horrible|awful|devastating) (consequences|outcome)\b/i,
      /\bthe worst (case|thing|outcome)\b/i,
    ],
    description: 'Expecting the worst possible outcome without realistic assessment',
    reframeStrategy: 'Develop three scenarios: worst case, best case, and most likely. Ask: "What\'s realistically likely?"',
    examples: [
      '"If I don\'t get this job, my career is over."',
      '"If they don\'t text back, they must hate me."',
      '"This headache is probably a brain tumor."',
    ],
    actionable: 'Write out best case, worst case, and most likely case scenarios',
  },

  DISQUALIFYING_POSITIVE: {
    patterns: [
      /\b(doesn't count|doesn't matter|doesn't mean anything)\b/i,
      /\b(anyone|everybody|a child) (could|would) (have|do|say)\b/i,
      /\bjust (luck|coincidence|accident|fluke|chance)\b/i,
      /\bthey (had to|were just being nice|were just saying that)\b/i,
      /\bI (don't deserve|didn't earn) (it|this|that)\b/i,
      /\byeah but\b/i,
    ],
    description: 'Dismissing positive experiences as if they don\'t count',
    reframeStrategy: 'Take credit where it\'s due. Ask: "What skills or effort contributed to this?"',
    examples: [
      '"They only said I did well because they had to."',
      '"I got the job but it was just luck."',
      '"Anyone could have done what I did."',
    ],
    actionable: 'Accept the compliment or success at face value',
  },

  MIND_READING: {
    patterns: [
      /\bthey (think|believe|know|feel|must think) (I'm|that I)\b/i,
      /\beveryone (thinks|knows|can see|believes) (that I|I'm)\b/i,
      /\bI (can tell|know|bet|sense) (they|he|she|everyone)\b/i,
      /\bobviously (they|he|she|everyone) (thinks|feels|wants)\b/i,
      /\bthey're (probably|definitely) (thinking|judging)\b/i,
    ],
    description: 'Assuming you know what others are thinking without evidence',
    reframeStrategy: 'You can\'t read minds. Ask: "What actual evidence do I have?" "Could I ask them directly?"',
    examples: [
      '"They think I\'m an idiot."',
      '"She\'s mad at me, I can tell."',
      '"Everyone at the party was judging me."',
    ],
    actionable: 'Ask the person directly what they think instead of assuming',
  },

  FORTUNE_TELLING: {
    patterns: [
      /\b(will|going to) (definitely|certainly|surely) (fail|go wrong|be terrible)\b/i,
      /\bthere's no (point|use|chance|hope)\b/i,
      /\bI know (it|this|that) (will|won't)\b/i,
      /\b(bound|destined|doomed|certain) to (fail|go wrong|happen)\b/i,
      /\bwhy (bother|try)(\?|,| ) (it|I) (will|won't)\b/i,
    ],
    description: 'Predicting the future will be negative without evidence',
    reframeStrategy: 'You can\'t predict the future. Ask: "What are all possible outcomes?" "What evidence do I have for each?"',
    examples: [
      '"I know I\'ll fail the test."',
      '"There\'s no point applying, they won\'t hire me."',
      '"This relationship will end badly."',
    ],
    actionable: 'List evidence for and against this prediction happening',
  },

  EMOTIONAL_REASONING: {
    patterns: [
      /\bI feel (like|that) (I'm|it's|this is|they)\b/i,
      /\b(feels|seems) (wrong|bad|dangerous|right|true)\b/i,
      /\bmy (gut|intuition|instinct) (says|tells|screams)\b/i,
      /\b(must|has to) be (true|real|right) because I feel\b/i,
      /\bI (just )?feel it\b/i,
    ],
    description: 'Assuming that feelings reflect reality ("I feel it, therefore it\'s true")',
    reframeStrategy: 'Feelings aren\'t facts. Ask: "What\'s the objective evidence?" "Would a neutral observer agree?"',
    examples: [
      '"I feel stupid, so I must be stupid."',
      '"I feel like a fraud, so I must be one."',
      '"It feels dangerous, so it must be."',
    ],
    actionable: 'Separate feelings from facts - what would a neutral observer say?',
  },

  SHOULD_STATEMENTS: {
    patterns: [
      /\b(I|you|they|people|one) (should|shouldn't|must|have to|ought to|need to)\b/i,
      /\b(supposed|expected|required|obligated) to\b/i,
      /\b(have|has|need|needs) to (be|do|have)\b/i,
      /\bshould've|shouldn't have|must've|ought to have\b/i,
    ],
    description: 'Having rigid rules about how things "should" be, leading to frustration when reality differs',
    reframeStrategy: 'Replace "should" with "prefer" or "would like". Ask: "What\'s the actual consequence of this rule?"',
    examples: [
      '"I should always be productive."',
      '"People should be fair."',
      '"I shouldn\'t feel this way."',
    ],
    actionable: 'Replace "should" with "prefer" and notice how it feels',
  },

  PERSONALIZATION: {
    patterns: [
      /\b(my|all my) fault\b/i,
      /\b(because of|due to) me\b/i,
      /\b(I|I'm) (responsible|to blame|at fault) for\b/i,
      /\bif (only|I had|I hadn't) I\b/i,
      /\bthey (did|said|feel) (that|this) because (of me|I)\b/i,
      /\bI (made|caused) (them|this|it)\b/i,
    ],
    description: 'Taking excessive personal responsibility for events outside your control',
    reframeStrategy: 'List all contributing factors. Ask: "What percentage is actually my responsibility?"',
    examples: [
      '"The team failed because of me."',
      '"My kids are unhappy because I\'m a bad parent."',
      '"They\'re in a bad mood because of something I did."',
    ],
    actionable: 'List all factors that contributed, not just your own',
  },
};

// =============================================================================
// PATHOS: WISDOM TRADITIONS
// =============================================================================

/**
 * Core principles from each wisdom tradition
 */
export const WISDOM_PRINCIPLES: Record<
  WisdomTradition,
  {
    name: string;
    description: string;
    corePrinciples: Array<{
      principle: string;
      application: string;
      source: string;
    }>;
  }
> = {
  STOIC: {
    name: 'Stoic Philosophy',
    description: 'Ancient wisdom on control, virtue, and rational acceptance',
    corePrinciples: [
      {
        principle: 'Dichotomy of Control',
        application: 'Focus only on what you can control (your actions, judgments). Accept what you cannot.',
        source: 'Epictetus, Enchiridion',
      },
      {
        principle: 'Amor Fati',
        application: 'Love your fate. Embrace everything that happens as necessary and good for your growth.',
        source: 'Marcus Aurelius, Meditations',
      },
      {
        principle: 'Premeditatio Malorum',
        application: 'Visualize potential misfortunes to prepare psychologically and reduce their impact.',
        source: 'Seneca, Letters',
      },
      {
        principle: 'Memento Mori',
        application: 'Remember death to gain perspective and urgency. What would you do if today was your last?',
        source: 'Marcus Aurelius, Meditations',
      },
      {
        principle: 'Four Cardinal Virtues',
        application: 'Cultivate wisdom, courage, justice, and temperance in all decisions.',
        source: 'Plato/Stoic tradition',
      },
    ],
  },

  DALIO: {
    name: 'Ray Dalio Principles',
    description: 'Systematic approach to decision-making, radical truth, and meaningful work',
    corePrinciples: [
      {
        principle: 'Pain + Reflection = Progress',
        application: 'Embrace pain as a signal. Reflect deeply on failures to extract lessons.',
        source: 'Ray Dalio, Principles',
      },
      {
        principle: 'Radical Truth and Transparency',
        application: 'Be ruthlessly honest. Surface disagreements. Let the best ideas win.',
        source: 'Ray Dalio, Principles',
      },
      {
        principle: 'Believability-Weighted Decision Making',
        application: 'Weight opinions by track record and expertise, not seniority or volume.',
        source: 'Ray Dalio, Principles',
      },
      {
        principle: 'Embrace Reality and Deal With It',
        application: 'Face facts as they are, not as you wish them to be. Adapt accordingly.',
        source: 'Ray Dalio, Principles',
      },
      {
        principle: 'Systemize Your Decision Making',
        application: 'Create principles and algorithms for repeated decisions. Remove emotion.',
        source: 'Ray Dalio, Principles',
      },
    ],
  },

  MUNGER: {
    name: 'Charlie Munger Mental Models',
    description: 'Worldly wisdom through multidisciplinary thinking and inversion',
    corePrinciples: [
      {
        principle: 'Inversion',
        application: 'Solve problems backwards. Instead of "How do I succeed?", ask "How do I fail?" and avoid those.',
        source: 'Charlie Munger, Poor Charlie\'s Almanack',
      },
      {
        principle: 'Second-Order Thinking',
        application: 'Always ask "And then what?" Consider consequences of consequences.',
        source: 'Charlie Munger, Poor Charlie\'s Almanack',
      },
      {
        principle: 'Circle of Competence',
        application: 'Know the boundaries of your knowledge. Stay within them or expand deliberately.',
        source: 'Charlie Munger, Poor Charlie\'s Almanack',
      },
      {
        principle: 'Lollapalooza Effect',
        application: 'Multiple biases compound. When several psychological tendencies align, effects multiply.',
        source: 'Charlie Munger, Poor Charlie\'s Almanack',
      },
      {
        principle: 'Margin of Safety',
        application: 'Always leave room for error. If bridge holds 10 tons, only drive 5 across.',
        source: 'Charlie Munger, Poor Charlie\'s Almanack',
      },
    ],
  },

  MUSASHI: {
    name: 'Miyamoto Musashi Strategy',
    description: 'Warrior wisdom on mastery, timing, and seeing through to the essence',
    corePrinciples: [
      {
        principle: 'Think Lightly of Yourself',
        application: 'Don\'t be attached to ego. Think deeply of the world and your purpose.',
        source: 'Miyamoto Musashi, Book of Five Rings',
      },
      {
        principle: 'Do Nothing Which Is of No Use',
        application: 'Eliminate waste. Every action should have purpose.',
        source: 'Miyamoto Musashi, Book of Five Rings',
      },
      {
        principle: 'Perceive Those Things Which Cannot Be Seen',
        application: 'Develop intuition through practice. See the essence, not the surface.',
        source: 'Miyamoto Musashi, Book of Five Rings',
      },
      {
        principle: 'The Way Is in Training',
        application: 'Mastery comes from relentless practice, not natural talent.',
        source: 'Miyamoto Musashi, Book of Five Rings',
      },
      {
        principle: 'Know the Rhythms',
        application: 'Understand timing. There is rhythm in everything - find it and use it.',
        source: 'Miyamoto Musashi, Book of Five Rings',
      },
    ],
  },

  NAVAL: {
    name: 'Naval Ravikant Wisdom',
    description: 'Modern wisdom on wealth, happiness, and specific knowledge',
    corePrinciples: [
      {
        principle: 'Specific Knowledge',
        application: 'Build knowledge that cannot be trained. It\'s found by pursuing genuine curiosity.',
        source: 'Naval Ravikant, Almanack',
      },
      {
        principle: 'Leverage',
        application: 'Use code, media, labor, and capital to multiply your output. Code and media scale without permission.',
        source: 'Naval Ravikant, Almanack',
      },
      {
        principle: 'Play Long-Term Games with Long-Term People',
        application: 'Compound returns come from long relationships and repeated interactions.',
        source: 'Naval Ravikant, Almanack',
      },
      {
        principle: 'Read What You Love Until You Love to Read',
        application: 'Don\'t force yourself to read "important" books. Follow curiosity.',
        source: 'Naval Ravikant, Almanack',
      },
      {
        principle: 'Desire Is Suffering',
        application: 'Happiness is the absence of desire. Peace comes from acceptance, not acquisition.',
        source: 'Naval Ravikant, Almanack',
      },
    ],
  },

  TALEB: {
    name: 'Nassim Taleb Antifragility',
    description: 'Wisdom on uncertainty, optionality, and gaining from disorder',
    corePrinciples: [
      {
        principle: 'Antifragility',
        application: 'Position yourself to gain from volatility, not just survive it.',
        source: 'Nassim Taleb, Antifragile',
      },
      {
        principle: 'Barbell Strategy',
        application: 'Be extremely safe in some areas, extremely aggressive in others. No middle.',
        source: 'Nassim Taleb, Antifragile',
      },
      {
        principle: 'Skin in the Game',
        application: 'Don\'t trust advice from those who don\'t bear the consequences.',
        source: 'Nassim Taleb, Skin in the Game',
      },
      {
        principle: 'Via Negativa',
        application: 'Improvement often comes from removing, not adding. Subtract the harmful.',
        source: 'Nassim Taleb, Antifragile',
      },
      {
        principle: 'Optionality',
        application: 'Keep options open. Asymmetric bets with limited downside, unlimited upside.',
        source: 'Nassim Taleb, Antifragile',
      },
    ],
  },

  MEADOWS: {
    name: 'Donella Meadows Systems Thinking',
    description: 'Understanding complex systems, feedback loops, and leverage points',
    corePrinciples: [
      {
        principle: '12 Leverage Points',
        application: 'Intervene at high-leverage points: paradigms > goals > rules > structure.',
        source: 'Donella Meadows, Thinking in Systems',
      },
      {
        principle: 'Stocks and Flows',
        application: 'Understand what accumulates and what transfers. Stocks change slowly.',
        source: 'Donella Meadows, Thinking in Systems',
      },
      {
        principle: 'Feedback Loops',
        application: 'Reinforcing loops amplify. Balancing loops stabilize. Know which you\'re dealing with.',
        source: 'Donella Meadows, Thinking in Systems',
      },
      {
        principle: 'Delays',
        application: 'Systems have lag. Today\'s action shows results later. Be patient.',
        source: 'Donella Meadows, Thinking in Systems',
      },
      {
        principle: 'System Boundaries',
        application: 'Where you draw the boundary determines what you see. Expand boundaries for insight.',
        source: 'Donella Meadows, Thinking in Systems',
      },
    ],
  },

  ERICSSON: {
    name: 'Anders Ericsson Deliberate Practice',
    description: 'Science of expert performance and skill acquisition',
    corePrinciples: [
      {
        principle: 'Deliberate Practice',
        application: 'Practice must be focused, challenging, with immediate feedback. Comfortable practice doesn\'t improve.',
        source: 'Anders Ericsson, Peak',
      },
      {
        principle: 'Mental Representations',
        application: 'Experts have rich mental models. Build yours through varied, quality practice.',
        source: 'Anders Ericsson, Peak',
      },
      {
        principle: 'The 10,000 Hour Myth',
        application: 'Hours matter less than quality. 10,000 hours of naive practice won\'t make you expert.',
        source: 'Anders Ericsson, Peak',
      },
      {
        principle: 'Zone of Proximal Development',
        application: 'Practice just beyond current ability. Too easy = boredom. Too hard = frustration.',
        source: 'Anders Ericsson, Peak',
      },
      {
        principle: 'Expert Coaching',
        application: 'Teachers who have walked the path can compress your learning dramatically.',
        source: 'Anders Ericsson, Peak',
      },
    ],
  },

  BECK: {
    name: 'Aaron Beck Cognitive Therapy',
    description: 'Changing thoughts to change emotions and behavior',
    corePrinciples: [
      {
        principle: 'Thoughts Create Feelings',
        application: 'It\'s not events that upset you, but your interpretation of them.',
        source: 'Aaron Beck, Cognitive Therapy',
      },
      {
        principle: 'Cognitive Distortions',
        application: 'Our minds systematically distort reality in predictable ways. Learn to spot them.',
        source: 'Aaron Beck, Cognitive Therapy',
      },
      {
        principle: 'Evidence Testing',
        application: 'Test negative thoughts against evidence. What supports this? What contradicts?',
        source: 'Aaron Beck, Cognitive Therapy',
      },
      {
        principle: 'Behavioral Experiments',
        application: 'Don\'t just think differently, act differently. Test predictions in real life.',
        source: 'Aaron Beck, Cognitive Therapy',
      },
      {
        principle: 'Collaborative Empiricism',
        application: 'Treat thoughts as hypotheses, not facts. Test them scientifically.',
        source: 'Aaron Beck, Cognitive Therapy',
      },
    ],
  },

  UNIVERSAL: {
    name: 'Universal Wisdom',
    description: 'Cross-cultural principles that appear across traditions',
    corePrinciples: [
      {
        principle: 'Know Thyself',
        application: 'Self-awareness is the foundation of all growth. Understand your patterns.',
        source: 'Ancient Greek maxim',
      },
      {
        principle: 'This Too Shall Pass',
        application: 'All things are impermanent. Good times and bad times both end.',
        source: 'Persian adage',
      },
      {
        principle: 'First Principles',
        application: 'Question assumptions. Reason from fundamentals, not analogy.',
        source: 'Aristotle',
      },
      {
        principle: 'Compound Interest',
        application: 'Small improvements compound dramatically over time. Consistency beats intensity.',
        source: 'Einstein (attributed)',
      },
      {
        principle: 'The Map Is Not The Territory',
        application: 'Models are useful but imperfect. Don\'t confuse your map with reality.',
        source: 'Alfred Korzybski',
      },
    ],
  },
};

// =============================================================================
// PATHOS: CARDINAL VIRTUES
// =============================================================================

/**
 * The four Stoic cardinal virtues with details
 */
export const CARDINAL_VIRTUES: Record<
  CardinalVirtue,
  {
    name: string;
    greekName: string;
    description: string;
    manifestations: string[];
    opposites: string[];
    questions: string[];
  }
> = {
  WISDOM: {
    name: 'Wisdom',
    greekName: 'Sophia (σοφία)',
    description: 'Practical wisdom and good judgment in navigating complex situations',
    manifestations: [
      'Making sound decisions under uncertainty',
      'Learning from experience and mistakes',
      'Knowing what is truly important',
      'Seeing through complexity to essentials',
    ],
    opposites: ['Foolishness', 'Ignorance', 'Impulsiveness'],
    questions: [
      'Is this decision based on sound reasoning?',
      'What would a wise mentor advise?',
      'Am I considering all relevant factors?',
    ],
  },

  COURAGE: {
    name: 'Courage',
    greekName: 'Andreia (ἀνδρεία)',
    description: 'Moral courage to act rightly despite fear, difficulty, or opposition',
    manifestations: [
      'Acting despite fear when action is right',
      'Speaking truth even when unpopular',
      'Persevering through difficulty',
      'Standing up for principles',
    ],
    opposites: ['Cowardice', 'Recklessness', 'Timidity'],
    questions: [
      'Am I avoiding this out of fear?',
      'What would I do if I weren\'t afraid?',
      'Does this require courage I\'m not showing?',
    ],
  },

  JUSTICE: {
    name: 'Justice',
    greekName: 'Dikaiosyne (δικαιοσύνη)',
    description: 'Fairness, integrity, and giving each person their due',
    manifestations: [
      'Treating others fairly and equitably',
      'Keeping promises and commitments',
      'Taking responsibility for actions',
      'Contributing to the common good',
    ],
    opposites: ['Injustice', 'Unfairness', 'Selfishness'],
    questions: [
      'Is this fair to everyone affected?',
      'Am I treating others as I would want to be treated?',
      'Would I be comfortable if this decision was public?',
    ],
  },

  TEMPERANCE: {
    name: 'Temperance',
    greekName: 'Sophrosyne (σωφροσύνη)',
    description: 'Self-control, moderation, and balance in all things',
    manifestations: [
      'Restraint in pleasures and desires',
      'Balance between extremes',
      'Patience and measured response',
      'Discipline in habits',
    ],
    opposites: ['Excess', 'Indulgence', 'Impulsivity'],
    questions: [
      'Am I acting out of impulse or principle?',
      'Is this balanced and moderate?',
      'Am I showing proper restraint?',
    ],
  },
};

// =============================================================================
// EMOTIONAL STATE MAPPINGS
// =============================================================================

/**
 * Map VAD (Valence-Arousal-Dominance) values to emotion labels
 */
export const EMOTION_MAPPINGS: Array<{
  name: string;
  valence: { min: number; max: number };
  arousal: { min: number; max: number };
  dominance: { min: number; max: number };
  riskToDecision: number;
  description: string;
}> = [
  {
    name: 'Euphoria',
    valence: { min: 0.6, max: 1.0 },
    arousal: { min: 0.7, max: 1.0 },
    dominance: { min: 0.6, max: 1.0 },
    riskToDecision: 0.7,
    description: 'High positive emotion that may lead to overconfidence and risk-taking',
  },
  {
    name: 'Joy',
    valence: { min: 0.4, max: 0.8 },
    arousal: { min: 0.3, max: 0.7 },
    dominance: { min: 0.4, max: 0.8 },
    riskToDecision: 0.2,
    description: 'Positive emotion with moderate energy, generally good for decisions',
  },
  {
    name: 'Contentment',
    valence: { min: 0.2, max: 0.6 },
    arousal: { min: 0.0, max: 0.4 },
    dominance: { min: 0.4, max: 0.7 },
    riskToDecision: 0.1,
    description: 'Calm positive state, excellent for thoughtful decision-making',
  },
  {
    name: 'Anxiety',
    valence: { min: -0.6, max: -0.1 },
    arousal: { min: 0.5, max: 0.9 },
    dominance: { min: 0.0, max: 0.4 },
    riskToDecision: 0.6,
    description: 'Negative aroused state that may lead to avoidance or rushed decisions',
  },
  {
    name: 'Fear',
    valence: { min: -0.8, max: -0.3 },
    arousal: { min: 0.6, max: 1.0 },
    dominance: { min: 0.0, max: 0.3 },
    riskToDecision: 0.8,
    description: 'Intense negative emotion that impairs rational thinking',
  },
  {
    name: 'Anger',
    valence: { min: -0.7, max: -0.2 },
    arousal: { min: 0.6, max: 1.0 },
    dominance: { min: 0.5, max: 1.0 },
    riskToDecision: 0.75,
    description: 'High arousal negative state with high dominance, leads to aggressive decisions',
  },
  {
    name: 'Sadness',
    valence: { min: -0.8, max: -0.2 },
    arousal: { min: 0.0, max: 0.4 },
    dominance: { min: 0.0, max: 0.4 },
    riskToDecision: 0.4,
    description: 'Low energy negative state, may lead to pessimistic decisions',
  },
  {
    name: 'Boredom',
    valence: { min: -0.3, max: 0.1 },
    arousal: { min: 0.0, max: 0.3 },
    dominance: { min: 0.3, max: 0.6 },
    riskToDecision: 0.3,
    description: 'Low arousal neutral state, may lead to impulsive decisions for stimulation',
  },
  {
    name: 'Neutral',
    valence: { min: -0.2, max: 0.2 },
    arousal: { min: 0.2, max: 0.5 },
    dominance: { min: 0.4, max: 0.6 },
    riskToDecision: 0.1,
    description: 'Balanced state, optimal for rational decision-making',
  },
  {
    name: 'Excitement',
    valence: { min: 0.3, max: 0.8 },
    arousal: { min: 0.6, max: 0.9 },
    dominance: { min: 0.4, max: 0.8 },
    riskToDecision: 0.5,
    description: 'Positive high arousal, may lead to rushed but optimistic decisions',
  },
];

// =============================================================================
// SYSTEMS THINKING: MEADOWS 12 LEVERAGE POINTS
// =============================================================================

/**
 * Donella Meadows' 12 leverage points in ascending order of effectiveness
 */
export const LEVERAGE_POINTS = [
  {
    level: 12,
    name: 'Constants, parameters, numbers',
    effectiveness: 'low',
    description: 'Changing numbers (e.g., subsidies, taxes, standards)',
    example: 'Adjusting tax rates or speed limits',
  },
  {
    level: 11,
    name: 'Sizes of buffers and stabilizing stocks',
    effectiveness: 'low',
    description: 'Building reserves, slack, and buffers',
    example: 'Emergency funds, inventory levels',
  },
  {
    level: 10,
    name: 'Structure of material stocks and flows',
    effectiveness: 'medium',
    description: 'Changing physical structure of the system',
    example: 'Redesigning transportation infrastructure',
  },
  {
    level: 9,
    name: 'Lengths of delays',
    effectiveness: 'medium',
    description: 'Changing the timing of feedback',
    example: 'Shortening time to get customer feedback',
  },
  {
    level: 8,
    name: 'Strength of negative feedback loops',
    effectiveness: 'medium',
    description: 'Strengthening balancing/corrective mechanisms',
    example: 'Installing thermostats, checks and balances',
  },
  {
    level: 7,
    name: 'Gain around driving positive feedback loops',
    effectiveness: 'medium',
    description: 'Slowing or accelerating reinforcing loops',
    example: 'Limiting viral growth, compounding interest',
  },
  {
    level: 6,
    name: 'Structure of information flows',
    effectiveness: 'high',
    description: 'Who has access to what information',
    example: 'Making pollution data public',
  },
  {
    level: 5,
    name: 'Rules of the system',
    effectiveness: 'high',
    description: 'Incentives, punishments, constraints',
    example: 'Changing laws, contracts, protocols',
  },
  {
    level: 4,
    name: 'Power to add, change, evolve, or self-organize system structure',
    effectiveness: 'high',
    description: 'Ability to change the system\'s own rules',
    example: 'Constitutional amendments, learning organizations',
  },
  {
    level: 3,
    name: 'Goals of the system',
    effectiveness: 'high',
    description: 'The purpose or function of the system',
    example: 'Shifting from profit maximization to sustainability',
  },
  {
    level: 2,
    name: 'Mindset or paradigm out of which the system arises',
    effectiveness: 'transformative',
    description: 'The shared beliefs and assumptions',
    example: 'Changing from growth mindset to circular economy',
  },
  {
    level: 1,
    name: 'Power to transcend paradigms',
    effectiveness: 'transformative',
    description: 'Realizing no paradigm is absolutely true',
    example: 'Understanding that all models are mental constructs',
  },
] as const;

// =============================================================================
// FRAMEWORK METADATA
// =============================================================================

/**
 * All cognitive frameworks with their metadata
 */
export const COGNITIVE_FRAMEWORKS = {
  // LOGOS
  BAYESIAN: {
    pillar: 'LOGOS',
    name: 'Bayesian Reasoning',
    fullName: 'Bayesian Reasoning (Bayes, 1763)',
    description: 'Update beliefs based on evidence using probability theory',
    whenToUse: 'When you need to update your beliefs based on new evidence',
    apis: ['updateBelief', 'calculatePosterior', 'updateBeliefSequential'],
  },
  EXPECTED_VALUE: {
    pillar: 'LOGOS',
    name: 'Expected Value',
    fullName: 'Expected Value Theory',
    description: 'Calculate the average outcome of decisions weighted by probability',
    whenToUse: 'When comparing alternatives with different probabilities and payoffs',
    apis: ['calculateExpectedValue', 'rankDecisions'],
  },
  KELLY: {
    pillar: 'LOGOS',
    name: 'Kelly Criterion',
    fullName: 'Kelly Criterion (Kelly, 1956)',
    description: 'Optimal position sizing to maximize long-term growth',
    whenToUse: 'When deciding how much to invest or bet on an opportunity',
    apis: ['calculateKellyFraction', 'assessRiskOfRuin'],
  },
  DECISION_TREE: {
    pillar: 'LOGOS',
    name: 'Decision Trees',
    fullName: 'Decision Tree Analysis (Backward Induction)',
    description: 'Map out sequential decisions and find optimal paths',
    whenToUse: 'When decisions have multiple stages or depend on chance events',
    apis: ['analyzeDecisionTree'],
  },
  SYSTEMS_THINKING: {
    pillar: 'LOGOS',
    name: 'Systems Thinking',
    fullName: 'Systems Thinking (Donella Meadows)',
    description: 'Understand complex systems through feedback loops and leverage points',
    whenToUse: 'When dealing with complex, interconnected problems',
    apis: ['identifyLeveragePoints', 'analyzeFeedbackLoops'],
  },
  ANTIFRAGILITY: {
    pillar: 'LOGOS',
    name: 'Antifragility',
    fullName: 'Antifragility (Taleb, 2012)',
    description: 'Assess whether things gain or lose from volatility',
    whenToUse: 'When evaluating resilience or positioning for uncertainty',
    apis: ['analyzeAntifragility'],
  },

  // ETHOS
  BIAS_DETECTION: {
    pillar: 'ETHOS',
    name: 'Bias Detection',
    fullName: 'Cognitive Bias Detection (Kahneman & Tversky)',
    description: 'Detect systematic errors in thinking',
    whenToUse: 'Before making important decisions to check for blind spots',
    apis: ['detectCognitiveBias'],
  },
  EMOTIONAL_STATE: {
    pillar: 'ETHOS',
    name: 'Emotional State',
    fullName: "Russell's Circumplex Model (VAD)",
    description: 'Assess emotional state and its risk to decision quality',
    whenToUse: 'To check if current emotional state is suitable for decisions',
    apis: ['checkEmotionalState', 'calculateEmotionalRisk'],
  },
  FEAR_GREED: {
    pillar: 'ETHOS',
    name: 'Fear/Greed Detection',
    fullName: 'Trading Psychology (Mark Douglas)',
    description: 'Detect destructive emotional patterns in decision-making',
    whenToUse: 'When noticing potential emotional trading or decision patterns',
    apis: ['detectFearGreedCycle'],
  },
  DISCIPLINE: {
    pillar: 'ETHOS',
    name: 'Discipline System',
    fullName: 'Pre-Decision Discipline System',
    description: 'Comprehensive pre-decision checklist for disciplined decisions',
    whenToUse: 'Before any significant decision to ensure readiness',
    apis: ['checkDiscipline'],
  },

  // PATHOS
  CBT: {
    pillar: 'PATHOS',
    name: 'CBT Reframing',
    fullName: 'Cognitive Behavioral Therapy (Beck, 1960s)',
    description: 'Detect and reframe cognitive distortions in thinking',
    whenToUse: 'When noticing negative or distorted thought patterns',
    apis: ['reframeThought'],
  },
  STOIC: {
    pillar: 'PATHOS',
    name: 'Stoic Philosophy',
    fullName: 'Dichotomy of Control (Epictetus, ~125 AD)',
    description: 'Separate controllable from uncontrollable factors',
    whenToUse: 'When feeling overwhelmed or anxious about a situation',
    apis: ['analyzeDichotomy', 'checkVirtueAlignment'],
  },
  REFLECTION: {
    pillar: 'PATHOS',
    name: 'Reflection Engine',
    fullName: 'Reflection Engine (Kolb Learning Cycle, 1984)',
    description: 'Extract insights and principles from experiences',
    whenToUse: 'After outcomes are known, to learn from experience',
    apis: ['reflectOnOutcome', 'synthesizeLearning'],
  },
  WISDOM: {
    pillar: 'PATHOS',
    name: 'Wisdom Index',
    fullName: 'Wisdom Traditions',
    description: 'Query timeless principles from wisdom traditions',
    whenToUse: 'When seeking guidance from proven wisdom',
    apis: ['consultWisdom'],
  },
  META_LEARNING: {
    pillar: 'PATHOS',
    name: 'Meta-Learning',
    fullName: 'Deliberate Practice (Ericsson, 2016)',
    description: 'Create structured plans for skill acquisition',
    whenToUse: 'When wanting to systematically improve a skill',
    apis: ['createLearningPlan'],
  },
} as const;

// =============================================================================
// THRESHOLDS AND DEFAULTS
// =============================================================================

export const COGNITIVE_THRESHOLDS = {
  // Bias detection
  BIAS_SEVERITY_LOW: 0.3,
  BIAS_SEVERITY_MODERATE: 0.5,
  BIAS_SEVERITY_HIGH: 0.7,
  BIAS_SEVERITY_CRITICAL: 0.85,

  // Emotional risk
  EMOTIONAL_RISK_LOW: 0.3,
  EMOTIONAL_RISK_MODERATE: 0.5,
  EMOTIONAL_RISK_HIGH: 0.7,
  EMOTIONAL_RISK_CRITICAL: 0.85,

  // Discipline
  DISCIPLINE_PASS_THRESHOLD: 0.6,
  DISCIPLINE_CAUTION_THRESHOLD: 0.5,

  // Kelly
  KELLY_AGGRESSIVE_THRESHOLD: 0.3,
  KELLY_VERY_AGGRESSIVE_THRESHOLD: 0.5,

  // Confidence
  MIN_CONFIDENCE: 0.5,
  HIGH_CONFIDENCE: 0.85,

  // Learning
  INSIGHT_HIGH_PRIORITY_THRESHOLD: 0.8,
  LEARNING_IMPROVEMENT_GOOD: 0.05,
  LEARNING_IMPROVEMENT_EXCELLENT: 0.1,
} as const;

export const COGNITIVE_DEFAULTS = {
  // Performance
  API_TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,

  // Learning loop schedule (cron expressions)
  PERFORMANCE_REVIEW_SCHEDULE: '0 21 * * *', // 9 PM daily
  GAP_ANALYSIS_SCHEDULE: '0 20 * * 0', // Sunday 8 PM
  SELF_ASSESSMENT_SCHEDULE: '0 9 1 * *', // 1st of month, 9 AM

  // Insight generation
  MIN_INSIGHTS_PER_REVIEW: 1,
  MAX_INSIGHTS_PER_REVIEW: 10,

  // Knowledge
  MAX_KNOWLEDGE_SOURCES: 100,
  MIN_SOURCES_PER_FRAMEWORK: 3,
} as const;
