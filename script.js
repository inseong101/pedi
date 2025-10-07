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
    const $chapterDetail = document.getElementById('chapter-detail');
    const $globalTitle = document.getElementById('global-toc-title');
    const $metricChapters = document.getElementById('metric-chapters');
    const $metricSections = document.getElementById('metric-sections');
    const $metricItems = document.getElementById('metric-items');
    const $metricQuestions = document.getElementById('metric-questions');
    const $searchInput = document.getElementById('search-input');
    const $searchSummary = document.getElementById('search-summary');
    const $searchResults = document.getElementById('search-results');
    const $searchList = document.getElementById('search-list');

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

        const yearChips = [];

        ALL_YEARS.forEach(year => {
            const count = counts[year] || 0;
            const cssClass = count === 0 ? 'year-chip zero-count' : 'year-chip';
            yearChips.push(`<span class="${cssClass}" data-year="${year}">${year.slice(2)}:${count}</span>`);
        });

        const html = `
            <span class="yearly-breakdown">
                <span class="year-chips">${yearChips.join('')}</span>
                <span class="total-chip red-total-chip">${total}</span>
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


    const detailState = {
        activeChapterNumber: null,
        activeButton: null
    };

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

    function closeChapterDetail() {
        if (detailState.activeButton) {
            detailState.activeButton.classList.remove('is-active');
            detailState.activeButton.setAttribute('aria-expanded', 'false');
        }
        detailState.activeButton = null;
        detailState.activeChapterNumber = null;
        if ($chapterDetail) {
            $chapterDetail.innerHTML = '';
        }
    }

    function renderChapterDetailSkeleton(chapter) {
        if (!$chapterDetail) return;
        const breakdown = getChapterTotalBreakdown(chapter.number, questionBank);
        $chapterDetail.innerHTML = `
            <div class="chapter-detail-container loading">
                <header class="chapter-detail-header">
                    <div class="chapter-detail-title">
                        <h3>${chapterDisplayTitle(chapter)}</h3>
                        <span class="chapter-detail-count">${breakdown.html}</span>
                    </div>
                    <button type="button" class="chapter-detail-close" aria-label="장 패널 닫기">×</button>
                </header>
                <div class="chapter-detail-body">
                    <div class="chapter-detail-loading">불러오는 중...</div>
                </div>
            </div>
        `;

        const closeBtn = $chapterDetail.querySelector('.chapter-detail-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeChapterDetail());
        }
    }

    function renderChapterDetailContent(chapter, parsed) {
        if (!$chapterDetail) return;

        const breakdown = getChapterTotalBreakdown(chapter.number, questionBank);
        const container = document.createElement('div');
        container.className = 'chapter-detail-container';

        const header = document.createElement('header');
        header.className = 'chapter-detail-header';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'chapter-detail-title';

        const titleEl = document.createElement('h3');
        titleEl.textContent = chapterDisplayTitle(chapter);

        const countBadge = document.createElement('span');
        countBadge.className = 'chapter-detail-count';
        countBadge.innerHTML = breakdown.html;

        titleWrap.append(titleEl, countBadge);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'chapter-detail-close';
        closeBtn.setAttribute('aria-label', '장 패널 닫기');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => closeChapterDetail());

        header.append(titleWrap, closeBtn);
        container.appendChild(header);

        const body = document.createElement('div');
        body.className = 'chapter-detail-body';

        if (parsed.source === 'fallback' && parsed.sections?.length) {
            const notice = document.createElement('div');
            notice.className = 'fallback-notice';
            notice.textContent = '⚠️ 원본 목차 파일 없이 문제 데이터를 기준으로 구성되었습니다.';
            body.appendChild(notice);
        }

        const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        if (!sections.length) {
            const empty = document.createElement('div');
            empty.className = 'item-empty';
            empty.textContent = parsed.source === 'fallback'
                ? '⚠️ 해당 장의 목차 파일이 없어 문제 데이터를 구성할 수 없습니다.'
                : '등록된 절 정보가 없습니다.';
            body.appendChild(empty);
        } else {
            const sectionsWrap = document.createElement('div');
            sectionsWrap.className = 'detail-sections';

            sections.forEach((sec, secIndex) => {
                const sectionWrap = document.createElement('div');
                sectionWrap.className = 'detail-section';
                sectionWrap.dataset.sectionIndex = String(secIndex);

                const sectionBreakdown = getSectionTotalBreakdown(chapter.number, sec.numericalKey);

                const sectionButton = document.createElement('button');
                sectionButton.type = 'button';
                sectionButton.className = 'section-line';
                sectionButton.setAttribute('aria-expanded', 'false');

                const sectionCount = document.createElement('span');
                sectionCount.className = 'line-count';
                sectionCount.innerHTML = sectionBreakdown.html;

                const sectionTitle = document.createElement('span');
                sectionTitle.className = 'toc-title';
                sectionTitle.textContent = sec.rawTitle;

                const sectionIcon = document.createElement('span');
                sectionIcon.className = 'toggle-icon';
                sectionIcon.setAttribute('aria-hidden', 'true');

                sectionButton.append(sectionCount, sectionTitle, sectionIcon);

                const itemsList = document.createElement('ul');
                itemsList.className = 'detail-items';
                itemsList.hidden = true;

                sectionButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const isOpen = sectionButton.getAttribute('aria-expanded') === 'true';
                    if (isOpen) {
                        itemsList.hidden = true;
                        itemsList.classList.remove('visible');
                        sectionButton.setAttribute('aria-expanded', 'false');
                        return;
                    }

                    if (itemsList.childElementCount === 0) {
                        const itemQuestionsTotal = [];

                        if (!sec.items || sec.items.length === 0) {
                            const emptyItem = document.createElement('li');
                            emptyItem.className = 'item-empty';
                            emptyItem.textContent = '등록된 항목이 없습니다.';
                            itemsList.appendChild(emptyItem);
                        } else {
                            sec.items.forEach((txt, itemIndex) => {
                                const itemLi = document.createElement('li');
                                itemLi.className = 'detail-item';
                                itemLi.dataset.itemIndex = String(itemIndex);

                                const itemButton = document.createElement('button');
                                itemButton.type = 'button';
                                itemButton.className = 'item-line';
                                itemButton.setAttribute('aria-expanded', 'false');

                                const itemCount = document.createElement('span');
                                itemCount.className = 'line-count';

                                const [c, s, i] = getNumericalParts(txt);
                                const numericalKey = `${c} | ${s} | ${i}`;

                                const itemQuestions = questionBank[numericalKey] || [];
                                const itemBreakdown = getYearlyBreakdown(itemQuestions);
                                itemCount.innerHTML = itemBreakdown.html;
                                itemQuestionsTotal.push(...itemQuestions);

                                const itemTitle = document.createElement('span');
                                itemTitle.className = 'item-title';
                                itemTitle.textContent = txt;

                                const itemIcon = document.createElement('span');
                                itemIcon.className = 'toggle-icon';
                                itemIcon.setAttribute('aria-hidden', 'true');

                                itemButton.append(itemCount, itemTitle, itemIcon);

                                const itemContent = document.createElement('div');
                                itemContent.className = 'item-content questions-output';
                                itemContent.hidden = true;

                                itemButton.addEventListener('click', (evt) => {
                                    evt.stopPropagation();
                                    const itemOpen = itemButton.getAttribute('aria-expanded') === 'true';

                                    if (itemOpen) {
                                        itemContent.classList.remove('visible');
                                        itemContent.hidden = true;
                                        itemButton.setAttribute('aria-expanded', 'false');
                                    } else {
                                        if (!itemContent.dataset.loaded) {
                                            renderQuestions(itemQuestions, itemContent);
                                            itemContent.dataset.loaded = 'true';
                                        }

                                        itemContent.classList.add('visible');
                                        itemContent.hidden = false;
                                        itemButton.setAttribute('aria-expanded', 'true');
                                    }
                                });

                                itemContent.addEventListener('click', (evt) => {
                                    evt.stopPropagation();
                                });

                                itemLi.append(itemButton, itemContent);
                                itemsList.appendChild(itemLi);
                            });
                        }

                        const finalSectionBreakdown = getYearlyBreakdown(itemQuestionsTotal);
                        sectionCount.innerHTML = finalSectionBreakdown.html;
                    }

                    itemsList.hidden = false;
                    itemsList.classList.add('visible');
                    sectionButton.setAttribute('aria-expanded', 'true');
                });

                sectionWrap.append(sectionButton, itemsList);
                sectionsWrap.appendChild(sectionWrap);
            });

            body.appendChild(sectionsWrap);
        }

        container.appendChild(body);

        $chapterDetail.innerHTML = '';
        $chapterDetail.appendChild(container);

        document.dispatchEvent(new CustomEvent('chapterdetailready', { detail: { chapter: chapter.number } }));
    }

    function createChapterCard(chapter) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chapter-card';
        button.dataset.chapter = chapter.number;
        button.setAttribute('aria-expanded', 'false');

        const breakdown = getChapterTotalBreakdown(chapter.number, questionBank);

        const countSpan = document.createElement('span');
        countSpan.className = 'chapter-card-count';
        countSpan.innerHTML = breakdown.html;

        const titleWrap = document.createElement('span');
        titleWrap.className = 'chapter-card-title';
        titleWrap.innerHTML = `
            <span class="chapter-card-number">제${chapter.number}장</span>
            <span class="chapter-card-label">${chapter.title}</span>
        `;

        button.append(countSpan, titleWrap);

        button.addEventListener('click', async () => {
            if (detailState.activeButton === button) {
                closeChapterDetail();
                return;
            }

            if (detailState.activeButton) {
                detailState.activeButton.classList.remove('is-active');
                detailState.activeButton.setAttribute('aria-expanded', 'false');
            }

            detailState.activeButton = button;
            detailState.activeChapterNumber = chapter.number;
            button.classList.add('is-active');
            button.setAttribute('aria-expanded', 'true');

            renderChapterDetailSkeleton(chapter);

            const parsed = await ensureChapterParsed(chapter);
            if (detailState.activeChapterNumber !== chapter.number) {
                return;
            }
            renderChapterDetailContent(chapter, parsed || { sections: [], source: 'fallback' });
        });

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

    function revealEntry(entry) {
        if (!entry) return;
        const chapterButton = document.querySelector(`button.chapter-card[data-chapter="${entry.chapterNum}"]`);
        if (!chapterButton) return;

        const focusOnTargets = () => {
            const sectionsContainer = $chapterDetail ? $chapterDetail.querySelector('.detail-sections') : null;
            if (!sectionsContainer) {
                chapterButton.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const sectionEl = sectionsContainer.querySelectorAll('.detail-section')[entry.sectionIndex || 0];
            if (!sectionEl) {
                chapterButton.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const sectionLine = sectionEl.querySelector('.section-line');
            if (!sectionLine) {
                sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            if (sectionLine.getAttribute('aria-expanded') !== 'true') {
                sectionLine.click();
            }

            if (entry.type === 'item' && entry.itemIndex !== null) {
                window.requestAnimationFrame(() => {
                    const itemEl = sectionEl.querySelectorAll('.detail-item')[entry.itemIndex || 0];
                    if (!itemEl) {
                        sectionLine.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        return;
                    }
                    const itemButton = itemEl.querySelector('.item-line');
                    if (!itemButton) {
                        itemEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        return;
                    }
                    if (itemButton.getAttribute('aria-expanded') !== 'true') {
                        itemButton.click();
                    }
                    itemButton.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            } else {
                sectionLine.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        if (detailState.activeChapterNumber === entry.chapterNum) {
            focusOnTargets();
            return;
        }

        const handleReady = (event) => {
            if (!event.detail || event.detail.chapter !== entry.chapterNum) return;
            document.removeEventListener('chapterdetailready', handleReady);
            focusOnTargets();
        };

        document.addEventListener('chapterdetailready', handleReady, { once: true });
        chapterButton.click();
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
                    revealEntry(searchIndex[index]);
                }
            }
        });
    }

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
    });
});
