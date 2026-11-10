// PE3101P Test 2 practice: the two practice sections.
// Generated on 10 November 2026 by build_questions.mjs from the MCQ Studio file test2-candidates.json
// (stems, tables and options copied exactly) and the student explanations. Do not edit by hand.
export const sections = [
 {
  "title": "Practice set 1",
  "items": [
   {
    "id": "t2c-q01",
    "revision": 1,
    "lecture": 7,
    "topic": "Harsanyi's aggregation theorem",
    "format": "rich",
    "stem": "The numbers are utilities. \\(X\\) is \\((12, 0)[0.25](4, 8)\\) and \\(Y\\) is \\((5, 6)\\) for sure. What does Ex Ante Pareto imply?",
    "options": [
     "\\(Y \\succ X\\)",
     "\\(X \\succ Y\\)",
     "\\(X \\sim Y\\)",
     "Nothing."
    ],
    "answer": 1,
    "explanation": "Ex Ante Pareto compares gambles by how good they are for each person, which here means each person's expected utility. In \\(X\\), person 1 expects \\(0.25 \\times 12 + 0.75 \\times 4 = 6\\) and person 2 expects \\(0.25 \\times 0 + 0.75 \\times 8 = 6\\), so against \\((5, 6)\\) for sure, \\(X\\) is better for person 1 and equally good for person 2, and \\(X \\succ Y\\). It doesn't matter that one outcome of \\(X\\) is worse for someone than \\(Y\\): Ex Ante Pareto looks at each person's prospects before the uncertainty is resolved."
   },
   {
    "id": "t2c-q06",
    "revision": 2,
    "lecture": 7,
    "topic": "Harsanyi's aggregation theorem",
    "format": "rich",
    "stem": "Given the premises of Harsanyi's aggregation theorem and Same Scale (the same utility means the same wellbeing, across people), when must outcomes be ranked by total wellbeing?",
    "options": [
     "When betterness is risk averse about wellbeing.",
     "When betterness is risk neutral about wellbeing.",
     "Whenever utility increases with wellbeing.",
     "Always."
    ],
    "answer": 1,
    "explanation": "Given the premises, the theorem ranks outcomes by their total of utilities. By Same Scale the same utility means the same wellbeing for everyone, so that total ranks outcomes the same way as total wellbeing exactly when utility is a straight line in wellbeing, that is, when betterness is risk neutral about wellbeing. With a risk-averse (concave) curve, or any other curve that isn't a straight line, the two totals can come apart, so the theorem does not deliver total wellbeing \"always\" or \"whenever utility increases with wellbeing\"."
   },
   {
    "id": "t2c-q08",
    "revision": 2,
    "lecture": 8,
    "topic": "Egalitarianism and prioritarianism",
    "format": "rich",
    "stem": "Suppose everyone's utility equals their wellbeing. Which view ranks \\((4, 4)\\) for sure above \\((16, 16)[0.25](0, 0)\\)?",
    "options": [
     "Ex ante prioritarianism.",
     "Utilitarianism.",
     "None of these.",
     "Ex post prioritarianism."
    ],
    "answer": 3,
    "explanation": "Each gamble gives each person an expected wellbeing of 4, so Utilitarianism (an expected total of 8 either way) and ex ante prioritarianism (\\(f(4) + f(4)\\) either way) rank them equally. Ex post prioritarianism takes the expectation of the priority-weighted total: \\(2f(4)\\) for the sure thing against \\(0.25 \\times 2f(16) + 0.75 \\times 2f(0)\\) for the gamble, and since \\(f\\) is strictly concave and \\(4 = 0.25 \\times 16 + 0.75 \\times 0\\), the sure thing scores more. With \\(f(w) = \\sqrt{w}\\), for example, the scores are 4 and 2."
   },
   {
    "id": "t2c-q10",
    "revision": 1,
    "lecture": 8,
    "topic": "Egalitarianism and prioritarianism",
    "format": "rich",
    "stem": "Suppose \\((4, 1, 7) \\succ (4, 5, 2)\\). Which further comparison would violate Separability over Persons?",
    "options": [
     "\\((9, 5, 2) \\succ (9, 1, 7)\\)",
     "\\((9, 1, 7) \\succ (9, 5, 2)\\)",
     "\\((5, 2, 4) \\succ (1, 7, 4)\\)",
     "\\((9, 5, 7) \\succ (9, 1, 2)\\)"
    ],
    "answer": 0,
    "explanation": "Person 1 is at 4 in both outcomes of the given comparison, so Separability over Persons says the verdict can't depend on that level: with person 1 at 9 instead, and persons 2 and 3 as before, \\((9, 1, 7)\\) must still be better than \\((9, 5, 2)\\). Option A reverses that verdict, so it violates Separability. The other options either agree with the given comparison (B) or involve different people (C) or different levels (D), so Separability on its own doesn't link them to it."
   },
   {
    "id": "t2c-q13",
    "revision": 1,
    "lecture": 9,
    "topic": "Calibration and Gini egalitarianism",
    "format": "rich",
    "stem": "With four people, Gini egalitarianism's rank weights are \\(\\tfrac74\\), \\(\\tfrac54\\), \\(\\tfrac34\\) and \\(\\tfrac14\\), from worst off to best off. In \\((16, 20, 30, 120)\\), person 1 loses 12 and person 3 gains \\(G\\), with nobody changing place. For which \\(G\\) is the new outcome equally good?",
    "options": [
     "12",
     "28",
     "20",
     "84"
    ],
    "answer": 1,
    "explanation": "Nobody changes place, so only these two people's weights matter: person 1 is the worst off, with weight \\(\\tfrac74\\), and person 3 is third from the bottom, with weight \\(\\tfrac34\\). Person 1's loss takes away \\(12 \\times \\tfrac74 = 21\\), so person 3's gain must add back 21: \\(G \\times \\tfrac34 = 21\\), so \\(G = 28\\). Using person 2's weight \\(\\tfrac54\\) instead of person 3's gives 20, and using the best-off person's weight \\(\\tfrac14\\) gives 84."
   },
   {
    "id": "t2c-q16",
    "revision": 1,
    "lecture": 9,
    "topic": "Calibration and Gini egalitarianism",
    "format": "rich",
    "stem": "An agent maximises expected utility, with concave utility, and turns down 50–50 lose $1,000 / gain $1,100 at her current wealth. Which further assumption would show that she is extremely risk averse about large gambles?",
    "options": [
     "That she turns it down at every wealth level.",
     "That her utility is the square root of wealth.",
     "That she counts losses more than gains.",
     "That her utility function is bounded above."
    ],
    "answer": 0,
    "explanation": "The calibration argument starts from a concave utility function that turns down the small gamble at *every* wealth level: then the curve must bend over every $1,000 stretch, and over large stretches those bends add up, so she is extremely risk averse about large gambles. Turning it down at her current wealth alone tells us only about the curve near that wealth. Counting losses more than gains is loss aversion, Rabin's alternative explanation of the behaviour, not a premise of the argument; nor are a square-root utility or a bound on utility."
   },
   {
    "id": "t2c-q17",
    "revision": 1,
    "lecture": 10,
    "topic": "Choice functions and the liberal paradox",
    "format": "rich",
    "stem": "The table gives a choice function \\(C\\) on the option sets of \\(x\\), \\(y\\) and \\(z\\). Which condition does \\(C\\) violate?\n[[table]]",
    "table": {
     "headers": [
      "Option set \\(S\\)",
      "\\(\\{x, y\\}\\)",
      "\\(\\{x, z\\}\\)",
      "\\(\\{y, z\\}\\)",
      "\\(\\{x, y, z\\}\\)"
     ],
     "rows": [
      [
       "\\(C(S)\\)",
       "\\(\\{x, y\\}\\)",
       "\\(\\{x\\}\\)",
       "\\(\\{z\\}\\)",
       "\\(\\{x\\}\\)"
      ]
     ]
    },
    "options": [
     "Contraction consistency (Property \\(\\alpha\\)).",
     "Expansion consistency (Property \\(\\gamma\\)).",
     "Property \\(\\beta\\).",
     "None of these."
    ],
    "answer": 2,
    "explanation": "Property \\(\\beta\\) says that if two options are both chosen from an option set, then from any bigger set containing it they stand or fall together. Here \\(x\\) and \\(y\\) are both chosen from \\(\\{x, y\\}\\), but from \\(\\{x, y, z\\}\\) only \\(x\\) is chosen, so \\(\\beta\\) fails. Contraction consistency and expansion consistency both hold in this table, so the answer is \\(\\beta\\), and \"None of these\" misses the failure."
   },
   {
    "id": "t2c-q20",
    "revision": 1,
    "lecture": 10,
    "topic": "Choice functions and the liberal paradox",
    "format": "rich",
    "stem": "Person 1 is decisive over \\(\\{a, b\\}\\) and person 2 over \\(\\{b, c\\}\\). Given Pareto, at which of these rankings can nothing be chosen from \\(\\{a, b, c\\}\\)?",
    "options": [
     "Person 1: \\(a \\succ b \\succ c\\); person 2: \\(c \\succ a \\succ b\\).",
     "Person 1: \\(b \\succ a \\succ c\\); person 2: \\(a \\succ c \\succ b\\).",
     "Person 1: \\(b \\succ a \\succ c\\); person 2: \\(b \\succ c \\succ a\\).",
     "Person 1: \\(b \\succ c \\succ a\\); person 2: \\(c \\succ a \\succ b\\)."
    ],
    "answer": 1,
    "explanation": "In B, person 1 prefers \\(b\\) to \\(a\\), so their right over \\(\\{a, b\\}\\) has \\(b\\) exclude \\(a\\); person 2 prefers \\(c\\) to \\(b\\), so their right over \\(\\{b, c\\}\\) has \\(c\\) exclude \\(b\\); and both prefer \\(a\\) to \\(c\\), so Pareto has \\(a\\) exclude \\(c\\). Every option is excluded by another, so nothing can be chosen from \\(\\{a, b, c\\}\\). In each of the other options, at least one option is excluded by nothing."
   },
   {
    "id": "t2c-q22",
    "revision": 1,
    "lecture": 11,
    "topic": "Arrow's theorem and voting systems",
    "format": "rich",
    "stem": "The table gives the number of voters with each ranking. The Borda count gives an option 2 points for each first place and 1 for each second place. What social ranking does it give?\n[[table]]",
    "table": {
     "headers": [
      "Voters",
      "Ranking"
     ],
     "rows": [
      [
       "4",
       "\\(a \\succ b \\succ c\\)"
      ],
      [
       "3",
       "\\(b \\succ c \\succ a\\)"
      ],
      [
       "2",
       "\\(c \\succ b \\succ a\\)"
      ]
     ]
    },
    "options": [
     "\\(a \\succ b \\succ c\\)",
     "\\(c \\succ b \\succ a\\)",
     "\\(b \\succ c \\succ a\\)",
     "\\(b \\succ a \\succ c\\)"
    ],
    "answer": 3,
    "explanation": "With 2 points for a first place and 1 for a second: \\(a\\) gets \\(4 \\times 2 = 8\\), \\(b\\) gets \\(4 \\times 1 + 3 \\times 2 + 2 \\times 1 = 12\\), and \\(c\\) gets \\(3 \\times 1 + 2 \\times 2 = 7\\). So the Borda count gives \\(b \\succ a \\succ c\\). \\(a \\succ b \\succ c\\) is tempting because \\(a\\) has the most first places, but that is the plurality ranking, not the Borda ranking."
   },
   {
    "id": "t2c-q25",
    "revision": 1,
    "lecture": 11,
    "topic": "Arrow's theorem and voting systems",
    "format": "rich",
    "stem": "The table gives the number of voters with each ranking. Majority voting ranks one option above another when more voters prefer it. How are the three pairs ranked?\n[[table]]",
    "table": {
     "headers": [
      "Voters",
      "Ranking"
     ],
     "rows": [
      [
       "2",
       "\\(x \\succ y \\succ z\\)"
      ],
      [
       "2",
       "\\(y \\succ z \\succ x\\)"
      ],
      [
       "1",
       "\\(z \\succ x \\succ y\\)"
      ]
     ]
    },
    "options": [
     "\\(x \\succ y\\), \\(y \\succ z\\) and \\(z \\succ x\\)",
     "\\(x \\succ y\\), \\(y \\succ z\\) and \\(x \\succ z\\)",
     "\\(y \\succ x\\), \\(y \\succ z\\) and \\(z \\succ x\\)",
     "\\(y \\succ x\\), \\(z \\succ y\\) and \\(x \\succ z\\)"
    ],
    "answer": 0,
    "explanation": "Count each pair separately: \\(x\\) beats \\(y\\) 3 to 2 (the two voters in the first row and the one in the last), \\(y\\) beats \\(z\\) 4 to 1, and \\(z\\) beats \\(x\\) 3 to 2. That is a cycle, as in Condorcet's paradox. Majority voting need not give a transitive ranking, so completing the first two comparisons transitively, as in B, gets the third pair wrong."
   }
  ]
 },
 {
  "title": "Practice set 2",
  "items": [
   {
    "id": "t2c-q03",
    "revision": 1,
    "lecture": 7,
    "topic": "Harsanyi's aggregation theorem",
    "format": "rich",
    "stem": "The numbers are wellbeing levels. A social welfare ordering satisfies Anonymity. It ranks the gamble giving \\((8, 2)\\) on Heads and \\((2, 8)\\) on Tails above \\((8, 2)\\) for sure. Which principle does it violate?",
    "options": [
     "Ex Ante Pareto.",
     "Transitivity.",
     "Separability over Persons.",
     "Statewise Dominance."
    ],
    "answer": 3,
    "explanation": "By Anonymity, \\((2, 8)\\) and \\((8, 2)\\) are equally good, so whichever way the coin lands, \\((8, 2)\\) for sure is at least as good as the gamble. Statewise Dominance then says that \\((8, 2)\\) for sure is at least as good as the gamble, so ranking the gamble above it violates Statewise Dominance. This is the fairness thought behind Diamond's objection; it does not violate Ex Ante Pareto, since person 1 does better with \\((8, 2)\\) for sure and person 2 does better with the gamble."
   },
   {
    "id": "t2c-q42",
    "revision": 1,
    "lecture": 7,
    "topic": "Harsanyi's aggregation theorem",
    "format": "rich",
    "stem": "The numbers are wellbeing levels, and everyone's utility is strictly concave in wellbeing. \\(X\\) is \\((6, 6)\\) for sure and \\(Y\\) is \\((10, 2)[0.5](2, 10)\\). What does Ex Ante Pareto imply?",
    "options": [
     "\\(X \\succ Y\\)",
     "\\(Y \\succ X\\)",
     "\\(X \\sim Y\\)",
     "Nothing."
    ],
    "answer": 0,
    "explanation": "In \\(Y\\), each person gets 10 or 2 with equal chances, so their expected wellbeing is 6, the same as in \\(X\\). But with strictly concave utility, a 50–50 gamble between 10 and 2 has lower expected utility than 6 for sure, so \\(X\\) is better for each person, and Ex Ante Pareto gives \\(X \\succ Y\\). Answering \\(X \\sim Y\\) looks at expected wellbeing, but Ex Ante Pareto goes by what is better for each person, which is expected utility."
   },
   {
    "id": "t2c-q09",
    "revision": 2,
    "lecture": 8,
    "topic": "Egalitarianism and prioritarianism",
    "format": "rich",
    "stem": "Which view says that a change from \\((12, 4)\\) to \\((4, 4)\\) is in one way good?",
    "options": [
     "Prioritarianism.",
     "Telic egalitarianism.",
     "Utilitarianism.",
     "None of these."
    ],
    "answer": 1,
    "explanation": "Telic egalitarianism holds that it is in itself bad if some people are worse off than others, so removing the inequality is in one way good, even if the change is worse all things considered. This is a levelling down case: prioritarianism sees nothing good in it, since nobody's level goes up, and Utilitarianism sees only a loss of 8."
   },
   {
    "id": "t2c-q11",
    "revision": 1,
    "lecture": 8,
    "topic": "Egalitarianism and prioritarianism",
    "format": "rich",
    "stem": "Which of these outcomes does Pigou–Dalton say is better than \\((10, 2, 6)\\)?",
    "options": [
     "\\((3, 9, 6)\\)",
     "\\((10, 1, 7)\\)",
     "\\((9, 3, 6)\\)",
     "\\((9, 2, 6)\\)"
    ],
    "answer": 2,
    "explanation": "Pigou–Dalton counts as an improvement a pure transfer from someone better off to someone worse off that doesn't swap their ranks and leaves everyone else unaffected. \\((9, 3, 6)\\) moves 1 from person 1 (at 10) to person 2 (at 2), and person 1 stays the better off of the two. \\((3, 9, 6)\\) swaps the two people's ranks, \\((10, 1, 7)\\) moves wellbeing to someone better off, and \\((9, 2, 6)\\) is a loss with no gain."
   },
   {
    "id": "t2c-q15",
    "revision": 1,
    "lecture": 9,
    "topic": "Calibration and Gini egalitarianism",
    "format": "rich",
    "stem": "A loss-averse agent counts losses twice as much as gains. For which \\(G\\) does she take the gamble \\((-\\$4{,}000)[0.2](+\\$G)\\)?",
    "options": [
     "\\(G > \\$1{,}000\\)",
     "\\(G > \\$4{,}000\\)",
     "\\(G > \\$8{,}000\\)",
     "\\(G > \\$2{,}000\\)"
    ],
    "answer": 3,
    "explanation": "The agent values changes from where she is now, with losses counting double, so the loss of $4,000 counts as \\(-8{,}000\\). The gamble's value is \\(0.2 \\times (-8{,}000) + 0.8 \\times G = 0.8G - 1{,}600\\), which is positive exactly when \\(G > \\$2{,}000\\). Leaving out the doubling, the probabilities, or both gives the other answers."
   },
   {
    "id": "t2c-q33",
    "revision": 3,
    "lecture": 9,
    "topic": "Calibration and Gini egalitarianism",
    "format": "rich",
    "stem": "Gini egalitarianism's rank weights fall in equal steps from worst off to best off. A pure transfer of 1 from person 2 to person 1 turns \\((10, 20, 30, 100)\\) into \\((11, 19, 30, 100)\\). Which other pure transfer of 1 from one person to another in \\((10, 20, 30, 100)\\) gives an outcome just as good as \\((11, 19, 30, 100)\\)?",
    "options": [
     "From person 3 to person 1: \\((11, 20, 29, 100)\\).",
     "From person 4 to person 1: \\((11, 20, 30, 99)\\).",
     "From person 4 to person 3: \\((10, 20, 31, 99)\\).",
     "From person 4 to person 2: \\((10, 21, 30, 99)\\)."
    ],
    "answer": 2,
    "explanation": "Nobody changes place, so a transfer of 1 changes the Gini value by the receiver's weight minus the giver's weight. The weights fall in equal steps, so every transfer of 1 between people one rank apart gains the same: person 2 to person 1 and person 4 to person 3 are both one step, while the other transfers span two or three steps. It doesn't matter that the gap between persons 3 and 4 is 70 and the gap between persons 1 and 2 is 10: the weights go with rank, not with the size of the gap."
   },
   {
    "id": "t2c-q19",
    "revision": 1,
    "lecture": 10,
    "topic": "Choice functions and the liberal paradox",
    "format": "rich",
    "stem": "Person 1 is decisive over \\(\\{x, y\\}\\) and has \\(y \\succ x \\succ z\\); person 2 has \\(x \\succ z \\succ y\\). Given Pareto, what may be chosen from \\(\\{x, y, z\\}\\)?",
    "options": [
     "\\(\\{x\\}\\)",
     "\\(\\{z\\}\\)",
     "\\(\\{x, y\\}\\)",
     "\\(\\{y\\}\\)"
    ],
    "answer": 3,
    "explanation": "Person 1 prefers \\(y\\) to \\(x\\) and is decisive over \\(\\{x, y\\}\\), so \\(x\\) is excluded. Both people prefer \\(x\\) to \\(z\\), so Pareto excludes \\(z\\). Nothing excludes \\(y\\) (the two disagree about \\(y\\) and \\(z\\)), and something must be chosen, so the choice is \\(\\{y\\}\\)."
   },
   {
    "id": "t2c-q43",
    "revision": 1,
    "lecture": 10,
    "topic": "Choice functions and the liberal paradox",
    "format": "rich",
    "stem": "Person 1 is decisive over \\(\\{x, y\\}\\), and nobody else is decisive over any pair. Can Pareto and person 1's decisiveness together exclude every option in some option set?",
    "options": [
     "Yes: that is Sen's liberal paradox.",
     "No: person 1's favourite in the set is never excluded.",
     "Yes: Pareto can exclude every option on its own.",
     "No: Pareto cannot exclude \\(x\\) or \\(y\\)."
    ],
    "answer": 1,
    "explanation": "Pareto excludes an option only if everyone, person 1 included, prefers something else in the set to it, and person 1's right excludes an option only if person 1 prefers the other member of the pair. So neither ever excludes person 1's favourite option in the set, and something can always be chosen. Sen's liberal paradox needs two people, each decisive over a pair; and Pareto alone cannot exclude every option, since nobody's preferences have cycles."
   },
   {
    "id": "t2c-q23",
    "revision": 2,
    "lecture": 11,
    "topic": "Arrow's theorem and voting systems",
    "format": "rich",
    "stem": "The table gives the number of voters with each ranking. Instant-runoff repeatedly removes the option with the fewest first places, and ranks options in reverse order of removal. What social ranking does it give?\n[[table]]",
    "table": {
     "headers": [
      "Voters",
      "Ranking"
     ],
     "rows": [
      [
       "5",
       "\\(a \\succ c \\succ b\\)"
      ],
      [
       "4",
       "\\(b \\succ c \\succ a\\)"
      ],
      [
       "3",
       "\\(c \\succ b \\succ a\\)"
      ]
     ]
    },
    "options": [
     "\\(a \\succ b \\succ c\\)",
     "\\(c \\succ a \\succ b\\)",
     "\\(c \\succ b \\succ a\\)",
     "\\(b \\succ a \\succ c\\)"
    ],
    "answer": 3,
    "explanation": "First places are \\(a\\) 5, \\(b\\) 4 and \\(c\\) 3, so \\(c\\) is removed first. Its 3 voters rank \\(b\\) next, so \\(b\\) now has 7 first places against \\(a\\)'s 5, and \\(a\\) is removed. Reversing the order of removal (\\(c\\), then \\(a\\), then \\(b\\)) gives \\(b \\succ a \\succ c\\); the order of removal itself, \\(c \\succ a \\succ b\\), is the tempting wrong answer."
   },
   {
    "id": "t2c-q26",
    "revision": 1,
    "lecture": 11,
    "topic": "Arrow's theorem and voting systems",
    "format": "rich",
    "stem": "With three voters, voter 1 has \\(a \\succ c \\succ b\\) and voter 2 has \\(c \\succ b \\succ a\\). Which ranking for voter 3 makes majority voting give a cycle?",
    "options": [
     "\\(b \\succ a \\succ c\\)",
     "\\(a \\succ c \\succ b\\)",
     "\\(c \\succ a \\succ b\\)",
     "\\(b \\succ c \\succ a\\)"
    ],
    "answer": 0,
    "explanation": "With voter 3 at \\(b \\succ a \\succ c\\), \\(a\\) beats \\(c\\) (voters 1 and 3), \\(c\\) beats \\(b\\) (voters 1 and 2), and \\(b\\) beats \\(a\\) (voters 2 and 3): a cycle. With each of the other rankings, one option beats both of the others, so there is no cycle. For example, copying voter 1 gives \\(a\\) a majority over both \\(b\\) and \\(c\\)."
   }
  ]
 }
];
