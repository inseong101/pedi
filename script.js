function initDashboard() {
    const ASSET_VERSION = '20241007';
    const CHAPTER_BASE = './chapter/';
    const CHAPTERS = [
        { number: '1', title: '서론', file: '1장 서론.md' },
        { number: '2', title: '소아의 진단', file: '2장 소아의 진단.md' },
        { number: '3', title: '성장과 발달', file: '3장 성장과 발달.md' },
        { number: '4', title: '유전', file: null },
        { number: '5', title: '소아의 영양', file: '5장 소아의 영양.md' },
        { number: '6', title: '소아 양생(小兒 養生)', file: '6장 소아 양생(小兒 養生).md' },
        { number: '7', title: '소아 치료법', file: null },
        { number: '8', title: '신생아 및 초생병', file: '8장 신생아 및 초생병.md' },
        { number: '9', title: '감염병', file: '9장 감염병.md' },
        { number: '10', title: '호흡기계의 병증 및 질환', file: '10장 호흡기계의 병증 및 질환.md' },
        { number: '11', title: '소화기계의 병증 및 질환', file: '11장 소화기계의 병증 및 질환.md' },
        { number: '12', title: '신경계의 병증 및 질환', file: '12장 신경계의 병증 및 질환.md' },
        { number: '13', title: '소아청소년기 정신장애', file: '13장 소아청소년기 정신장애.md' },
        { number: '14', title: '심혈관계 병증 및 질환', file: '14장 심혈관계 병증 및 질환.md' },
        { number: '15', title: '간담계의 병증 및 질환', file: '15장 간담계의 병증 및 질환.md' },
        { number: '16', title: '비뇨생식기계의 병증 및 질환', file: '16장 비뇨생식기계의 병증 및 질환.md' },
        { number: '17', title: '알레르기 질환', file: '17장 알레르기 질환.md' },
        { number: '18', title: '면역질환', file: '18장 면역질환.md' },
        { number: '19', title: '근·골격계 질환', file: '19장 근·골격계 질환.md' },
        { number: '20', title: '내분비질환', file: '20장 내분비질환.md' },
        { number: '21', title: '종양', file: '21장 종양.md' },
        { number: '22', title: '피부질환', file: '22장 피부질환.md' },
        { number: '23', title: '안질환', file: '23장 안질환.md' },
        { number: '24', title: '증후', file: '24장 증후.md' },
        { number: '25', title: '급증(손상)', file: null },
        { number: '26', title: '소아의료윤리', file: null }
    ];

    let questionBank = {};
    const parsedCache = new Map();
    const chapterStructure = new Map();
    const itemMetadata = new Map();
    const chapterYearIndex = new Map();
    const chapterStats = new Map();
    const searchIndex = [];
    let years = [];

    const state = {
        activeChapter: null,
        activeYear: 'all',
        activeSectionIndex: null,
        activeItemIndex: null,
        activeItemKey: null
    };

    const openSectionsByChapter = new Map();

    const $matrixTable = document.getElementById('chapter-matrix');
    const $matrixSummary = document.getElementById('matrix-summary');
    const $metricChapters = document.getElementById('metric-chapters');
    const $metricSections = document.getElementById('metric-sections');
    const $metricItems = document.getElementById('metric-items');
    const $metricQuestions = document.getElementById('metric-questions');
    const $globalTitle = document.getElementById('global-toc-title');
    const $searchInput = document.getElementById('search-input');
    const $searchSummary = document.getElementById('search-summary');
    const $searchResults = document.getElementById('search-results');
    const $searchList = document.getElementById('search-list');

    function formatNumber(num) {
        return Number(num || 0).toLocaleString('ko-KR');
    }

    function coalesce(value, fallback) {
        return value === undefined || value === null ? fallback : value;
    }

    function chapterDisplayTitle(chapter) {
        return `제${chapter.number}장 ${chapter.title}`;
    }

    function clearElement(element) {
        if (element) {
            element.innerHTML = '';
        }
    }

    async function loadData() {
        try {
            const response = await fetch(`question_bank.json?v=${ASSET_VERSION}`); 
            if (!response.ok) {
                return false;
            }
            questionBank = await response.json();
            return true;
        } catch (error) {
            console.error('question_bank.json 로드 실패', error);
            return false;
        }
    }

    function parseChapter(md) {
        const sections = [];
        let current = null;
        const lines = md.split(/\r?\n/);

        for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;

            if (line.startsWith('# ')) {
                if (current) sections.push(current);
                const rawTitle = line.replace(/^#\s*/, '');
                const secMatch = rawTitle.match(/^(\d+)절\s*/);
                const sectionNum = secMatch ? secMatch[1] : '0';

                current = {
                    rawTitle,
                    numericalKey: sectionNum,
                    items: []
                };
            } else if (line.startsWith('- ')) {
                if (current) {
                    const itemRaw = line.replace(/^-+\s*/, '').trim();
                    current.items.push(itemRaw);
                }
            }
        }

        if (current) sections.push(current);
        return { sections };
    }

    function getChapterCacheKey(chapter) {
        return chapter.file || `fallback-${chapter.number}`;
    }

    function getNumericalParts(label) {
        const parts = label.match(/\d+/g);
        if (!parts || parts.length < 3) {
            return ['0', '0', '0'];
        }
        return [parts[0], parts[1], parts[2]];
    }

    function buildFallbackChapter(chapterNum) {
        const sectionsMap = new Map();
        const prefix = `${chapterNum} |`;

        Object.entries(questionBank).forEach(([key, entries]) => {
            if (!key.startsWith(prefix)) return;
            const parts = key.split('|').map(part => part.trim());
            const sectionNum = parts[1] || '0';
            const itemNum = parts[2] || '0';
            const questions = Array.isArray(entries) ? entries : [];
            const firstQuestion = questions[0];
            const itemLabel = firstQuestion && firstQuestion.item_key
                ? firstQuestion.item_key
                : `${chapterNum}.${sectionNum}.${itemNum}`;

            if (!sectionsMap.has(sectionNum)) {
                sectionsMap.set(sectionNum, {
                    rawTitle: `제${Number(sectionNum)}절`,
                    numericalKey: sectionNum,
                    items: []
                });
            }

            const section = sectionsMap.get(sectionNum);
            if (!section.items.includes(itemLabel)) {
                section.items.push(itemLabel);
            }
        });

        const sections = Array.from(sectionsMap.entries())
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, section]) => {
                section.items.sort((a, b) => {
                    const [, , aItem] = getNumericalParts(a);
                    const [, , bItem] = getNumericalParts(b);
                    return Number(aItem) - Number(bItem);
                });
                return section;
            });

        return { sections };
    }

    async function ensureChapterParsed(chapter) {
        const cacheKey = getChapterCacheKey(chapter);
        if (parsedCache.has(cacheKey)) {
            return parsedCache.get(cacheKey);
        }

        let parsed;

        if (!chapter.file) {
            parsed = buildFallbackChapter(chapter.number);
        } else {
            try {
                const chapterUrl = `${CHAPTER_BASE}${encodeURIComponent(chapter.file)}?v=${ASSET_VERSION}`;
                const res = await fetch(chapterUrl, { cache: 'no-store' });
                if (!res.ok) throw new Error('fetch failed ' + res.status);
                const md = await res.text();
                parsed = parseChapter(md);
            } catch (error) {
                console.error('장 로드 실패', chapter.file, error);
                parsed = buildFallbackChapter(chapter.number);
            }
        }

        registerChapterStructure(chapter, parsed);
        parsedCache.set(cacheKey, parsed);
        return parsed;
    }

    async function preloadAllChapters() {
        const tasks = CHAPTERS.map((chapter) => ensureChapterParsed(chapter).catch(() => ({ sections: [] })));
        await Promise.all(tasks);
    }

    function registerChapterStructure(chapter, parsed) {
        const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const normalizedSections = sections.map((section, sectionIndex) => {
            const rawTitle = section.rawTitle || `제${Number(section.numericalKey || sectionIndex + 1)}절`;
            const items = Array.isArray(section.items) ? section.items : [];

            const normalizedItems = items.map((label, itemIndex) => {
                const [c, s, i] = getNumericalParts(label);
                const numericalKey = `${c} | ${s} | ${i}`;
                itemMetadata.set(numericalKey, {
                    chapterNumber: chapter.number,
                    chapterTitle: chapterDisplayTitle(chapter),
                    sectionIndex,
                    sectionTitle: rawTitle,
                    itemIndex,
                    label,
                    numericalKey
                });
                return {
                    label,
                    numericalKey,
                    sectionIndex,
                    itemIndex
                };
            });

            return {
                rawTitle,
                numericalKey: section.numericalKey || String(sectionIndex + 1),
                sectionIndex,
                items: normalizedItems
            };
        });

        chapterStructure.set(chapter.number, {
            chapterTitle: chapterDisplayTitle(chapter),
            sections: normalizedSections
        });
    }

    function computeItemStats(numericalKey) {
        const questions = questionBank[numericalKey] || [];
        return { questions: questions.length };
    }

    function computeYearsAndIndex() {
        const yearSet = new Set();
        chapterYearIndex.clear();
        chapterStats.clear();

        const pushToIndex = (key, question) => {
            if (!chapterYearIndex.has(key)) {
                chapterYearIndex.set(key, []);
            }
            chapterYearIndex.get(key).push(question);
        };

        Object.entries(questionBank).forEach(([key, entries]) => {
            if (!Array.isArray(entries) || !entries.length) return;
            const parts = key.split('|').map(part => part.trim());
            const chapterNum = parts[0];
            const sectionNum = parts[1] || '0';
            const itemNum = parts[2] || '0';
            const numericalKey = `${chapterNum} | ${sectionNum} | ${itemNum}`;
            const meta = itemMetadata.get(numericalKey);
            const chapterInfo = CHAPTERS.find(ch => ch.number === chapterNum) || { number: chapterNum, title: '' };
            const chapterTitle = chapterDisplayTitle(chapterInfo);

            entries.forEach(question => {
                const year = (question.id || '').split('-')[0] || '기타';
                yearSet.add(year);

                const augmented = {
                    ...question,
                    chapterNumber: chapterNum,
                    chapterTitle,
                    sectionNumber: sectionNum,
                    sectionTitle: meta ? meta.sectionTitle : '',
                    itemNumber: itemNum,
                    itemLabel: meta ? meta.label : (question.item_key || ''),
                    numericalKey,
                    year
                };

                pushToIndex(`${chapterNum}|${year}`, augmented);
                pushToIndex(`${chapterNum}|all`, augmented);

                if (!chapterStats.has(chapterNum)) {
                    chapterStats.set(chapterNum, { perYear: {}, total: 0, sections: 0, items: 0 });
                }
                const stats = chapterStats.get(chapterNum);
                stats.perYear[year] = (stats.perYear[year] || 0) + 1;
                stats.total += 1;
            });
        });

        years = Array.from(yearSet).sort();

        CHAPTERS.forEach((chapter) => {
            const stats = chapterStats.get(chapter.number) || { perYear: {}, total: 0, sections: 0, items: 0 };
            years.forEach(year => {
                if (!Object.prototype.hasOwnProperty.call(stats.perYear, year)) {
                    stats.perYear[year] = 0;
                }
            });
            const structure = chapterStructure.get(chapter.number);
            if (structure) {
                stats.sections = structure.sections.length;
                stats.items = structure.sections.reduce((sum, section) => sum + section.items.length, 0);
            }
            chapterStats.set(chapter.number, stats);
        });
    }

    function computeGlobalStats() {
        let totalQuestions = 0;
        let totalSections = 0;
        let totalItems = 0;

        CHAPTERS.forEach((chapter) => {
            const stats = chapterStats.get(chapter.number);
            if (stats) {
                totalQuestions += stats.total;
                totalSections += stats.sections;
                totalItems += stats.items;
            }
        });

        return {
            chapters: CHAPTERS.length,
            sections: totalSections,
            items: totalItems,
            questions: totalQuestions
        };
    }

    function updateHeroMetrics(metrics) {
        if ($metricChapters) $metricChapters.textContent = formatNumber(metrics.chapters);
        if ($metricSections) $metricSections.textContent = formatNumber(metrics.sections);
        if ($metricItems) $metricItems.textContent = formatNumber(metrics.items);
        if ($metricQuestions) $metricQuestions.textContent = formatNumber(metrics.questions);
    }

    function getChapterStats(chapterNumber) {
        return chapterStats.get(chapterNumber) || { perYear: {}, total: 0, sections: 0, items: 0 };
    }


    function ensureSectionOpenState(chapterNumber) {
        if (!openSectionsByChapter.has(chapterNumber)) {
            openSectionsByChapter.set(chapterNumber, new Set());
        }
        return openSectionsByChapter.get(chapterNumber);
    }

    function renderMatrix() {
        if (!$matrixTable) return;

        const columns = [...years, 'total'];
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headingCell = document.createElement('th');
        headingCell.scope = 'col';
        headingCell.className = 'matrix-heading matrix-heading--label';
        headingCell.textContent = '장';
        headerRow.appendChild(headingCell);

        columns.forEach((column) => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.className = 'matrix-heading';
            th.textContent = column === 'total' ? '총합' : `${column}년`;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');

        CHAPTERS.forEach((chapter) => {
            const stats = getChapterStats(chapter.number);
            const row = document.createElement('tr');
            row.dataset.chapter = chapter.number;

            const labelCell = document.createElement('th');
            labelCell.scope = 'row';
            labelCell.className = 'matrix-row-label';

            const labelButton = document.createElement('button');
            labelButton.type = 'button';
            labelButton.className = 'matrix-row-toggle';
            if (state.activeChapter === chapter.number) {
                labelButton.classList.add('is-active');
            }
            labelButton.dataset.chapter = chapter.number;
            labelButton.textContent = chapterDisplayTitle(chapter);
            labelCell.appendChild(labelButton);
            row.appendChild(labelCell);

            columns.forEach((column) => {
                const cell = document.createElement('td');
                const isTotal = column === 'total';
                const yearKey = isTotal ? 'all' : column;
                const count = isTotal ? stats.total : coalesce(stats.perYear[column], 0);

                if (count > 0) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'matrix-button';
                    if (state.activeChapter === chapter.number && state.activeYear === yearKey) {
                        button.classList.add('is-active');
                    }
                    button.dataset.chapter = chapter.number;
                    button.dataset.year = yearKey;
                    button.textContent = formatNumber(count);
                    cell.appendChild(button);
                } else {
                    const span = document.createElement('span');
                    span.className = 'matrix-value is-zero';
                    span.textContent = '0';
                    cell.appendChild(span);
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);

            if (state.activeChapter === chapter.number) {
                const detailRow = document.createElement('tr');
                detailRow.className = 'matrix-detail-row';
                detailRow.dataset.chapter = chapter.number;

                const detailCell = document.createElement('td');
                detailCell.colSpan = columns.length + 1;

                const detailContainer = document.createElement('div');
                detailContainer.className = 'chapter-detail';

                buildChapterDetail(chapter, detailContainer);

                detailCell.appendChild(detailContainer);
                detailRow.appendChild(detailCell);
                tbody.appendChild(detailRow);
            }
        });

        clearElement($matrixTable);
        $matrixTable.appendChild(thead);
        $matrixTable.appendChild(tbody);

        if ($matrixSummary) {
            $matrixSummary.textContent = '장을 누르거나 연도 셀을 선택하면 문제가 아래에 표시됩니다.';
        }
    }

    function renderQuestions(questions, target) {
        if (!target) return;
        target.innerHTML = '';

        if (!questions.length) {
            target.innerHTML = `<div class="item-empty no-question">⚠️ 연결된 문제가 없습니다.</div>`;
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('questions-container-list');

        questions.forEach((q) => {
            const li = document.createElement('li');
            li.classList.add('question-card');
            const year = q.year || (q.id ? q.id.split('-')[0] : '');
            const number = q.id ? q.id.split('-')[1] : '';
            const itemTitle = q.itemLabel || q.item_key || '';

            li.innerHTML = `
                <div class="question-header">
                    <span class="q-year">${year ? `${year}년` : ''} ${number ? `${number}번` : ''}</span>
                    <span class="q-item-key">${itemTitle}</span>
                </div>
                ${q.data_1 ? `<div class="question-data"><img src="${q.data_1}" alt="문제 자료" class="data-image"></div>` : ''}
                <div class="question-body">${q.question_text || ''}</div>
                <div class="options-toggle" role="button" aria-expanded="true">
                    <span class="options-text">보기/정답 닫기</span>
                </div>
                <ul class="question-options" style="display: block;">${q.options_html || ''}</ul>
            `;

            const toggle = li.querySelector('.options-toggle');
            const optionsList = li.querySelector('.question-options');
            toggle.addEventListener('click', (event) => {
                event.stopPropagation();
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    optionsList.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.querySelector('.options-text').textContent = '보기/정답 보기 (+ 정답)';
                } else {
                    optionsList.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.querySelector('.options-text').textContent = '보기/정답 닫기';
                }
            });

            ul.appendChild(li);
        });

        target.appendChild(ul);
    }

    function buildChapterDetail(chapter, container) {
        const chapterNumber = chapter.number;
        const chapterTitle = chapterDisplayTitle(chapter);
        const chapterQuestions = chapterYearIndex.get(`${chapterNumber}|all`) || [];
        const filteredChapterQuestions = filterQuestionsByYear(chapterQuestions, state.activeYear);

        container.innerHTML = '';

        const yearPanel = document.createElement('section');
        yearPanel.className = 'chapter-year-panel';

        const yearHeader = document.createElement('header');
        yearHeader.className = 'chapter-year-header';
        const yearLabel = state.activeYear === 'all' ? '전체 문제' : `${state.activeYear}년 문제`;
        const yearSummary = state.activeYear === 'all'
            ? `${chapterTitle} · 총 ${formatNumber(filteredChapterQuestions.length)}문제`
            : `${chapterTitle} · ${state.activeYear}년 ${formatNumber(filteredChapterQuestions.length)}문제`;
        yearHeader.innerHTML = `
            <h3 class="chapter-year-title">${yearLabel}</h3>
            <p class="chapter-year-summary">${yearSummary}</p>
        `;
        yearPanel.appendChild(yearHeader);

        const yearQuestionsContainer = document.createElement('div');
        yearQuestionsContainer.className = 'chapter-year-questions';
        renderQuestions(filteredChapterQuestions, yearQuestionsContainer);
        yearPanel.appendChild(yearQuestionsContainer);

        container.appendChild(yearPanel);

        const structure = chapterStructure.get(chapterNumber);
        const sectionWrap = document.createElement('div');
        sectionWrap.className = 'chapter-section-wrap';

        if (!structure || !structure.sections.length) {
            const empty = document.createElement('div');
            empty.className = 'detail-placeholder';
            empty.textContent = '등록된 절 정보가 없습니다.';
            sectionWrap.appendChild(empty);
            container.appendChild(sectionWrap);
            return;
        }

        const openSet = ensureSectionOpenState(chapterNumber);
        if (!openSet.size) {
            openSet.add(structure.sections[0].sectionIndex);
        }

        structure.sections.forEach((section) => {
            const details = document.createElement('details');
            details.className = 'chapter-section';
            details.dataset.sectionIndex = String(section.sectionIndex);
            details.open = openSet.has(section.sectionIndex);
            details.addEventListener('toggle', () => {
                const set = ensureSectionOpenState(chapterNumber);
                if (details.open) {
                    set.add(section.sectionIndex);
                } else {
                    set.delete(section.sectionIndex);
                }
            });

            const summary = document.createElement('summary');
            summary.className = 'chapter-section-summary';
            const sectionQuestions = chapterQuestions.filter(q => q.sectionNumber === section.numericalKey);
            const sectionCount = filterQuestionsByYear(sectionQuestions, state.activeYear).length;
            summary.innerHTML = `
                <span class="section-title">${section.rawTitle}</span>
                <span class="section-count">${formatNumber(sectionCount)}문제</span>
            `;
            details.appendChild(summary);

            const body = document.createElement('div');
            body.className = 'chapter-section-body';

            const itemList = document.createElement('div');
            itemList.className = 'chapter-item-list';

            if (!section.items.length) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'detail-placeholder';
                emptyItem.textContent = '등록된 항목이 없습니다.';
                itemList.appendChild(emptyItem);
            } else {
                section.items.forEach((item) => {
                    const questions = questionBank[item.numericalKey] || [];
                    const filteredCount = filterQuestionsByYear(questions, state.activeYear).length;
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'chapter-item-button';
                    if (
                        state.activeChapter === chapterNumber &&
                        state.activeSectionIndex === section.sectionIndex &&
                        state.activeItemIndex === item.itemIndex &&
                        state.activeItemKey === item.numericalKey
                    ) {
                        button.classList.add('is-active');
                    }
                    button.dataset.chapter = chapterNumber;
                    button.dataset.sectionIndex = String(section.sectionIndex);
                    button.dataset.itemIndex = String(item.itemIndex);
                    button.dataset.itemKey = item.numericalKey;
                    button.innerHTML = `
                        <span class="item-name">${item.label}</span>
                        <span class="item-count">${formatNumber(filteredCount)}문제</span>
                    `;
                    button.addEventListener('click', () => {
                        handleItemSelection(chapterNumber, section.sectionIndex, item.itemIndex, item.numericalKey);
                    });
                    itemList.appendChild(button);
                });
            }

            body.appendChild(itemList);

            const detailPanel = document.createElement('div');
            detailPanel.className = 'section-detail-panel';
            detailPanel.dataset.sectionIndex = String(section.sectionIndex);
            renderSectionDetail(chapterNumber, section, detailPanel);
            body.appendChild(detailPanel);

            details.appendChild(body);
            sectionWrap.appendChild(details);
        });

        container.appendChild(sectionWrap);
    }

    function renderSectionDetail(chapterNumber, section, panel) {
        panel.innerHTML = '';

        if (
            state.activeChapter !== chapterNumber ||
            state.activeSectionIndex !== section.sectionIndex ||
            !state.activeItemKey
        ) {
            const placeholder = document.createElement('div');
            placeholder.className = 'detail-placeholder';
            placeholder.textContent = '항목을 선택하면 문제가 표시됩니다.';
            panel.appendChild(placeholder);
            return;
        }

        const itemEntry = section.items.find(item => item.numericalKey === state.activeItemKey);
        if (!itemEntry) {
            const missing = document.createElement('div');
            missing.className = 'detail-placeholder';
            missing.textContent = '선택한 항목 정보를 찾을 수 없습니다.';
            panel.appendChild(missing);
            return;
        }

        const meta = itemMetadata.get(state.activeItemKey);
        const chapterInfo = CHAPTERS.find(ch => ch.number === chapterNumber) || { number: chapterNumber, title: '' };
        const pathLabel = meta
            ? `${meta.chapterTitle} → ${meta.sectionTitle} → ${meta.label}`
            : `${chapterDisplayTitle(chapterInfo)} → ${section.rawTitle} → ${itemEntry.label}`;
        const itemLabel = meta ? meta.label : itemEntry.label;

        const header = document.createElement('header');
        header.className = 'section-detail-header';
        const yearTrail = state.activeYear === 'all' ? '' : ` · ${state.activeYear}년`;
        header.innerHTML = `
            <h4 class="detail-title">${itemLabel}</h4>
            <p class="detail-summary">${pathLabel}${yearTrail}</p>
        `;
        panel.appendChild(header);

        const questionWrap = document.createElement('div');
        questionWrap.className = 'section-detail-questions';
        const questions = filterQuestionsByYear(questionBank[state.activeItemKey] || [], state.activeYear).map((q) => ({
            ...q,
            year: (q.id || '').split('-')[0] || '',
            itemLabel
        }));
        renderQuestions(questions, questionWrap);
        panel.appendChild(questionWrap);

        const conceptWrap = document.createElement('div');
        conceptWrap.className = 'section-detail-concept';
        conceptWrap.innerHTML = '<div class="concept-empty">이 항목의 개념 자료가 준비 중입니다.</div>';
        panel.appendChild(conceptWrap);
    }

    function scrollToChapterDetail(chapterNumber) {
        if (!$matrixTable) return;
        requestAnimationFrame(() => {
            const detailRow = $matrixTable.querySelector(`tr.matrix-detail-row[data-chapter="${chapterNumber}"]`);
            if (detailRow && typeof detailRow.scrollIntoView === 'function') {
                detailRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function scrollToDetailSection(chapterNumber, sectionIndex) {
        if (!$matrixTable) return;
        requestAnimationFrame(() => {
            const selector = `tr.matrix-detail-row[data-chapter="${chapterNumber}"] details.chapter-section[data-section-index="${sectionIndex}"]`;
            const sectionEl = $matrixTable.querySelector(selector);
            if (sectionEl && typeof sectionEl.scrollIntoView === 'function') {
                sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function filterQuestionsByYear(questions, yearKey) {
        if (yearKey === 'all') return questions;
        return questions.filter(q => q.year === yearKey);
    }

    async function handleChapterLabelClick(chapterNumber, options = {}) {
        const chapter = CHAPTERS.find(ch => ch.number === chapterNumber);
        if (!chapter) return;

        await ensureChapterParsed(chapter);

        const isSame = state.activeChapter === chapterNumber;
        const isDefaultView = state.activeYear === 'all' && state.activeItemKey === null;

        if (isSame && isDefaultView) {
            state.activeChapter = null;
            state.activeYear = 'all';
            state.activeSectionIndex = null;
            state.activeItemIndex = null;
            state.activeItemKey = null;
            renderMatrix();
            return;
        }

        state.activeChapter = chapterNumber;
        state.activeYear = 'all';
        state.activeSectionIndex = null;
        state.activeItemIndex = null;
        state.activeItemKey = null;

        const openSet = ensureSectionOpenState(chapterNumber);
        if (!openSet.size) {
            const structure = chapterStructure.get(chapterNumber);
            if (structure && structure.sections.length) {
                openSet.add(structure.sections[0].sectionIndex);
            }
        }

        renderMatrix();

        if (options.scrollToDetail !== false) {
            scrollToChapterDetail(chapterNumber);
        }
    }

    async function handleYearSelection(chapterNumber, yearKey, options = {}) {
        const chapter = CHAPTERS.find(ch => ch.number === chapterNumber);
        if (!chapter) return;

        await ensureChapterParsed(chapter);

        const chapterChanged = state.activeChapter !== chapterNumber;

        state.activeChapter = chapterNumber;
        state.activeYear = yearKey;

        if (chapterChanged) {
            state.activeSectionIndex = null;
            state.activeItemIndex = null;
            state.activeItemKey = null;

            const openSet = ensureSectionOpenState(chapterNumber);
            if (!openSet.size) {
                const structure = chapterStructure.get(chapterNumber);
                if (structure && structure.sections.length) {
                    openSet.add(structure.sections[0].sectionIndex);
                }
            }
        }

        renderMatrix();

        if (options.scrollToDetail !== false) {
            scrollToChapterDetail(chapterNumber);
        }
    }

    function handleItemSelection(chapterNumber, sectionIndex, itemIndex, itemKey) {
        state.activeChapter = chapterNumber;
        state.activeSectionIndex = sectionIndex;

        const isSame = state.activeItemKey === itemKey && state.activeItemIndex === itemIndex;

        if (isSame) {
            state.activeItemIndex = null;
            state.activeItemKey = null;
        } else {
            state.activeItemIndex = itemIndex;
            state.activeItemKey = itemKey;
            ensureSectionOpenState(chapterNumber).add(sectionIndex);
        }

        renderMatrix();
        scrollToDetailSection(chapterNumber, sectionIndex);
    }
    function buildSearchIndex() {
        searchIndex.length = 0;

        CHAPTERS.forEach((chapter) => {
            const structure = chapterStructure.get(chapter.number);
            if (!structure) return;
            const chapterTitle = structure.chapterTitle;

            structure.sections.forEach((section) => {
                const sectionQuestions = (chapterYearIndex.get(`${chapter.number}|all`) || [])
                    .filter(q => q.sectionNumber === section.numericalKey);

                const sectionEntry = {
                    type: 'section',
                    chapterNum: chapter.number,
                    chapterTitle,
                    sectionTitle: section.rawTitle,
                    itemTitle: '',
                    questionCount: sectionQuestions.length,
                    searchText: `${chapterTitle} ${section.rawTitle}`.toLowerCase(),
                    sectionIndex: section.sectionIndex,
                    itemIndex: null
                };
                sectionEntry.index = searchIndex.length;
                searchIndex.push(sectionEntry);

                section.items.forEach((item) => {
                    const questions = questionBank[item.numericalKey] || [];
                    const entry = {
                        type: 'item',
                        chapterNum: chapter.number,
                        chapterTitle,
                        sectionTitle: section.rawTitle,
                        itemTitle: item.label,
                        questionCount: questions.length,
                        searchText: `${chapterTitle} ${section.rawTitle} ${item.label}`.toLowerCase(),
                        sectionIndex: section.sectionIndex,
                        itemIndex: item.itemIndex,
                        numericalKey: item.numericalKey
                    };
                    entry.index = searchIndex.length;
                    searchIndex.push(entry);
                });
            });
        });
    }

    function renderSearchResults(results, query) {
        if (!$searchResults || !$searchList || !$searchSummary) return;

        if (!query) {
            $searchResults.hidden = true;
            $searchList.innerHTML = '';
            $searchSummary.textContent = '검색어를 입력하면 관련 장·절·항목과 문제 수가 정리되어 표시됩니다.';
            return;
        }

        $searchResults.hidden = false;

        if (!results.length) {
            $searchList.innerHTML = `<div class="search-empty">'${query}'에 해당하는 항목을 찾지 못했습니다. 다른 키워드를 시도해 보세요.</div>`;
            $searchSummary.textContent = '검색 결과가 없습니다.';
            return;
        }

        const limited = results.slice(0, 40);
        const overflow = results.length - limited.length;
        $searchSummary.textContent = overflow > 0
            ? `${formatNumber(results.length)}개의 항목 중 상위 ${formatNumber(limited.length)}개만 표시합니다.`
            : `${formatNumber(results.length)}개의 항목이 검색되었습니다.`;

        const cards = limited.map((entry) => {
            const typeLabel = entry.type === 'section' ? '절' : '항목';
            const path = `${entry.chapterTitle} → ${entry.sectionTitle}${entry.itemTitle ? ' → ' + entry.itemTitle : ''}`;
            const countLabel = entry.questionCount > 0 ? `${formatNumber(entry.questionCount)}문제` : '문제 없음';

            return `
                <article class="search-card">
                    <div class="search-card-head">
                        <span class="type-badge ${entry.type}">${typeLabel}</span>
                        <span class="count-chip">${countLabel}</span>
                    </div>
                    <h3 class="search-card-title">${entry.itemTitle || entry.sectionTitle}</h3>
                    <p class="search-card-sub">${path}</p>
                    <button class="search-jump" type="button" data-index="${entry.index}">바로 보기</button>
                </article>
            `;
        }).join('');

        $searchList.innerHTML = cards;
    }

    function performSearch(value) {
        const query = value.trim();
        if (!query) {
            renderSearchResults([], '');
            return;
        }

        const normalized = query.toLowerCase();
        const results = searchIndex.filter(entry => entry.searchText.includes(normalized));
        results.sort((a, b) => {
            if (b.questionCount !== a.questionCount) {
                return b.questionCount - a.questionCount;
            }
            const aLabel = (a.itemTitle || a.sectionTitle || a.chapterTitle);
            const bLabel = (b.itemTitle || b.sectionTitle || b.chapterTitle);
            return aLabel.localeCompare(bLabel, 'ko');
        });
        renderSearchResults(results, query);
    }

    async function revealEntry(entry) {
        if (!entry) return;

        const chapter = CHAPTERS.find(ch => ch.number === entry.chapterNum);
        if (!chapter) return;

        await ensureChapterParsed(chapter);

        state.activeChapter = entry.chapterNum;
        state.activeYear = 'all';

        if (Number.isInteger(entry.sectionIndex)) {
            state.activeSectionIndex = entry.sectionIndex;
            ensureSectionOpenState(entry.chapterNum).add(entry.sectionIndex);
        } else {
            state.activeSectionIndex = null;
        }

        if (entry.type === 'item' && entry.numericalKey) {
            state.activeItemIndex = entry.itemIndex;
            state.activeItemKey = entry.numericalKey;
        } else {
            state.activeItemIndex = null;
            state.activeItemKey = null;
        }

        renderMatrix();

        requestAnimationFrame(() => {
            if (entry.type === 'item' && Number.isInteger(entry.sectionIndex)) {
                scrollToDetailSection(entry.chapterNum, entry.sectionIndex);
            } else {
                scrollToChapterDetail(entry.chapterNum);
            }
        });
    }

    function handleMatrixClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const labelButton = target.closest('button.matrix-row-toggle');
        if (labelButton) {
            const chapter = labelButton.dataset.chapter;
            if (chapter) {
                void handleChapterLabelClick(chapter, { scrollToDetail: true });
            }
            return;
        }

        const button = target.closest('button.matrix-button');
        if (button) {
            const chapter = button.dataset.chapter;
            const yearKey = button.dataset.year || 'all';
            if (chapter) {
                void handleYearSelection(chapter, yearKey, { scrollToDetail: true });
            }
        }
    }

    if ($matrixTable) {
        $matrixTable.addEventListener('click', handleMatrixClick);
    }

    if ($searchInput) {
        $searchInput.addEventListener('input', (event) => {
            performSearch(event.target.value || '');
        });
    }

    if ($searchList) {
        $searchList.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.classList.contains('search-jump')) {
                const index = Number(target.dataset.index);
                if (!Number.isNaN(index)) {
                    void revealEntry(searchIndex[index]);
                }
            }
        });
    }

    loadData().then(async (success) => {
        if (!success) {
            if ($matrixSummary) {
                $matrixSummary.textContent = '문제 데이터를 불러오지 못했습니다. question_bank.json 경로를 확인해주세요.';
            }
            return;
        }

        await preloadAllChapters();
        computeYearsAndIndex();
        buildSearchIndex();

        if ($globalTitle) {
            $globalTitle.textContent = '소아과학 목차';
        }

        updateHeroMetrics(computeGlobalStats());
        renderMatrix();

        const defaultChapter = CHAPTERS[0];
        if (defaultChapter) {
            await handleChapterLabelClick(defaultChapter.number, { scrollToDetail: false });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard, { once: true });
} else {
    initDashboard();
}