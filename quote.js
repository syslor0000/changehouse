const initialized = new WeakMap();
const won = value => new Intl.NumberFormat('ko-KR').format(value) + '원';
// Edit this one range to extend all six native, scrollable price selectors.
export const PRICE_OPTIONS = Object.freeze({ min: 0, max: 3000000, step: 10000, defaultAmount: 400000 });
const priceLabel = value => value === 0 ? '0원' : `${new Intl.NumberFormat('ko-KR').format(value / 10000)}만 원`;
const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/** All values live only in this form until the user explicitly copies them. */
export function initQuote(root = document) {
  const form = root.querySelector('#cq-quote-form');
  const dialog = root.querySelector('#cq-request-dialog');
  if (!form || !dialog) return null;
  if (initialized.has(form)) return initialized.get(form);
  const q = selector => form.querySelector(selector);
  const dq = selector => dialog.querySelector(selector);
  const choices = [...form.querySelectorAll('[data-cq-space]')];
  const prices = [...form.querySelectorAll('[data-cq-price]')];
  prices.forEach(select => {
    const current = select.value;
    const wasInitialized = select.dataset.cqPriceReady === 'true';
    const options = [new Option('상담 후 결정', '')];
    for (let amount = PRICE_OPTIONS.min; amount <= PRICE_OPTIONS.max; amount += PRICE_OPTIONS.step) {
      options.push(new Option(priceLabel(amount), String(amount)));
    }
    select.replaceChildren(...options);
    // One configuration controls defaults; reinitialization preserves a choice.
    select.value = wasInitialized && options.some(option => option.value === current) ? current : String(PRICE_OPTIONS.defaultAmount);
    select.dataset.cqPriceReady = 'true';
  });
  const radios = [...form.querySelectorAll('[name="cq-request-type"]')];
  const visitFields = q('#cq-visit-fields');
  const dateField = q('#cq-visit-date');
  const timeField = q('#cq-visit-time');
  const locationField = q('#cq-visit-location');
  const nameField = q('#cq-customer-name');
  const phoneField = q('#cq-customer-phone');
  const memoField = q('#cq-customer-memo');
  const formError = q('#cq-form-error');
  const spacesError = q('#cq-spaces-error');
  const total = q('[data-cq-total]');
  const totalNote = q('[data-cq-total-note]');
  q('[data-cq-price-help]').textContent = `공간별 기본 ${priceLabel(PRICE_OPTIONS.defaultAmount)} · ${priceLabel(PRICE_OPTIONS.step)} 단위로 선택해요. 미정인 경우 ‘상담 후 결정’을 선택해 주세요.`;
  const copyStatus = dq('[data-cq-status]');
  const textArea = dq('[data-cq-text]');
  const submit = q('[type="submit"]');
  const controller = new AbortController();
  const on = (el, type, callback) => el.addEventListener(type, callback, { signal: controller.signal });
  let summaryText = '';
  let returnFocus = null;

  function readPrice(input) {
    if (input.value.trim() === '') return { amount: null, error: '' };
    const amount = Number(input.value);
    if (!Number.isSafeInteger(amount) || amount < PRICE_OPTIONS.min || amount > PRICE_OPTIONS.max || (amount - PRICE_OPTIONS.min) % PRICE_OPTIONS.step !== 0) {
      return { amount: null, error: `${priceLabel(PRICE_OPTIONS.min)}부터 ${priceLabel(PRICE_OPTIONS.max)} 사이에서 ${priceLabel(PRICE_OPTIONS.step)} 단위로 선택해 주세요.` };
    }
    return { amount, error: '' };
  }

  function setValidity(field, message) {
    field.setCustomValidity(message);
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function selection() {
    return choices.filter(choice => choice.checked).map(choice => {
      const input = prices.find(price => price.dataset.cqPrice === choice.dataset.cqSpace);
      return { name: choice.value, input, ...readPrice(input) };
    });
  }

  function updateAmounts() {
    choices.forEach(choice => {
      const input = prices.find(price => price.dataset.cqPrice === choice.dataset.cqSpace);
      const card = choice.closest('.cq-space');
      const error = card.querySelector('.cq-price-error');
      input.disabled = !choice.checked;
      input.setAttribute('aria-label', `${choice.value} 금액 선택, ${priceLabel(PRICE_OPTIONS.step)} 단위`);
      card.querySelector('.cq-price-label span').textContent = `${priceLabel(PRICE_OPTIONS.step)} 단위`;
      card.classList.toggle('is-selected', choice.checked);
      const state = choice.checked ? readPrice(input) : { error: '' };
      setValidity(input, state.error);
      error.textContent = state.error;
      error.hidden = !state.error;
    });
    const rows = selection();
    const invalid = rows.some(row => row.error);
    const priced = rows.filter(row => row.amount !== null && !row.error);
    const unknown = rows.filter(row => row.amount === null && !row.error).length;
    total.textContent = invalid ? '금액 확인 필요' : priced.length ? won(priced.reduce((sum, row) => sum + row.amount, 0)) : '금액 미정';
    totalNote.textContent = !rows.length ? '공간을 선택하면 선택한 금액을 더해드려요.' : invalid ? '표시된 금액을 확인해 주세요.' : `${rows.length}개 공간 선택 · ${priced.length}개 금액 선택${unknown ? ` · ${unknown}개 금액 미정` : ''}`;
    if (rows.length) spacesError.hidden = true;
  }

  function updateType() {
    const visit = q('[name="cq-request-type"]:checked').value === 'visit';
    visitFields.hidden = !visit;
    [dateField, timeField, locationField].forEach(field => {
      field.disabled = !visit;
      setValidity(field, '');
    });
    dateField.required = visit;
    timeField.required = visit;
    dateField.min = localDate();
  }

  function verifyOptionalText(field, label) {
    const onlySpace = field.value !== '' && field.value.trim() === '';
    setValidity(field, onlySpace ? `${label}에 공백만 입력되어 있어요. 내용을 입력하거나 비워 주세요.` : '');
  }

  function validate() {
    formError.hidden = true;
    updateAmounts();
    const visit = q('[name="cq-request-type"]:checked').value === 'visit';
    dateField.min = localDate();
    [nameField, phoneField, memoField, locationField].forEach(field => setValidity(field, ''));
    verifyOptionalText(nameField, '이름');
    verifyOptionalText(phoneField, '전화번호');
    verifyOptionalText(memoField, '남기실 말씀');
    if (visit) verifyOptionalText(locationField, '방문 위치');
    const phone = phoneField.value.trim();
    if (phone && (!/^[+\d()\s-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
      setValidity(phoneField, '연락 가능한 전화번호를 숫자와 하이픈으로 입력해 주세요.');
    }
    if (visit) {
      setValidity(dateField, !dateField.value ? '방문 희망일을 선택해 주세요.' : dateField.value < localDate() ? '오늘 이후의 방문 희망일을 선택해 주세요.' : '');
      setValidity(timeField, !timeField.value ? '희망 시간을 선택해 주세요.' : '');
    }
    if (!choices.some(choice => choice.checked)) {
      spacesError.hidden = false;
      formError.textContent = '정리가 필요한 공간을 하나 이상 선택해 주세요.';
      formError.hidden = false;
      choices[0].focus();
      return false;
    }
    if (!form.checkValidity()) {
      const invalid = [...form.elements].find(field => field.willValidate && !field.validity.valid);
      formError.textContent = invalid?.validationMessage || '입력 내용을 확인해 주세요.';
      formError.hidden = false;
      form.reportValidity();
      return false;
    }
    return true;
  }

  function summaryValue(name, value) {
    dq(`[data-cq-summary="${name}"]`).textContent = value;
  }

  function createSummary() {
    const rows = selection();
    const priced = rows.filter(row => row.amount !== null);
    const unknown = rows.length - priced.length;
    const sum = priced.reduce((value, row) => value + row.amount, 0);
    const visit = q('[name="cq-request-type"]:checked').value === 'visit';
    const type = visit ? '방문견적' : '전화상담';
    const sumText = priced.length ? won(sum) : '금액 미정 (선택된 금액 없음)';
    const unknownText = unknown ? `${unknown}개 공간 · 상담 후 결정` : '없음 · 모든 선택 공간에 금액 선택';
    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const customer = [name && `이름: ${name}`, phone && `전화: ${phone}`].filter(Boolean).join('\n') || '미입력 · 카카오톡 또는 전화로 직접 문의';
    const memo = memoField.value.trim() || '없음';
    const date = dateField.value;
    const time = timeField.value;
    const location = locationField.value.trim() || '미입력';
    summaryValue('type', type);
    summaryValue('total', sumText);
    summaryValue('unknown', unknownText);
    summaryValue('customer', customer);
    summaryValue('memo', memo);
    const list = dq('[data-cq-summary="areas"]');
    list.replaceChildren(...rows.map(row => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      const amount = document.createElement('span');
      label.textContent = row.name;
      amount.textContent = row.amount === null ? '상담 후 결정' : won(row.amount);
      item.append(label, amount);
      return item;
    }));
    dialog.querySelectorAll('[data-cq-visit-summary]').forEach(el => { el.hidden = !visit; });
    dq('[data-cq-visit-notice]').hidden = !visit;
    summaryValue('visit', visit ? `${date} · ${time}\n희망 일정 · 상담 후 확정` : '');
    summaryValue('location', visit ? location : '');
    const lines = [
      '체인지하우스 상담 요청',
      `상담 유형: ${type}`,
      '대표 연락처: 조미 · 010-9291-7820',
      '',
      '[정리가 필요한 공간]',
      ...rows.map(row => `- ${row.name}: ${row.amount === null ? '상담 후 결정 (금액 미정)' : won(row.amount)}`),
      '',
      `선택 금액 합계: ${sumText}`,
      `금액 미정: ${unknown}개 공간`,
      ...(unknown ? ['미정 금액은 합계에 포함되지 않았습니다.'] : []),
      ...(visit ? ['', '[방문 희망 일정]', `희망일: ${date}`, `희망 시간: ${time}`, `지역 · 방문 위치: ${location}`, '방문 희망일은 요청사항이며, 상담 후 실제 일정이 확정됩니다.'] : []),
      '', '[고객 연락정보]', customer, '', '[남기실 말씀]', memo,
    ];
    summaryText = lines.join('\n');
    textArea.value = summaryText;
    copyStatus.textContent = '';
    dq('.cq-text-details').open = false;
  }

  on(form, 'submit', event => {
    event.preventDefault();
    if (!validate()) return;
    createSummary();
    returnFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    dq('[data-cq-close]').focus();
  });
  const clearFormError = callback => () => { formError.hidden = true; callback(); };
  choices.forEach(choice => on(choice, 'change', clearFormError(updateAmounts)));
  prices.forEach(price => on(price, 'change', clearFormError(updateAmounts)));
  radios.forEach(radio => on(radio, 'change', clearFormError(updateType)));
  [dateField, timeField, locationField, nameField, phoneField, memoField].forEach(field => on(field, 'input', () => {
    setValidity(field, '');
    formError.hidden = true;
  }));
  on(dq('[data-cq-close]'), 'click', () => dialog.close());
  on(dialog, 'close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  on(dq('[data-cq-copy]'), 'click', async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      copyStatus.textContent = '복사했어요. 카카오톡에 붙여 넣고 직접 보내주세요.';
    } catch {
      dq('.cq-text-details').open = true;
      textArea.focus();
      textArea.select();
      copyStatus.textContent = '자동 복사가 제한되어 있어요. 아래 선택된 내용을 직접 복사해 주세요.';
    }
  });
  updateAmounts();
  updateType();
  submit.disabled = false;
  const api = {
    destroy() {
      controller.abort();
      if (dialog.open) dialog.close();
      submit.disabled = true;
      summaryText = '';
      textArea.value = '';
      initialized.delete(form);
    },
  };
  initialized.set(form, api);
  return api;
}
