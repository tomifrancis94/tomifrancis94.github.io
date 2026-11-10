// Page controller for the Test 2 practice quiz. All answers and scoring go through scoring.mjs;
// this file never reads the question data directly.
import {PracticeSection, sectionList, formatScore} from './scoring.mjs';
import {renderMathText, renderInline, renderStem, readableText} from './render.mjs';

const $ = id => document.getElementById(id);
const LETTERS = 'ABCDEFGH';
const STORAGE_KEY = 'pe3101p-mcq-test2-v1';

const sections = sectionList.map(s => new PracticeSection(s.index));
const positions = sections.map(() => 0);
let active = 0;

// ---- storage: optional; the page works without it ----
function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { saved = null; }
  if (!saved || !Array.isArray(saved.sections)) return;
  sections.forEach((section, i) => {
    const s = saved.sections[i];
    if (s && section.restore(s) && Number.isInteger(s.position) && s.position >= 0 && s.position < section.length) positions[i] = s.position;
  });
  if (Number.isInteger(saved.active) && sections[saved.active]) active = saved.active;
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({active,
      sections: sections.map((section, i) => ({...section.snapshot(), position: positions[i]}))}));
  } catch { /* storage unavailable: nothing is kept between visits */ }
}

function announce(message) { $('status').textContent = message; }

// ---- section picker ----
function renderPicker() {
  sections.forEach((section, i) => {
    const button = $('pick-' + i);
    button.setAttribute('aria-pressed', String(i === active));
    const result = section.result();
    const done = section.answeredCount();
    button.querySelector('.pick-status').textContent = result ? 'Submitted: ' + result.percent + '%'
      : done ? done + ' of ' + section.length + ' answered' : 'Not started';
  });
}

// ---- question view ----
function renderMap() {
  const section = sections[active], list = $('qmap');
  list.replaceChildren();
  for (let i = 0; i < section.length; i++) {
    const answered = section.question(i).selected !== null;
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    b.className = 'qmap-button' + (answered ? ' answered' : '');
    b.setAttribute('aria-label', 'Question ' + (i + 1) + (answered ? ', answered' : ', not answered'));
    if (i === positions[active]) b.setAttribute('aria-current', 'step');
    b.addEventListener('click', () => go(i, true));
    li.append(b);
    list.append(li);
  }
}

function renderQuestion(focus) {
  const section = sections[active], i = positions[active], q = section.question(i);
  $('q-heading').textContent = 'Question ' + q.number + ' of ' + q.total;
  renderStem($('stem'), q);
  const fieldset = $('options');
  fieldset.querySelectorAll('.answer').forEach(n => n.remove());
  q.options.forEach((text, k) => {
    const label = document.createElement('label');
    label.className = 'answer' + (q.selected === k ? ' selected' : '');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = String(k);
    input.checked = q.selected === k;
    input.setAttribute('aria-label', LETTERS[k] + '. ' + readableText(text));
    input.addEventListener('change', () => {
      if (!section.choose(i, k)) return;
      fieldset.querySelectorAll('.answer').forEach((n, m) => n.classList.toggle('selected', m === k));
      $('clear').disabled = false;
      save(); renderMap(); renderPicker(); renderSubmitArea();
    });
    const letter = document.createElement('span');
    letter.className = 'answer-letter';
    letter.textContent = LETTERS[k];
    letter.setAttribute('aria-hidden', 'true');
    const content = document.createElement('span');
    content.className = 'answer-content';
    renderMathText(content, text);
    label.append(input, letter, content);
    fieldset.append(label);
  });
  $('clear').disabled = q.selected === null;
  $('prev').disabled = i === 0;
  $('next').disabled = i === section.length - 1;
  renderMap();
  renderSubmitArea();
  if (focus) $('q-heading').focus();
}

function renderSubmitArea() {
  const section = sections[active], missing = section.unanswered();
  $('answered-count').textContent = (section.length - missing.length) + ' of ' + section.length + ' answered.';
  $('submit').textContent = 'Submit ' + section.title + ' and see your score';
  hideConfirm();
}

function hideConfirm() { $('confirm').hidden = true; }

function go(i, focus) {
  const section = sections[active];
  if (i < 0 || i >= section.length) return;
  positions[active] = i;
  save();
  renderQuestion(focus);
}

// ---- submitting and results ----
function requestSubmit() {
  const missing = sections[active].unanswered();
  if (!missing.length) { submit(); return; }
  const list = missing.length === 1 ? 'Question ' + missing[0] : 'Questions ' + missing.slice(0, -1).join(', ') + ' and ' + missing.at(-1);
  $('confirm-text').textContent = (missing.length === 1 ? 'You have not answered ' : 'You have not answered ' + missing.length + ' questions: ')
    + list + '. Unanswered questions score 0. You can submit now or go back to answer.';
  $('confirm-goto').textContent = 'Go to question ' + missing[0];
  $('confirm-goto').dataset.target = String(missing[0] - 1);
  $('confirm').hidden = false;
  $('confirm-submit').focus();
}

