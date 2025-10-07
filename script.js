document.addEventListener('DOMContentLoaded', () => {
    const BASE = './chapter/';
    const CHAPTERS = [
        "1장 서론.md", "2장 소아의 진단.md", "3장 성장과 발달.md",
        "4장 유전.md", "5장 소아의 영양.md", "6장 소아 양생(小兒 養生).md",
        "7장 소아 치료법.md", "8장 신생아 및 초생병.md", "9장 감염병.md",
        "10장 호흡기계의 병증 및 질환.md", "11장 소화기계의 병증 및 질환.md",
        "12장 신경계의 병증 및 질환.md", "13장 소아청소년기 정신장애.md",
        "14장 심혈관계.md", "15장 간담계의 병증 및 질환.md",
        "16장 비뇨생식기계의 병증 및 질환.md", "17장 알레르기 질환.md",
        "18장 면역질환.md", "19장 근·골격계 질환.md", "20장 내분비질환.md",
        "21장 종양.md", "22장 피부질환.md", "23장 안질환.md",
        "24장 증후.md", "25장 급증(손상).md", "26장 소아의료윤리.md"
    ];

    const parsedCache = new Map();
    const searchIndex = [];
    let questionBank = {};
    const ALL_YEARS = ["2021", "2022", "2023", "2024", "2025"];

    const $list = document.getElementById('list');
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

    function makeChapterRow(file) {
        const title = `제${file.replace(/\.md$/, '')}`;
        const li = document.createElement('li');
        li.className = 'chapter';
        li.dataset.file = file;

        const chapMatch = file.match(/^(\d+)/);
        const chapterNum = chapMatch ? chapMatch[1] : '0';

        const chapterBreakdown = getChapterTotalBreakdown(chapterNum, questionBank);

        const $line = document.createElement('button');
        $line.type = 'button';
        $line.className = 'chapter-line';
        $line.setAttribute('aria-expanded', 'false');

        const $lineCount = document.createElement('span');
        $lineCount.className = 'line-count';
        $lineCount.innerHTML = chapterBreakdown.html;

        const $title = document.createElement('span');
        $title.className = 'toc-title';
        $title.textContent = title;

        const $icon = document.createElement('span');
        $icon.className = 'toggle-icon';
        $icon.setAttribute('aria-hidden', 'true');

        $line.append($lineCount, $title, $icon);

        const $sections = document.createElement('div');
        $sections.className = 'sections';

        li.append($line, $sections);

        $line.addEventListener('click', async (event) => {
            event.stopPropagation();
            const open = $line.getAttribute('aria-expanded') === 'true';
            if (open) {
                $sections.classList.remove('visible');
                $line.setAttribute('aria-expanded', 'false');
                return;
            }

            if (!parsedCache.has(file)) {
                try {
                    const res = await fetch(BASE + encodeURIComponent(file), { cache: 'no-store' });
                    if (!res.ok) throw new Error('fetch failed ' + res.status);
                    const md = await res.text();
                    parsedCache.set(file, parseChapter(md));
                } catch (e) {
                    console.error('장 로드 실패', e);
                    $sections.innerHTML = `<div class="item-empty">⚠️ 파일 로드 실패.</div>`;
                    $sections.classList.add('visible');
                    $line.setAttribute('aria-expanded', 'true');
                    return;
                }
            }

            if ($sections.childElementCount === 0) {
                const { sections } = parsedCache.get(file) || { sections: [] };

                if (!sections.length) {
                    $sections.innerHTML = `<div class="item-empty">내용 없음</div>`;
                } else {
                    sections.forEach((sec, secIndex) => {
                        const secWrap = document.createElement('div');
                        secWrap.className = 'section';
                        secWrap.dataset.sectionIndex = String(secIndex);

                        const sectionBreakdown = getSectionTotalBreakdown(chapterNum, sec.numericalKey);

                        const $secLine = document.createElement('button');
                        $secLine.type = 'button';
                        $secLine.className = 'section-line';
                        $secLine.setAttribute('aria-expanded', 'false');

                        const $secCount = document.createElement('span');
                        $secCount.className = 'line-count';
                        $secCount.innerHTML = sectionBreakdown.html;

                        const $secTitle = document.createElement('span');
                        $secTitle.className = 'toc-title';
                        $secTitle.textContent = sec.rawTitle;

                        const $secIcon = document.createElement('span');
                        $secIcon.className = 'toggle-icon';
                        $secIcon.setAttribute('aria-hidden', 'true');

                        $secLine.append($secCount, $secTitle, $secIcon);

                        const $items = document.createElement('ul');
                        $items.className = 'items';

                        $secLine.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const secOpen = $secLine.getAttribute('aria-expanded') === 'true';
                            if (secOpen) {
                                $items.classList.remove('visible');
                                $secLine.setAttribute('aria-expanded', 'false');
                            } else {
                                if ($items.childElementCount === 0) {
                                    const itemQuestionsTotal = [];

                                    if (sec.items.length === 0) {
                                        const emptyItem = document.createElement('li');
                                        emptyItem.className = 'item-empty';
                                        emptyItem.textContent = '등록된 항목이 없습니다.';
                                        $items.appendChild(emptyItem);
                                    } else {
                                        sec.items.forEach((txt, itemIndex) => {
                                            const itemLi = document.createElement('li');
                                            itemLi.className = 'item';
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
                                            $items.appendChild(itemLi);
                                        });
                                    }

                                    const finalSectionBreakdown = getYearlyBreakdown(itemQuestionsTotal);
                                    $secCount.innerHTML = finalSectionBreakdown.html;
                                }

                                $items.classList.add('visible');
                                $secLine.setAttribute('aria-expanded', 'true');
                            }
                        });

                        secWrap.append($secLine, $items);
                        $sections.appendChild(secWrap);
                    });
                }
            }

            $sections.classList.add('visible');
            $line.setAttribute('aria-expanded', 'true');
        });

        return li;
    }

    async function preloadAllChapters() {
        const tasks = CHAPTERS.map(async (file) => {
            if (parsedCache.has(file)) return;
            try {
                const res = await fetch(BASE + encodeURIComponent(file), { cache: 'no-store' });
                if (!res.ok) throw new Error('fetch failed ' + res.status);
                const md = await res.text();
                parsedCache.set(file, parseChapter(md));
            } catch (e) {
                console.error('사전 로드 실패', file, e);
                parsedCache.set(file, { sections: [] });
            }
        });
        await Promise.all(tasks);
    }

    function buildSearchIndex() {
        searchIndex.length = 0;

        CHAPTERS.forEach((file) => {
            const parsed = parsedCache.get(file);
            if (!parsed) return;
            const chapterMatch = file.match(/^(\d+)/);
            const chapterNum = chapterMatch ? chapterMatch[1] : '0';
            const chapterTitle = file.replace(/\.md$/, '');

            parsed.sections.forEach((sec, secIndex) => {
                const sectionBreakdown = getSectionTotalBreakdown(chapterNum, sec.numericalKey);

                const sectionEntry = {
                    type: 'section',
                    file,
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

                if (sec.items.length === 0) {
                    return;
                }

                sec.items.forEach((txt, itemIndex) => {
                    const [c, s, i] = getNumericalParts(txt);
                    const numericalKey = `${c} | ${s} | ${i}`;
                    const itemQuestions = questionBank[numericalKey] || [];
                    const itemBreakdown = getYearlyBreakdown(itemQuestions);

                    const entry = {
                        type: 'item',
                        file,
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
            const path = `제${entry.chapterTitle} → ${entry.sectionTitle}${entry.itemTitle ? ' → ' + entry.itemTitle : ''}`;
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
        const chapterLi = document.querySelector(`li.chapter[data-file="${entry.file}"]`);
        if (!chapterLi) return;

        const chapterLine = chapterLi.querySelector('.chapter-line');
        const ensureChapterOpen = () => {
            if (chapterLine.getAttribute('aria-expanded') !== 'true') {
                chapterLine.click();
            }
        };

        ensureChapterOpen();

        window.requestAnimationFrame(() => {
            const sectionsContainer = chapterLi.querySelector('.sections');
            if (!sectionsContainer) return;
            const sectionEl = sectionsContainer.querySelectorAll('.section')[entry.sectionIndex || 0];
            if (!sectionEl) {
                chapterLine.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const sectionLine = sectionEl.querySelector('.section-line');
            if (sectionLine.getAttribute('aria-expanded') !== 'true') {
                sectionLine.click();
            }

            if (entry.type === 'item' && entry.itemIndex !== null) {
                window.requestAnimationFrame(() => {
                    const itemEl = sectionEl.querySelectorAll('.item')[entry.itemIndex || 0];
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
        });
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
            $list.innerHTML = '<li class="item-empty">문제 데이터 로드에 실패했습니다. (question_bank.json이 올바른 경로에 있는지 확인해주세요.)</li>';
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

        CHAPTERS.forEach((file) => {
            $list.appendChild(makeChapterRow(file));
        });
    });
});
