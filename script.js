document.addEventListener('DOMContentLoaded', () => {
    const BASE = './chapter/';
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

    const parsedCache = new Map();
    const searchIndex = [];
    let questionBank = {};
    const ALL_YEARS = ["2021", "2022", "2023", "2024", "2025"];

    const $chapterGrid = document.getElementById('chapter-grid');
    const $sectionList = document.getElementById('section-list');
    const $itemList = document.getElementById('item-list');
    const $questionList = document.getElementById('question-list');
    const $globalTitle = document.getElementById('global-toc-title');
    const $metricChapters = document.getElementById('metric-chapters');
    const $metricSections = document.getElementById('metric-sections');
    const $metricItems = document.getElementById('metric-items');
    const $metricQuestions = document.getElementById('metric-questions');
    const $searchInput = document.getElementById('search-input');
    const $searchSummary = document.getElementById('search-summary');
    const $searchResults = document.getElementById('search-results');
    const $searchList = document.getElementById('search-list');
    const $sectionSummary = document.getElementById('section-summary');
    const $itemSummary = document.getElementById('item-summary');
    const $questionSummary = document.getElementById('question-summary');

    const typeLabels = {
        chapter: '장 전체',
        section: '절',
        item: '항목'
    };

    function formatNumber(num) {
        return num.toLocaleString('ko-KR');
    }

    function updateHeroMetrics({ chapters, sections, items, questions }) {
        if ($metricChapters) $metricChapters.textContent = formatNumber(chapters);
        if ($metricSections) $metricSections.textContent = formatNumber(sections);
        if ($metricItems) $metricItems.textContent = formatNumber(items);
        if ($metricQuestions) $metricQuestions.textContent = formatNumber(questions);
    }

    function getNumericalParts(itemText) {
        const parts = itemText.match(/\d+/g);
        if (!parts || parts.length < 3) return ['0', '0', '0'];
        return [parts[0], parts[1], parts[2]];
    }

    async function loadData() {
        try {
            const qBankRes = await fetch('question_bank.json', { cache: 'no-store' });
            if (!qBankRes.ok) {
                return false;
            }
            questionBank = await qBankRes.json();
            return true;
        } catch (e) {
            console.error('question_bank.json 로드 실패', e);
            return false;
        }
    }

    function getYearlyBreakdown(questions) {
        const total = questions ? questions.length : 0;
        const counts = {};

        (questions || []).forEach(q => {
            const year = q.id.split('-')[0];
            counts[year] = (counts[year] || 0) + 1;
        });

        const yearCells = [];

        ALL_YEARS.forEach(year => {
            const count = counts[year] || 0;
            const classes = ['year-cell'];
            if (count === 0) {
                classes.push('zero-count');
            }
            yearCells.push(`<span class="${classes.join(' ')}" data-year="${year}" aria-label="${year}년 ${count}문제">${count}</span>`);
        });

        const totalCell = `<span class="year-cell total-cell" aria-label="총 ${total}문제">${total}</span>`;

        const srText = `${ALL_YEARS.map(year => `${year}년 ${counts[year] || 0}문제`).join(', ')}, 총 ${total}문제`;

        const html = `
            <span class="yearly-breakdown">
                <span class="year-grid" role="presentation">${yearCells.join('')}${totalCell}</span>
                <span class="sr-only">${srText}</span>
            </span>
        `;
        return { html, count: total };
    }

    function getChapterTotalBreakdown(chapterNum, questionBank) {
        let allQuestions = [];
        const prefix = `${chapterNum} | `;

        for (const key in questionBank) {
            if (key.startsWith(prefix)) {
                allQuestions = allQuestions.concat(questionBank[key]);
            }
        }
        return getYearlyBreakdown(allQuestions);
    }

    function getSectionTotalBreakdown(chapterNum, sectionNum) {
        let allQuestions = [];
        const prefix = `${chapterNum} | ${sectionNum}`;
        for (const key in questionBank) {
            if (key.startsWith(prefix)) {
                allQuestions = allQuestions.concat(questionBank[key]);
            }
        }
        return getYearlyBreakdown(allQuestions);
    }

    function getGlobalTotalBreakdown(questionBank) {
        let allQuestions = [];
        for (const key in questionBank) {
            allQuestions = allQuestions.concat(questionBank[key]);
        }
        return getYearlyBreakdown(allQuestions);
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
                    rawTitle: rawTitle,
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

    function renderQuestions(questions, $target) {
        if (!$target) return;
        $target.innerHTML = '';

        if (!questions.length) {
            $target.innerHTML = `<div class="item-empty no-question">⚠️ 이 항목에 연결된 문제가 없습니다.</div>`;
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('questions-container-list');

        questions.forEach(q => {
            const li = document.createElement('li');
            li.classList.add('question-card');

            const year = q.id.split('-')[0];
            const number = q.id.split('-')[1];
            const itemTitle = q.item_key.split(' ').pop().replace(/\([^)]*\)/g, '') || '항목불명';

            li.innerHTML = `
                <div class="question-header">
                    <span class="q-year">${year}년 ${number}번</span>
                    <span class="q-item-key">(${itemTitle})</span>
                </div>

                ${q.data_1 ? `<div class="question-data"><img src="${q.data_1}" alt="문제 자료" class="data-image"></div>` : ''}

                <div class="question-body">${q.question_text}</div>

                <div class="options-toggle" role="button" aria-expanded="true">
                    <span class="options-text">보기/정답 닫기</span>
                </div>

                <ul class="question-options" style="display: block;">
                    ${q.options_html}
                </ul>
            `;

            const $toggle = li.querySelector('.options-toggle');
            const $optionsUl = li.querySelector('.question-options');

            $toggle.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const isExpanded = $toggle.getAttribute('aria-expanded') === 'true';

                if (isExpanded) {
                    $optionsUl.style.display = 'none';
                    $toggle.setAttribute('aria-expanded', 'false');
                    $toggle.querySelector('.options-text').textContent = '보기/정답 보기 (+ 정답)';
                } else {
                    $optionsUl.style.display = 'block';
                    $toggle.setAttribute('aria-expanded', 'true');
                    $toggle.querySelector('.options-text').textContent = '보기/정답 닫기';
                }
            });

            ul.appendChild(li);
        });

        $target.appendChild(ul);
    }
    const uiState = {
        activeChapter: null,
        activeSectionIndex: null,
        activeItemIndex: null,
        pendingChapter: null
    };

    const columnState = {
        sectionButtons: [],
        sectionData: [],
        itemButtons: [],
        itemData: []
    };

    const chapterElements = new Map();

    function chapterDisplayTitle(chapter) {
        return `제${chapter.number}장 ${chapter.title}`;
    }

    function getChapterCacheKey(chapter) {
        return chapter.file || `fallback-${chapter.number}`;
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
            const itemLabel = questions[0]?.item_key || `${chapterNum}.${sectionNum}.${itemNum}`;

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

        if (!chapter.file) {
            const fallback = buildFallbackChapter(chapter.number);
            const stored = { ...fallback, source: 'fallback' };
            parsedCache.set(cacheKey, stored);
            return stored;
        }

        try {
            const res = await fetch(BASE + encodeURIComponent(chapter.file), { cache: 'no-store' });
            if (!res.ok) throw new Error('fetch failed ' + res.status);
            const md = await res.text();
            const parsed = parseChapter(md);
            const stored = { ...parsed, source: 'file' };
            parsedCache.set(cacheKey, stored);
            return stored;
        } catch (error) {
            console.error('장 로드 실패', chapter.file, error);
            const fallback = buildFallbackChapter(chapter.number);
            const stored = { ...fallback, source: 'fallback', error: true };
            parsedCache.set(cacheKey, stored);
            return stored;
        }
    }

    function setSummaryText(element, text) {
        if (element) {
            element.textContent = text;
        }
    }

    function setSummaryHTML(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    }

    function showPlaceholder(container, message, className = 'toc-empty') {
        if (!container) return;
        container.innerHTML = '';
        if (!message) return;
        const div = document.createElement('div');
        div.className = className;
        div.textContent = message;
        container.appendChild(div);
    }

    function resetSectionColumn(message = '장을 선택하면 절이 표시됩니다.') {
        columnState.sectionButtons = [];
        columnState.sectionData = [];
        showPlaceholder($sectionList, message);
        setSummaryText($sectionSummary, message);
    }

    function resetItemColumn(message = '절을 선택하면 항목이 표시됩니다.') {
        columnState.itemButtons = [];
        columnState.itemData = [];
        showPlaceholder($itemList, message);
        setSummaryText($itemSummary, message);
    }

    function resetQuestionColumn(message = '항목을 선택하면 관련 문제가 아래에 나타납니다.') {
        showPlaceholder($questionList, message, 'question-empty');
        setSummaryText($questionSummary, message);
    }

    function renderSectionsForChapter(chapter, parsed) {
        if (!$sectionList) return;

        columnState.sectionButtons = [];
        columnState.sectionData = [];

        const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const chapterTitle = chapterDisplayTitle(chapter);
        const chapterBreakdown = getChapterTotalBreakdown(chapter.number, questionBank);

        if (!sections.length) {
            const message = parsed.source === 'fallback'
                ? '⚠️ 문제 데이터로 절을 구성할 수 없습니다. question_bank.json을 확인해주세요.'
                : '등록된 절 정보가 없습니다.';
            showPlaceholder($sectionList, message);
            setSummaryHTML($sectionSummary, `${chapterTitle} · 절 0개 <span class="summary-breakdown">${chapterBreakdown.html}</span>`);
            resetItemColumn('절이 없어 항목을 불러올 수 없습니다.');
            resetQuestionColumn();
            return;
        }

        $sectionList.innerHTML = '';

        if (parsed.source === 'fallback') {
            const notice = document.createElement('div');
            notice.className = 'toc-notice';
            notice.textContent = '⚠️ 원본 목차 파일 없이 문제 데이터를 기준으로 구성되었습니다.';
            $sectionList.appendChild(notice);
        }

        sections.forEach((sec, index) => {
            const sectionBreakdown = getSectionTotalBreakdown(chapter.number, sec.numericalKey);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'section-line line-button';
            button.dataset.index = String(index);
            button.innerHTML = `
                <span class="line-count">${sectionBreakdown.html}</span>
                <span class="toc-title">${sec.rawTitle}</span>
                <span class="line-chevron" aria-hidden="true"></span>
            `;
            button.addEventListener('click', (event) => {
                event.preventDefault();
                activateSectionByIndex(index, { scroll: true });
            });

            columnState.sectionButtons.push(button);
            columnState.sectionData.push({
                chapterNumber: chapter.number,
                chapterTitle,
                sectionIndex: index,
                section: sec,
                breakdown: sectionBreakdown
            });

            $sectionList.appendChild(button);
        });

        setSummaryHTML($sectionSummary, `${chapterTitle} · 절 ${sections.length}개 <span class="summary-breakdown">${chapterBreakdown.html}</span>`);
        resetItemColumn();
        resetQuestionColumn();
    }

    function renderItemsForSection(sectionEntry) {
        if (!$itemList) return;

        columnState.itemButtons = [];
        columnState.itemData = [];

        const section = sectionEntry.section;
        const items = Array.isArray(section.items) ? section.items : [];

        if (!items.length) {
            showPlaceholder($itemList, '등록된 항목이 없습니다.');
            setSummaryText($itemSummary, `${sectionEntry.chapterTitle} → ${section.rawTitle} · 항목 0개`);
            resetQuestionColumn();
            return;
        }

        $itemList.innerHTML = '';

        items.forEach((label, itemIndex) => {
            const [c, s, i] = getNumericalParts(label);
            const numericalKey = `${c} | ${s} | ${i}`;
            const questions = questionBank[numericalKey] || [];
            const breakdown = getYearlyBreakdown(questions);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'item-line line-button';
            button.dataset.index = String(itemIndex);
            button.innerHTML = `
                <span class="line-count">${breakdown.html}</span>
                <span class="item-title">${label}</span>
                <span class="line-chevron" aria-hidden="true"></span>
            `;
            button.addEventListener('click', (event) => {
                event.preventDefault();
                activateItemByIndex(itemIndex, { scroll: true });
            });

            columnState.itemButtons.push(button);
            columnState.itemData.push({
                chapterNumber: sectionEntry.chapterNumber,
                chapterTitle: sectionEntry.chapterTitle,
                sectionIndex: sectionEntry.sectionIndex,
                sectionTitle: section.rawTitle,
                itemIndex,
                itemKey: numericalKey,
                label,
                breakdown,
                questions
            });

            $itemList.appendChild(button);
        });

        setSummaryText($itemSummary, `${sectionEntry.chapterTitle} → ${section.rawTitle} · 항목 ${items.length}개`);
        resetQuestionColumn();
    }

    function activateSectionByIndex(index, options = {}) {
        const entry = columnState.sectionData[index];
        if (!entry) return null;

        columnState.sectionButtons.forEach((btn, idx) => {
            if (!btn) return;
            btn.classList.toggle('is-active', idx === index);
            btn.setAttribute('aria-pressed', idx === index ? 'true' : 'false');
        });

        uiState.activeSectionIndex = index;
        uiState.activeItemIndex = null;

        renderItemsForSection(entry);

        setSummaryHTML($sectionSummary, `${entry.chapterTitle} (${columnState.sectionData.length}개 절) → ${entry.section.rawTitle} <span class="summary-breakdown">${entry.breakdown.html}</span>`);

        if (options.scroll) {
            $itemList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (options.autoSelectFirstItem && columnState.itemData.length > 0) {
            activateItemByIndex(0, { scroll: options.scrollToItem ?? false });
        }

        return entry;
    }

    function activateItemByIndex(index, options = {}) {
        const entry = columnState.itemData[index];
        if (!entry) return null;

        columnState.itemButtons.forEach((btn, idx) => {
            if (!btn) return;
            btn.classList.toggle('is-active', idx === index);
            btn.setAttribute('aria-pressed', idx === index ? 'true' : 'false');
        });

        uiState.activeItemIndex = index;

        const pathLabel = `${entry.chapterTitle} → ${entry.sectionTitle} → ${entry.label}`;
        setSummaryHTML($questionSummary, `<span class="question-label">${pathLabel}</span> <span class="summary-breakdown">${entry.breakdown.html}</span>`);

        renderQuestions(entry.questions, $questionList);

        if (options.scroll) {
            document.getElementById('question-column-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return entry;
    }

    async function activateChapter(chapterNumber, options = {}) {
        const chapter = CHAPTERS.find(ch => ch.number === chapterNumber);
        if (!chapter) return null;

        const store = chapterElements.get(chapter.number);
        uiState.pendingChapter = chapter.number;

        chapterElements.forEach(({ button }) => {
            if (!button) return;
            const isCurrent = store?.button === button;
            button.classList.toggle('is-active', isCurrent);
            button.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
        });

        setSummaryText($sectionSummary, '절을 불러오는 중입니다...');
        showPlaceholder($sectionList, '절을 불러오는 중입니다.');
        resetItemColumn();
        resetQuestionColumn();

        const parsed = await ensureChapterParsed(chapter);
        if (uiState.pendingChapter !== chapter.number) {
            return parsed;
        }

        uiState.activeChapter = chapter.number;
        uiState.activeSectionIndex = null;
        uiState.activeItemIndex = null;

        const fallbackButton = store?.button || document.querySelector(`button.chapter-card[data-chapter="${chapter.number}"]`);
        const updatedStore = {
            button: fallbackButton || null,
            parsed
        };
        chapterElements.set(chapter.number, updatedStore);

        chapterElements.forEach(({ button }, num) => {
            if (!button) return;
            const isActive = num === chapter.number;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        renderSectionsForChapter(chapter, parsed || { sections: [], source: 'fallback' });

        if (options.autoSelectFirstSection && columnState.sectionData.length > 0) {
            activateSectionByIndex(0, {
                scroll: false,
                autoSelectFirstItem: options.autoSelectFirstItem ?? false,
                scrollToItem: options.scrollToItem ?? false
            });
        }

        if (options.scrollIntoView && updatedStore.button) {
            updatedStore.button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return parsed;
    }

    function createChapterCard(chapter) {
        const breakdown = getChapterTotalBreakdown(chapter.number, questionBank);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chapter-card';
        button.dataset.chapter = chapter.number;
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `
            <span class="chapter-card-title">
                <span class="chapter-card-number">제${chapter.number}장</span>
                <span class="chapter-card-label">${chapter.title}</span>
            </span>
            <span class="chapter-card-count">${breakdown.html}</span>
        `;

        button.addEventListener('click', () => {
            activateChapter(chapter.number, { autoSelectFirstSection: false, scrollIntoView: false });
        });

        chapterElements.set(chapter.number, { button, parsed: parsedCache.get(getChapterCacheKey(chapter)) || null });

        return button;
    }

    async function preloadAllChapters() {
        const tasks = CHAPTERS.map((chapter) => ensureChapterParsed(chapter).catch(() => ({ sections: [] })));
        await Promise.all(tasks);
    }

    function buildSearchIndex() {
        searchIndex.length = 0;

        CHAPTERS.forEach((chapter) => {
            const parsed = parsedCache.get(getChapterCacheKey(chapter));
            if (!parsed || !Array.isArray(parsed.sections)) return;

            const chapterNum = chapter.number;
            const chapterTitle = chapterDisplayTitle(chapter);

            parsed.sections.forEach((sec, secIndex) => {
                const sectionBreakdown = getSectionTotalBreakdown(chapterNum, sec.numericalKey);

                const sectionEntry = {
                    type: 'section',
                    chapterNum,
                    chapterTitle,
                    sectionTitle: sec.rawTitle,
                    itemTitle: '',
                    breakdownHtml: sectionBreakdown.html,
                    questionCount: sectionBreakdown.count,
                    searchText: `${chapterTitle} ${sec.rawTitle}`.toLowerCase(),
                    sectionIndex: secIndex,
                    itemIndex: null
                };
                sectionEntry.index = searchIndex.length;
                searchIndex.push(sectionEntry);

                if (!sec.items || sec.items.length === 0) {
                    return;
                }

                sec.items.forEach((txt, itemIndex) => {
                    const [c, s, i] = getNumericalParts(txt);
                    const numericalKey = `${c} | ${s} | ${i}`;
                    const itemQuestions = questionBank[numericalKey] || [];
                    const itemBreakdown = getYearlyBreakdown(itemQuestions);

                    const entry = {
                        type: 'item',
                        chapterNum,
                        chapterTitle,
                        sectionTitle: sec.rawTitle,
                        itemTitle: txt,
                        breakdownHtml: itemBreakdown.html,
                        questionCount: itemBreakdown.count,
                        searchText: `${chapterTitle} ${sec.rawTitle} ${txt}`.toLowerCase(),
                        sectionIndex: secIndex,
                        itemIndex
                    };
                    entry.index = searchIndex.length;
                    searchIndex.push(entry);
                });
            });
        });
    }

    function renderSearchResults(results, query) {
        if (!query) {
            $searchResults.hidden = true;
            $searchList.innerHTML = '';
            $searchSummary.textContent = '검색어를 입력하면 관련 장·절·항목과 문제 수가 정리되어 표시됩니다.';
            return;
        }

        $searchResults.hidden = false;

        if (!results.length) {
            $searchList.innerHTML = `<div class="search-empty">'${query}'에 해당하는 항목을 찾지 못했습니다. 다른 키워드를 시도해보세요.</div>`;
            $searchSummary.textContent = `검색 결과가 없습니다.`;
            return;
        }

        const limited = results.slice(0, 40);
        const overflow = results.length - limited.length;
        $searchSummary.textContent = overflow > 0
            ? `${formatNumber(results.length)}개의 항목 중 상위 ${formatNumber(limited.length)}개만 표시합니다.`
            : `${formatNumber(results.length)}개의 항목이 검색되었습니다.`;

        const cards = limited.map((entry, idx) => {
            const typeLabel = typeLabels[entry.type] || '항목';
            const path = `${entry.chapterTitle} → ${entry.sectionTitle}${entry.itemTitle ? ' → ' + entry.itemTitle : ''}`;
            const countLabel = entry.questionCount > 0 ? `${entry.questionCount}문제` : '연결된 문제 없음';

            return `
                <article class="search-card">
                    <div class="search-card-head">
                        <span class="type-badge ${entry.type}">${typeLabel}</span>
                        <div class="q-count-badge">${entry.breakdownHtml}</div>
                    </div>
                    <h3 class="search-card-title">${entry.itemTitle || entry.sectionTitle}</h3>
                    <p class="search-card-sub">${path}</p>
                    <div class="search-card-foot">
                        <span class="search-card-count">${countLabel}</span>
                        <button type="button" class="search-jump" data-index="${entry.index}">목차에서 보기</button>
                    </div>
                </article>
            `;
        });

        if (overflow > 0) {
            cards.push(`<div class="search-summary">${formatNumber(overflow)}개 항목이 더 있습니다. 키워드를 구체화해보세요.</div>`);
        }

        $searchList.innerHTML = cards.join('');
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

        await activateChapter(entry.chapterNum, {
            scrollIntoView: true,
            autoSelectFirstSection: false
        });

        if (Number.isInteger(entry.sectionIndex)) {
            activateSectionByIndex(entry.sectionIndex, {
                scroll: true,
                autoSelectFirstItem: false,
                scrollToItem: true
            });
        }

        if (entry.type === 'item' && Number.isInteger(entry.itemIndex)) {
            activateItemByIndex(entry.itemIndex, { scroll: true });
        }
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

    resetSectionColumn();
    resetItemColumn();
    resetQuestionColumn();

    loadData().then(async success => {
        if (!success) {
            if ($chapterGrid) {
                $chapterGrid.innerHTML = '<div class="item-empty">문제 데이터 로드에 실패했습니다. (question_bank.json이 올바른 경로에 있는지 확인해주세요.)</div>';
            }
            if ($globalTitle) {
                $globalTitle.textContent = '소아과학 목차';
            }
            return;
        }

        await preloadAllChapters();

        const globalBreakdown = getGlobalTotalBreakdown(questionBank);
        if ($globalTitle) {
            $globalTitle.innerHTML = `소아과학 목차 <span class="q-global-badge">${globalBreakdown.html}</span>`;
        }

        const structuralCounts = Array.from(parsedCache.values()).reduce((acc, parsed) => {
            const sections = parsed.sections || [];
            acc.sections += sections.length;
            sections.forEach(sec => {
                acc.items += sec.items.length;
            });
            return acc;
        }, { sections: 0, items: 0 });

        updateHeroMetrics({
            chapters: CHAPTERS.length,
            sections: structuralCounts.sections,
            items: structuralCounts.items,
            questions: globalBreakdown.count
        });

        buildSearchIndex();

        if ($chapterGrid) {
            $chapterGrid.innerHTML = '';
            CHAPTERS.forEach((chapter) => {
                $chapterGrid.appendChild(createChapterCard(chapter));
            });
        }

        const firstChapter = CHAPTERS[0];
        if (firstChapter) {
            await activateChapter(firstChapter.number, {
                autoSelectFirstSection: true,
                autoSelectFirstItem: false,
                scrollIntoView: false
            });
        }
    });
});
