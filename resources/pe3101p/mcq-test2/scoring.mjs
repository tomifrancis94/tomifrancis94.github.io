// Section state and scoring for the Test 2 practice quiz. No DOM here.
// The page (quiz.mjs) sees questions only through PracticeSection.question(), which never
// includes the answer or explanation; result() and review() return null until submit().
import {sections as DATA} from './questions.mjs';

export const POINTS = {correct: 4, incorrect: -4 / 3, unanswered: 0};

// Marks are kept in thirds (correct +12, incorrect -4) so the arithmetic is exact.
export function score(answers, key) {
  let correct = 0, incorrect = 0, unanswered = 0;
  key.forEach((k, i) => {
    const a = answers[i];
    if (a === null || a === undefined) unanswered++;
    else if (a === k) correct++;
    else incorrect++;
  });
  const thirds = 12 * correct - 4 * incorrect, max = 4 * key.length;
  return {correct, incorrect, unanswered, marks: thirds / 3, max, percent: Math.round(thirds * 100 / (3 * max)) + 0};
}

const minus = s => s.replace(/^-/, '−');
export function formatMarks(marks) {
  const r = Math.round(marks * 10) / 10;
  return minus(Number.isInteger(r) ? String(r + 0) : r.toFixed(1));
}
export function formatScore(result) {
  return `${formatMarks(result.marks)} / ${result.max} (${minus(String(result.percent))}%)`;
}

export const sectionList = DATA.map((s, index) => ({index, title: s.title, count: s.items.length}));

const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export class PracticeSection {
  #items; #answers; #submitted = false;
  constructor(index) {
    const data = DATA[index];
    if (!data) throw new Error('No section ' + index);
    this.index = index;
    this.title = data.title;
    this.#items = data.items;
    this.#answers = this.#items.map(() => null);
  }
  get length() { return this.#items.length; }
  get submitted() { return this.#submitted; }
  get answers() { return [...this.#answers]; }
  answeredCount() { return this.#answers.filter(a => a !== null).length; }
  unanswered() { return this.#answers.flatMap((a, i) => a === null ? [i + 1] : []); }

  // What the page may show while the section is open: no answer, no explanation.
  question(i) {
    const item = this.#items[i];
    if (!item) return null;
    const view = {number: i + 1, total: this.#items.length, id: item.id, format: item.format, stem: item.stem,
      options: [...item.options], selected: this.#answers[i]};
    if (item.table) view.table = copy(item.table);
    return view;
  }

  choose(i, option) {
    if (this.#submitted || !this.#items[i] || !Number.isInteger(option) || option < 0 || option >= this.#items[i].options.length) return false;
    this.#answers[i] = option;
    return true;
  }
  clear(i) {
    if (this.#submitted || !this.#items[i]) return false;
    this.#answers[i] = null;
    return true;
  }
  submit() { this.#submitted = true; return this.result(); }
  restart() { this.#submitted = false; this.#answers = this.#items.map(() => null); }

  result() {
    if (!this.#submitted) return null;
    return score(this.#answers, this.#items.map(item => item.answer));
  }

  // After submission: the questions answered wrongly or not at all, with the correct answer and explanation.
  review() {
    if (!this.#submitted) return null;
    return this.#items.flatMap((item, i) => {
      const selected = this.#answers[i];
      if (selected === item.answer) return [];
      return [{...this.question(i), status: selected === null ? 'unanswered' : 'incorrect',
        lecture: item.lecture, topic: item.topic, correct: item.answer, explanation: item.explanation}];
    });
  }

  // Saving and restoring in-progress work (the page keeps this in localStorage when it can).
  snapshot() { return {ids: this.#items.map(item => item.id), answers: [...this.#answers], submitted: this.#submitted}; }
  restore(saved) {
    if (!saved || !Array.isArray(saved.ids) || !Array.isArray(saved.answers)) return false;
    const ids = this.#items.map(item => item.id);
    if (saved.ids.length !== ids.length || saved.ids.some((id, i) => id !== ids[i])) return false;
    if (saved.answers.length !== ids.length) return false;
    const ok = saved.answers.every((a, i) => a === null || (Number.isInteger(a) && a >= 0 && a < this.#items[i].options.length));
    if (!ok) return false;
    this.#answers = [...saved.answers];
    this.#submitted = saved.submitted === true;
    return true;
  }
}