function submit() {
  sections[active].submit();
  save();
  show(true);
}

function optionLine(text, k, tags) {
  const li = document.createElement('li');
  li.className = 'review-option' + (tags.includes('correct') ? ' is-correct' : '') + (tags.includes('chosen') && !tags.includes('correct') ? ' is-wrong' : '');
  const letter = document.createElement('span');
  letter.className = 'answer-letter';
  letter.textContent = LETTERS[k];
  const content = document.createElement('span');
  content.className = 'answer-content';
  renderMathText(content, text);
  li.append(letter, content);
  if (tags.length) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = tags.includes('correct') && tags.includes('chosen') ? 'Your answer, correct'
      : tags.includes('correct') ? 'Correct answer' : 'Your answer';
    li.append(tag);
  }
  return li;
}

function renderResults(focus) {
  const section = sections[active], result = section.result(), review = section.review();
  $('results-heading').textContent = section.title + ': your score';
  $('score').textContent = formatScore(result);
  const n = (count, word) => count + ' ' + word;
  $('breakdown').textContent = n(result.correct, 'correct') + ' (+4 each), ' + n(result.incorrect, 'incorrect') + ' (−4/3 each), '
    + n(result.unanswered, 'unanswered') + ' (0 each).';
  $('restart').textContent = 'Start ' + section.title + ' again';
  const other = sections[1 - active];
  $('other-section').hidden = !other;
  if (other) $('other-section').textContent = (other.submitted ? 'See ' : 'Try ') + other.title;
  const root = $('review');
  root.replaceChildren();
  $('review-intro').textContent = review.length
    ? 'Review the ' + (review.length === 1 ? 'question' : review.length + ' questions') + ' you got wrong or left unanswered.'
    : 'You answered every question correctly: nothing to review.';
  for (const r of review) {
    const article = document.createElement('article');
    article.className = 'review-item';
    const h = document.createElement('h3');
    h.textContent = 'Question ' + r.number + ': ' + (r.status === 'unanswered' ? 'not answered' : 'incorrect');
    const meta = document.createElement('p');
    meta.className = 'eyebrow';
    meta.textContent = 'Lecture ' + r.lecture + ' · ' + r.topic;
    const stem = document.createElement('div');
    stem.className = 'stem';
    renderStem(stem, r);
    const ol = document.createElement('ol');
    ol.className = 'review-options';
    r.options.forEach((text, k) => {
      const tags = [];
      if (k === r.selected) tags.push('chosen');
      if (k === r.correct) tags.push('correct');
      ol.append(optionLine(text, k, tags));
    });
    const summary = document.createElement('p');
    summary.className = 'review-summary';
    summary.textContent = (r.selected === null ? 'You did not answer. ' : 'You chose ' + LETTERS[r.selected] + '. ')
      + 'The correct answer is ' + LETTERS[r.correct] + '.';
    const why = document.createElement('div');
    why.className = 'explanation';
    const label = document.createElement('strong');
    label.textContent = 'Why: ';
    why.append(label);
    renderInline(why, r.explanation);
    article.append(h, meta, stem, ol, summary, why);
    root.append(article);
  }
  if (focus) $('results-heading').focus();
}

// ---- switching between the question view and the results ----
function show(focus) {
  const section = sections[active];
  renderPicker();
  $('quiz').hidden = section.submitted;
  $('results').hidden = !section.submitted;
  if (section.submitted) renderResults(focus);
  else renderQuestion(focus);
}

function pick(i) {
  if (i === active) return;
  active = i;
  save();
  show(false);
  announce(sections[i].title + (sections[i].submitted ? ': results.' : ': question ' + (positions[i] + 1) + '.'));
}

function start() {
  load();
  sections.forEach((_, i) => $('pick-' + i).addEventListener('click', () => pick(i)));
  $('prev').addEventListener('click', () => go(positions[active] - 1, true));
  $('next').addEventListener('click', () => go(positions[active] + 1, true));
  $('clear').addEventListener('click', () => {
    if (!sections[active].clear(positions[active])) return;
    save(); renderQuestion(false); renderPicker();
    announce('Answer cleared.');
    $('q-heading').focus();
  });
  $('submit').addEventListener('click', requestSubmit);
  $('confirm-submit').addEventListener('click', submit);
  $('confirm-goto').addEventListener('click', () => go(Number($('confirm-goto').dataset.target), true));
  $('restart').addEventListener('click', () => {
    sections[active].restart();
    positions[active] = 0;
    save();
    show(true);
    announce(sections[active].title + ' restarted: all answers cleared.');
  });
  $('other-section').addEventListener('click', () => { pick(1 - active); (sections[active].submitted ? $('results-heading') : $('q-heading')).focus(); });
  $('app').hidden = false;
  show(false);
}

try { start(); }
catch (error) { announce('The quiz could not load. Please refresh the page to try again.'); console.error(error); }
