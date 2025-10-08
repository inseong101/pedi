function initDashboard() {
    const ASSET_VERSION = '20241008';
    const DEFAULT_SUBJECT_ID = 'pedi';
    const SUBJECTS = [
        {
            id: 'pedi',
            name: '소아과학',
            heroEyebrow: 'Pedi board review 2021-2025',
            heroDescription: '기출 5개년 데이터를 기반으로 장·절·항목별 개념과 문제 출제 현황을 한눈에 정리했습니다.',
            chapterBase: './chapter/pedi/',
            conceptBase: './concept/pedi/',
            mediaBase: './media/pedi/',
            chapters: [
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
            ]
        },
        {
            id: 'hanbang',
            name: '한방생리학',
            heroEyebrow: 'Oriental physiology focus 2021-2025',
            heroDescription: '장부생리와 음양오행 이론을 중심으로 핵심 개념과 기출을 정리했습니다.',
            chapterBase: './chapter/hanbang/',
            conceptBase: './concept/hanbang/',
            mediaBase: './media/hanbang/',
            chapters: [
                { number: '1', title: '장부론', file: '1장 장부론.md' },
                { number: '2', title: '음양오행', file: '2장 음양오행.md' },
                { number: '3', title: '영혈순환', file: '3장 영혈순환.md' }
            ]
        }
    ];

    let currentSubject = null;
    let CHAPTER_BASE = '';
    let CONCEPT_BASE = '';
    let MEDIA_BASE = '';
    let CHAPTERS = [];

    let questionBank = {};
    let parsedCache = new Map();
    let chapterStructure = new Map();
    let itemMetadata = new Map();
    let chapterYearIndex = new Map();
    let chapterStats = new Map();
    let conceptCache = new Map();
    let searchIndex = [];
    let years = [];
    let yearMaxCounts = {};
    let openChapters = new Set();

    let subjectNodes = [];
    let sectionYearIndex = new Map();
    let sectionStats = new Map();

    const state = {
        subjectId: DEFAULT_SUBJECT_ID,
        activeChapter: null,
        activeYear: 'all',
        activeSectionIndex: null,
        activeItemIndex: null,
        activeItemKey: null,
        showChapterQuestions: false
    };

    let openSectionsByChapter = new Map();

    const $matrixTable = document.getElementById('chapter-matrix');
    const $matrixSummary = document.getElementById('matrix-summary');
    const $metricChapters = document.getElementById('metric-chapters');
    const $metricSections = document.getElementById('metric-sections');
    const $metricItems = document.getElementById('metric-items');
    const $metricQuestions = document.getElementById('metric-questions');
    const $globalTitle = document.getElementById('global-toc-title');
    const $heroEyebrow = document.getElementById('hero-eyebrow');
    const $heroDesc = document.getElementById('hero-desc');
    const $subjectSwitcher = document.getElementById('subject-switcher');
    const $searchInput = document.getElementById('search-input');
    const $searchSummary = document.getElementById('search-summary');
    const $searchResults = document.getElementById('search-results');
    const $searchList = document.getElementById('search-list');

    const htmlBuffer = document.createElement('div');

    let rawQuestionBanks = null;
    let rawKeyMappings = null;
    const processedQuestionBankCache = new Map();

    function getSubjectById(id) {
        return SUBJECTS.find((subject) => subject.id === id) || null;
    }

    function updateHeroSubjectInfo(subject) {
        if (!subject) return;
        if ($heroEyebrow) {
            $heroEyebrow.textContent = subject.heroEyebrow;
        }
        if ($globalTitle) {
            $globalTitle.textContent = `${subject.name} 목차`;
        }
        if ($heroDesc) {
            $heroDesc.textContent = subject.heroDescription;
        }
    }

    function updateSubjectToggleUI() {
        if (!$subjectSwitcher) return;
        const buttons = $subjectSwitcher.querySelectorAll('[data-subject]');
        buttons.forEach((button) => {
            const isActive = button.getAttribute('data-subject') === state.subjectId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function isHanbangSubject() {
        return currentSubject && currentSubject.id === 'hanbang';
    }

    function getNodeById(nodeId) {
        if (!nodeId) return null;
        return subjectNodes.find((node) => node.id === nodeId) || null;
    }

    function findNodeIdForSection(chapterNumber, sectionNumber) {
        const node = subjectNodes.find(
            (entry) => entry.type === 'section' && entry.chapterNumber === chapterNumber && entry.sectionNumber === sectionNumber
        );
        return node ? node.id : null;
    }

    function getDefaultSearchSummary() {
        const subject = currentSubject || getSubjectById(state.subjectId);
        const subjectLabel = subject ? subject.name : '과목';
        return `${subjectLabel} 범위에서 장·절·항목과 문제를 검색할 수 있습니다.`;
    }

    function resetSearchUI() {
        if ($searchResults) {
            $searchResults.hidden = true;
        }
        if ($searchList) {
            $searchList.innerHTML = '';
        }
        if ($searchSummary) {
            $searchSummary.textContent = getDefaultSearchSummary();
        }
        if ($searchInput) {
            $searchInput.value = '';
        }
    }

    function applyMatrixHeat(button, count, yearKey) {
        if (!button) return;
        button.style.color = '';
        button.style.background = '';
        button.style.boxShadow = '';
        button.removeAttribute('data-intensity');
        button.classList.remove('has-heat');

        if (button.classList.contains('is-active')) {
            return;
        }

        if (yearKey === 'all') {
            button.style.background = 'var(--matrix-button-bg)';
            button.style.color = 'var(--text-primary)';
            return;
        }

        const max = yearMaxCounts[yearKey] || 0;
        if (!max || !count) {
            return;
        }

        const ratio = Math.min(1, Math.max(0, count / max));
        const eased = Math.pow(ratio, 0.75);
        const focusYear = isRecentYear(yearKey);

        if (focusYear) {
            const hue = 5;
            const saturation = 82;
            const minLightness = 86;
            const maxLightness = 32;
            const lightness = minLightness - (minLightness - maxLightness) * eased;
            button.style.background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            button.style.color = eased >= 0.4 ? 'var(--accent-on-dark)' : 'var(--text-primary)';
            const shadowLightness = Math.max(24, lightness - 14);
            const shadowOpacity = 0.35 + eased * 0.35;
            button.style.boxShadow = `inset 0 0 0 1px hsla(${hue}, ${saturation + 6}%, ${shadowLightness}%, ${shadowOpacity.toFixed(3)})`;
        } else {
            const hue = 199;
            const saturation = 86;
            const minLightness = 88;
            const maxLightness = 36;
            const lightness = minLightness - (minLightness - maxLightness) * eased;
            button.style.background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            button.style.color = eased >= 0.45 ? 'var(--accent-on-dark)' : 'var(--text-primary)';
            const shadowLightness = Math.max(24, lightness - 12);
            const shadowOpacity = 0.35 + 0.3 * eased;
            button.style.boxShadow = `inset 0 0 0 1px hsla(${hue}, ${saturation + 4}%, ${shadowLightness}%, ${shadowOpacity.toFixed(3)})`;
        }

        button.dataset.intensity = ratio.toFixed(3);
        button.classList.add('has-heat');
    }

    function isRecentYear(yearKey) {
        const numeric = Number(yearKey);
        return Number.isFinite(numeric) && numeric >= 2021 && numeric <= 2025;
    }

    function resolveQuestionMedia(question) {
        if (!question || !question.data_1) return null;
        const raw = String(question.data_1).trim();
        if (!raw) return null;
        if (/^(https?:|data:|\/)/i.test(raw) || raw.startsWith('./')) {
            return raw;
        }
        const hasExtension = /\.[a-zA-Z0-9]{2,4}$/.test(raw);
        const fileName = hasExtension ? raw : `${raw}.png`;
        const encoded = fileName
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/');
        return MEDIA_BASE ? `${MEDIA_BASE}${encoded}` : encoded;
    }

    function formatNumber(num) {
        return Number(num || 0).toLocaleString('ko-KR');
    }

    function coalesce(value, fallback) {
        return value === undefined || value === null ? fallback : value;
    }

    function stripHtml(html) {
        if (!html) return '';
        htmlBuffer.innerHTML = html;
        const text = htmlBuffer.textContent || '';
        htmlBuffer.textContent = '';
        return text;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatInlineMarkdown(value) {
        const escaped = escapeHtml(value);
        return escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    function markdownToHtml(markdown) {
        if (!markdown) return '';

        const lines = markdown.replace(/\r\n/g, '\n').split('\n');
        const htmlParts = [];
        let bulletOpen = false;
        let orderedOpen = false;
        let paragraphLines = [];
        let blockquoteOpen = false;
        let tableOpen = false;
        let tableLines = [];

        const closeLists = () => {
            if (bulletOpen) {
                htmlParts.push('</ul>');
                bulletOpen = false;
            }
            if (orderedOpen) {
                htmlParts.push('</ol>');
                orderedOpen = false;
            }
        };

        const flushParagraph = () => {
            if (!paragraphLines.length) return;
            htmlParts.push(`<p>${formatInlineMarkdown(paragraphLines.join(' '))}</p>`);
            paragraphLines = [];
        };

        const parseTableRow = (line) => {
            let trimmed = line.trim();
            if (trimmed.startsWith('|')) {
                trimmed = trimmed.slice(1);
            }
            if (trimmed.endsWith('|')) {
                trimmed = trimmed.slice(0, -1);
            }
            return trimmed.split('|').map((cell) => cell.trim());
        };

        const isAlignmentCell = (cell) => {
            const compact = cell.replace(/\s+/g, '');
            return /^:?-{3,}:?$/.test(compact);
        };

        const parseAlignment = (cells) => {
            return cells.map((cell) => {
                const compact = cell.replace(/\s+/g, '');
                const startsWithColon = compact.startsWith(':');
                const endsWithColon = compact.endsWith(':');
                if (startsWithColon && endsWithColon) return 'center';
                if (endsWithColon) return 'right';
                return 'left';
            });
        };

        const closeTable = () => {
            if (!tableOpen || !tableLines.length) return;

            const rows = tableLines.map(parseTableRow).filter((cells) => cells.length > 1);
            tableLines = [];
            tableOpen = false;

            if (!rows.length) return;

            const headerCells = rows[0];
            let alignments = headerCells.map(() => 'left');
            let bodyStartIndex = 1;

            if (rows.length > 1) {
                const alignmentRow = rows[1];
                const isAlignmentRow = alignmentRow.length === headerCells.length && alignmentRow.every(isAlignmentCell);
                if (isAlignmentRow) {
                    alignments = parseAlignment(alignmentRow);
                    bodyStartIndex = 2;
                }
            }

            htmlParts.push('<table>');
            htmlParts.push('<thead><tr>');
            headerCells.forEach((cell, index) => {
                const align = alignments[index] || 'left';
                const alignAttr = align !== 'left' ? ` style="text-align:${align}"` : '';
                htmlParts.push(`<th${alignAttr}>${formatInlineMarkdown(cell)}</th>`);
            });
            htmlParts.push('</tr></thead>');

            if (rows.length > bodyStartIndex) {
                htmlParts.push('<tbody>');
                for (let i = bodyStartIndex; i < rows.length; i += 1) {
                    const cells = rows[i];
                    htmlParts.push('<tr>');
                    cells.forEach((cell, index) => {
                        const align = alignments[index] || 'left';
                        const alignAttr = align !== 'left' ? ` style="text-align:${align}"` : '';
                        htmlParts.push(`<td${alignAttr}>${formatInlineMarkdown(cell)}</td>`);
                    });
                    htmlParts.push('</tr>');
                }
                htmlParts.push('</tbody>');
            }

            htmlParts.push('</table>');
        };

        const closeBlockquote = () => {
            if (!blockquoteOpen) return;
            flushParagraph();
            htmlParts.push('</blockquote>');
            blockquoteOpen = false;
        };

        const isTableLine = (line) => {
            if (!/^\|.*\|$/.test(line)) return false;
            const cells = parseTableRow(line);
            return cells.length > 1;
        };

        lines.forEach((rawLine) => {
            const line = rawLine.trim();

            if (!line) {
                closeTable();
                flushParagraph();
                return;
            }

            const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
            if (headingMatch) {
                closeTable();
                flushParagraph();
                closeLists();
                closeBlockquote();
                const level = headingMatch[1].length;
                const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : level === 3 ? 'h4' : 'h5';
                htmlParts.push(`<${tag}>${formatInlineMarkdown(headingMatch[2])}</${tag}>`);
                return;
            }

            const quoteMatch = line.match(/^>\s?(.*)$/);
            if (quoteMatch) {
                closeTable();
                if (!blockquoteOpen) {
                    flushParagraph();
                    closeLists();
                    htmlParts.push('<blockquote>');
                    blockquoteOpen = true;
                }
                paragraphLines.push(quoteMatch[1]);
                return;
            }

            if (blockquoteOpen && !quoteMatch) {
                closeBlockquote();
            }

            if (isTableLine(line)) {
                if (!tableOpen) {
                    flushParagraph();
                    closeLists();
                    closeBlockquote();
                    tableOpen = true;
                    tableLines = [];
                }
                tableLines.push(line);
                return;
            }

            closeTable();

            const bulletMatch = line.match(/^[-*+]\s+(.*)$/);
            if (bulletMatch) {
                flushParagraph();
                if (orderedOpen) {
                    htmlParts.push('</ol>');
                    orderedOpen = false;
                }
                if (!bulletOpen) {
                    htmlParts.push('<ul>');
                    bulletOpen = true;
                }
                htmlParts.push(`<li>${formatInlineMarkdown(bulletMatch[1])}</li>`);
                return;
            }

            const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
            if (orderedMatch) {
                flushParagraph();
                if (bulletOpen) {
                    htmlParts.push('</ul>');
                    bulletOpen = false;
                }
                if (!orderedOpen) {
                    htmlParts.push('<ol>');
                    orderedOpen = true;
                }
                htmlParts.push(`<li>${formatInlineMarkdown(orderedMatch[1])}</li>`);
                return;
            }

            if (bulletOpen || orderedOpen) {
                closeLists();
            }

            paragraphLines.push(line);
        });

        flushParagraph();
        closeLists();
        closeBlockquote();
        closeTable();

        return htmlParts.join('');
    }

    function getConceptFileName(numericalKey) {
        if (!numericalKey) return null;
        const parts = numericalKey.split('|').map(part => part.trim()).filter(Boolean);
        if (parts.length < 3) return null;
        return `${parts.join('-')}.md`;
    }

    function updateSearchIndexWithConcept(numericalKey, text) {
        const payload = (text || '').toLowerCase();
        if (!payload) return;
        searchIndex.forEach((entry) => {
            if (entry.numericalKey === numericalKey && !entry.searchText.includes(payload)) {
                entry.searchText += ` ${payload}`;
            }
        });
    }

    function ensureConceptLoaded(numericalKey) {
        if (conceptCache.has(numericalKey)) {
            return conceptCache.get(numericalKey);
        }

        const fileName = getConceptFileName(numericalKey);
        if (!fileName) {
            const missing = Promise.resolve({ status: 'missing' });
            conceptCache.set(numericalKey, missing);
            return missing;
        }

        const request = fetch(`${CONCEPT_BASE}${fileName}?v=${ASSET_VERSION}`)
            .then((response) => {
                if (!response.ok) {
                    return { status: 'missing' };
                }
                return response.text().then((markdown) => {
                    const html = markdownToHtml(markdown);
                    const plain = stripHtml(html);
                    if (!html.trim()) {
                        return { status: 'empty' };
                    }
                    return { status: 'ready', html, plain };
                });
            })
            .catch(() => ({ status: 'missing' }))
            .then((result) => {
                if (result.status === 'ready' && result.plain) {
                    updateSearchIndexWithConcept(numericalKey, result.plain);
                }
                return result;
            });

        conceptCache.set(numericalKey, request);
        return request;
    }

    function loadConceptContent(numericalKey, container) {
        if (!container) return;
        container.innerHTML = '<div class="concept-status">개념 자료 불러오는 중...</div>';

        ensureConceptLoaded(numericalKey).then((result) => {
            if (!container.isConnected) {
                return;
            }

            if (!result || result.status !== 'ready') {
                container.innerHTML = '<div class="concept-empty">이 항목의 개념 자료가 준비 중입니다.</div>';
                return;
            }

            container.innerHTML = `<article class="concept-content">${result.html}</article>`;
        });
    }

    function chapterDisplayTitle(chapter) {
        return `제${chapter.number}장 ${chapter.title}`;
    }

    function clearElement(element) {
        if (element) {
            element.innerHTML = '';
        }
    }

    async function ensureQuestionBanksLoaded() {
        if (rawQuestionBanks) {
            return rawQuestionBanks;
        }
        try {
            const response = await fetch(`question_bank.json?v=${ASSET_VERSION}`);
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
            rawQuestionBanks = await response.json();
        } catch (error) {
            console.error('question_bank.json 로드 실패', error);
            rawQuestionBanks = null;
        }
        return rawQuestionBanks;
    }

    async function ensureKeyMappingsLoaded() {
        if (rawKeyMappings) {
            return rawKeyMappings;
        }
        try {
            const response = await fetch(`key_mapping.json?v=${ASSET_VERSION}`);
            if (!response.ok) {
                throw new Error(`status ${response.status}`);
            }
            rawKeyMappings = await response.json();
        } catch (error) {
            console.error('key_mapping.json 로드 실패', error);
            rawKeyMappings = null;
        }
        return rawKeyMappings;
    }

    function getProcessedQuestionBank(subjectId) {
        if (processedQuestionBankCache.has(subjectId)) {
            return processedQuestionBankCache.get(subjectId);
        }
        const source = rawQuestionBanks && rawQuestionBanks[subjectId]
            ? rawQuestionBanks[subjectId]
            : {};
        const clone = JSON.parse(JSON.stringify(source));
        processedQuestionBankCache.set(subjectId, clone);
        return clone;
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
        sectionYearIndex.clear();
        sectionStats.clear();

        const pushToIndex = (map, key, question) => {
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key).push(question);
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

            entries.forEach((question, index) => {
                const year = (question.id || '').split('-')[0] || '기타';
                yearSet.add(year);

                const optionsPlain = stripHtml(question.options_html || '');
                const conceptPlain = stripHtml(question.concept_html || '');
                const searchPieces = [
                    question.question_text,
                    question.answer_text,
                    question.explanation,
                    question.concept_text,
                    optionsPlain,
                    conceptPlain
                ].filter(Boolean);

                const augmented = {
                    ...question,
                    chapterNumber: chapterNum,
                    chapterTitle,
                    sectionNumber: sectionNum,
                    sectionTitle: meta ? meta.sectionTitle : '',
                    itemNumber: itemNum,
                    itemLabel: meta ? meta.label : (question.item_key || ''),
                    numericalKey,
                    year,
                    optionsPlain,
                    conceptPlain,
                    searchContent: searchPieces.join(' ')
                };

                entries[index] = augmented;

                pushToIndex(chapterYearIndex, `${chapterNum}|${year}`, augmented);
                pushToIndex(chapterYearIndex, `${chapterNum}|all`, augmented);

                const sectionKey = `${chapterNum}|${sectionNum}`;
                pushToIndex(sectionYearIndex, `${sectionKey}|${year}`, augmented);
                pushToIndex(sectionYearIndex, `${sectionKey}|all`, augmented);

                if (!chapterStats.has(chapterNum)) {
                    chapterStats.set(chapterNum, { perYear: {}, total: 0, sections: 0, items: 0 });
                }
                const stats = chapterStats.get(chapterNum);
                stats.perYear[year] = (stats.perYear[year] || 0) + 1;
                stats.total += 1;

                if (!sectionStats.has(sectionKey)) {
                    sectionStats.set(sectionKey, { perYear: {}, total: 0, sections: 1, items: 0 });
                }
                const secStats = sectionStats.get(sectionKey);
                secStats.perYear[year] = (secStats.perYear[year] || 0) + 1;
                secStats.total += 1;
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
                structure.sections.forEach((section) => {
                    const sectionKey = `${chapter.number}|${section.numericalKey}`;
                    if (!sectionStats.has(sectionKey)) {
                        sectionStats.set(sectionKey, { perYear: {}, total: 0, sections: 1, items: 0 });
                    }
                    const secStats = sectionStats.get(sectionKey);
                    years.forEach((year) => {
                        if (!Object.prototype.hasOwnProperty.call(secStats.perYear, year)) {
                            secStats.perYear[year] = 0;
                        }
                    });
                    secStats.items = section.items.length;
                    sectionStats.set(sectionKey, secStats);
                });
            }
            chapterStats.set(chapter.number, stats);
        });
    }

    function buildSubjectNodes() {
        subjectNodes = [];
        if (isHanbangSubject()) {
            CHAPTERS.forEach((chapter) => {
                const structure = chapterStructure.get(chapter.number);
                if (!structure) return;
                structure.sections.forEach((section) => {
                    const nodeId = `${chapter.number}|${section.numericalKey}`;
                    subjectNodes.push({
                        id: nodeId,
                        type: 'section',
                        chapterNumber: chapter.number,
                        sectionNumber: section.numericalKey,
                        sectionIndex: section.sectionIndex,
                        title: section.rawTitle,
                        chapterTitle: structure.chapterTitle,
                        chapterRef: chapter,
                        sectionRef: section
                    });
                });
            });
        } else {
            subjectNodes = CHAPTERS.map((chapter) => ({
                id: chapter.number,
                type: 'chapter',
                chapterNumber: chapter.number,
                title: chapter.title,
                chapterTitle: chapterDisplayTitle(chapter),
                chapterRef: chapter
            }));
        }
    }

    function recomputeYearMaxCounts() {
        yearMaxCounts = years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {});
        yearMaxCounts.total = 0;
        const rows = subjectNodes.length
            ? subjectNodes
            : CHAPTERS.map((chapter) => ({ id: chapter.number, type: 'chapter', chapterNumber: chapter.number }));

        rows.forEach((node) => {
            const stats = getNodeStats(node);
            if (!stats) return;
            yearMaxCounts.total = Math.max(yearMaxCounts.total, stats.total || 0);
            years.forEach((year) => {
                yearMaxCounts[year] = Math.max(yearMaxCounts[year], stats.perYear ? (stats.perYear[year] || 0) : 0);
            });
        });
    }

    function computeGlobalStats() {
        let totalQuestions = 0;
        let totalSections = 0;
        let totalItems = 0;
        const rows = subjectNodes.length
            ? subjectNodes
            : CHAPTERS.map((chapter) => ({ id: chapter.number, type: 'chapter', chapterNumber: chapter.number }));

        rows.forEach((node) => {
            const stats = getNodeStats(node);
            if (!stats) return;
            totalQuestions += stats.total || 0;
            if (node.type === 'section') {
                totalSections += 1;
            } else {
                totalSections += stats.sections || 0;
            }
            totalItems += stats.items || 0;
        });

        return {
            chapters: rows.length,
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

    async function activateSubject(subjectId) {
        const subject = getSubjectById(subjectId) || SUBJECTS[0];
        if (!subject) return;

        const questionPayload = await ensureQuestionBanksLoaded();
        await ensureKeyMappingsLoaded();

        if (!questionPayload) {
            if ($matrixSummary) {
                $matrixSummary.textContent = '문제 데이터를 불러오지 못했습니다. question_bank.json 경로를 확인해주세요.';
            }
            return;
        }

        currentSubject = subject;
        state.subjectId = subject.id;
        CHAPTER_BASE = subject.chapterBase;
        CONCEPT_BASE = subject.conceptBase;
        const rawMediaBase = subject.mediaBase || '';
        MEDIA_BASE = rawMediaBase ? (rawMediaBase.endsWith('/') ? rawMediaBase : `${rawMediaBase}/`) : '';
        CHAPTERS = subject.chapters;

        questionBank = getProcessedQuestionBank(subject.id);
        parsedCache = new Map();
        chapterStructure = new Map();
        itemMetadata = new Map();
        chapterYearIndex = new Map();
        chapterStats = new Map();
        sectionYearIndex = new Map();
        sectionStats = new Map();
        subjectNodes = [];
        conceptCache = new Map();
        searchIndex = [];
        years = [];
        yearMaxCounts = {};
        openChapters = new Set();
        openSectionsByChapter = new Map();

        state.activeChapter = null;
        state.activeYear = 'all';
        state.activeSectionIndex = null;
        state.activeItemIndex = null;
        state.activeItemKey = null;
        state.showChapterQuestions = false;

        updateSubjectToggleUI();
        updateHeroSubjectInfo(subject);
        resetSearchUI();

        await preloadAllChapters();
        computeYearsAndIndex();
        buildSubjectNodes();
        buildSearchIndex();
        recomputeYearMaxCounts();
        updateHeroMetrics(computeGlobalStats());
        renderMatrix();
    }

    function getChapterStats(chapterNumber) {
        return chapterStats.get(chapterNumber) || { perYear: {}, total: 0, sections: 0, items: 0 };
    }

    function getSectionStats(chapterNumber, sectionNumber) {
        const key = `${chapterNumber}|${sectionNumber}`;
        return sectionStats.get(key) || { perYear: {}, total: 0, sections: 1, items: 0 };
    }

    function getNodeStats(node) {
        if (!node) {
            return { perYear: {}, total: 0, sections: 0, items: 0 };
        }
        if (node.type === 'section') {
            return getSectionStats(node.chapterNumber, node.sectionNumber);
        }
        return getChapterStats(node.chapterNumber);
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
        const rows = subjectNodes.length
            ? subjectNodes
            : CHAPTERS.map((chapter) => ({
                id: chapter.number,
                type: 'chapter',
                chapterNumber: chapter.number,
                chapterTitle: chapterDisplayTitle(chapter),
                chapterRef: chapter
            }));

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headingCell = document.createElement('th');
        headingCell.scope = 'col';
        headingCell.className = 'matrix-heading matrix-heading--label';
        headingCell.textContent = isHanbangSubject() ? '절' : '장';
        headerRow.appendChild(headingCell);

        columns.forEach((column) => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.className = 'matrix-heading';
            const isTotal = column === 'total';
            if (!isTotal && isRecentYear(column)) {
                th.classList.add('is-recent-year');
            }
            th.textContent = isTotal ? '총합' : `${column}년`;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');

        rows.forEach((node) => {
            const stats = getNodeStats(node);
            const row = document.createElement('tr');
            row.dataset.node = node.id;
            row.dataset.chapter = node.chapterNumber;

            const labelCell = document.createElement('th');
            labelCell.scope = 'row';
            labelCell.className = 'matrix-row-label';

            const labelButton = document.createElement('button');
            labelButton.type = 'button';
            labelButton.className = 'matrix-row-toggle';
            if (openChapters.has(node.id)) {
                labelButton.classList.add('is-open');
            }
            if (state.activeChapter === node.id) {
                labelButton.classList.add('is-active');
            }
            labelButton.dataset.node = node.id;
            labelButton.dataset.chapter = node.chapterNumber;
            labelButton.textContent = node.type === 'section'
                ? `${node.chapterTitle} · ${node.title}`
                : (node.chapterTitle || (node.chapterRef ? chapterDisplayTitle(node.chapterRef) : ''));
            labelCell.appendChild(labelButton);
            row.appendChild(labelCell);

            columns.forEach((column) => {
                const cell = document.createElement('td');
                cell.className = 'matrix-data-cell';
                const isTotal = column === 'total';
                const yearKey = isTotal ? 'all' : column;
                cell.dataset.year = yearKey;
                cell.dataset.node = node.id;
                if (!isTotal && isRecentYear(column)) {
                    cell.classList.add('is-recent-year');
                }
                const count = isTotal
                    ? stats.total || 0
                    : coalesce(stats.perYear ? stats.perYear[column] : 0, 0);

                if (count > 0) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'matrix-button';
                    if (!isTotal && isRecentYear(column)) {
                        button.classList.add('is-recent-year');
                    }
                    if (
                        state.activeChapter === node.id &&
                        state.activeYear === yearKey &&
                        state.showChapterQuestions
                    ) {
                        button.classList.add('is-active');
                    }
                    button.dataset.node = node.id;
                    button.dataset.chapter = node.chapterNumber;
                    if (node.type === 'section') {
                        button.dataset.section = node.sectionNumber;
                    }
                    button.dataset.year = yearKey;
                    button.textContent = formatNumber(count);
                    applyMatrixHeat(button, count, yearKey);
                    cell.appendChild(button);
                } else {
                    const span = document.createElement('span');
                    span.className = 'matrix-value is-zero';
                    span.textContent = '0';
                    cell.appendChild(span);
                    cell.classList.add('is-zero');
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);

            if (openChapters.has(node.id)) {
                const detailRow = document.createElement('tr');
                detailRow.className = 'matrix-detail-row';
                detailRow.dataset.node = node.id;
                detailRow.dataset.chapter = node.chapterNumber;

                const detailCell = document.createElement('td');
                detailCell.colSpan = columns.length + 1;

                const detailContainer = document.createElement('div');
                detailContainer.className = 'chapter-detail';

                buildNodeDetail(node, detailContainer);

                detailCell.appendChild(detailContainer);
                detailRow.appendChild(detailCell);
                tbody.appendChild(detailRow);
            }
        });

        clearElement($matrixTable);
        $matrixTable.appendChild(thead);
        $matrixTable.appendChild(tbody);

        if ($matrixSummary) {
            const subjectLabel = currentSubject ? currentSubject.name : '각';
            const unitLabel = isHanbangSubject() ? '절 제목' : '장 제목';
            $matrixSummary.textContent = `${subjectLabel} ${unitLabel}을 누르면 절과 항목을 동시에 여러 개 펼칠 수 있습니다. 연도(2021~2025 강조)나 총합 셀을 선택하면 해당 문제 목록이 표시됩니다.`;
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
            const mediaUrl = resolveQuestionMedia(q);

            li.innerHTML = `
                <div class="question-header">
                    <span class="q-year">${year ? `${year}년` : ''} ${number ? `${number}번` : ''}</span>
                    <span class="q-item-key">${itemTitle}</span>
                </div>
                ${mediaUrl ? `<figure class="question-data"><img src="${mediaUrl}" alt="문제 자료" class="data-image" loading="lazy"></figure>` : ''}
                <div class="question-body">${q.question_text || ''}</div>
                <ul class="question-options">${q.options_html || ''}</ul>
            `;

            const optionsList = li.querySelector('.question-options');
            const mediaImg = li.querySelector('.data-image');

            li.classList.add('show-answer');

            if (mediaImg) {
                mediaImg.addEventListener('error', () => {
                    if (!mediaImg.isConnected) return;
                    const fallback = document.createElement('div');
                    fallback.className = 'media-fallback';
                    fallback.innerHTML = `📁 <span>이미지 파일을 <code>${MEDIA_BASE}</code> 경로에 추가해주세요.</span>`;
                    const figure = mediaImg.closest('figure.question-data');
                    if (figure) {
                        figure.innerHTML = '';
                        figure.appendChild(fallback);
                    } else {
                        mediaImg.replaceWith(fallback);
                    }
                }, { once: true });
            }

            if (optionsList) {
                const answerMarkers = Array.from(optionsList.querySelectorAll('span.answer'));
                answerMarkers.forEach((marker) => {
                    const option = marker.closest('li');
                    if (option) {
                        option.dataset.correct = 'true';
                        if (!option.querySelector('.answer-badge')) {
                            const badge = document.createElement('span');
                            badge.className = 'answer-badge';
                            badge.textContent = '정답';
                            badge.setAttribute('aria-hidden', 'true');
                            option.appendChild(badge);
                        }
                    }
                    marker.remove();
                });
            }

            ul.appendChild(li);
        });

        target.appendChild(ul);
    }

    function buildNodeDetail(node, container) {
        if (!node) return;
        container.innerHTML = '';

        const chapterNumber = node.chapterNumber;
        const chapter = node.chapterRef || CHAPTERS.find(ch => ch.number === chapterNumber) || { number: chapterNumber, title: '' };
        const chapterTitle = node.chapterTitle || chapterDisplayTitle(chapter);
        const nodeId = node.id;
        const chapterQuestions = getNodeQuestions(node, 'all');

        if (state.showChapterQuestions && state.activeChapter === nodeId) {
            const yearKey = state.activeYear;
            const filteredChapterQuestions = getNodeQuestions(node, yearKey);
            const yearLabel = yearKey === 'all' ? '전체 문제' : `${yearKey}년 문제`;
            const yearSummary = yearKey === 'all'
                ? `${chapterTitle} · 총 ${formatNumber(filteredChapterQuestions.length)}문제`
                : `${chapterTitle} · ${yearKey}년 ${formatNumber(filteredChapterQuestions.length)}문제`;

            const yearPanel = document.createElement('section');
            yearPanel.className = 'chapter-year-panel';

            const yearHeader = document.createElement('header');
            yearHeader.className = 'chapter-year-header';
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
            return;
        }

        const structure = chapterStructure.get(chapterNumber);

        if (node.type === 'section') {
            const section = structure
                ? structure.sections.find(sec => sec.sectionIndex === node.sectionIndex)
                : null;

            if (!section) {
                const empty = document.createElement('div');
                empty.className = 'detail-placeholder';
                empty.textContent = '등록된 항목이 없습니다.';
                container.appendChild(empty);
                return;
            }

            const itemList = document.createElement('div');
            itemList.className = 'chapter-item-list';

            if (!section.items.length) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'detail-placeholder';
                emptyItem.textContent = '등록된 항목이 없습니다.';
                itemList.appendChild(emptyItem);
                container.appendChild(itemList);
                return;
            }

            section.items.forEach((item) => {
                const questions = questionBank[item.numericalKey] || [];
                const filteredCount = filterQuestionsByYear(questions, state.activeYear).length;
                const itemRow = document.createElement('div');
                itemRow.className = 'chapter-item-row';

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'chapter-item-button';
                if (filteredCount === 0) {
                    button.classList.add('is-zero');
                }
                const isActive = (
                    state.activeChapter === nodeId &&
                    state.activeSectionIndex === section.sectionIndex &&
                    state.activeItemIndex === item.itemIndex &&
                    state.activeItemKey === item.numericalKey
                );
                if (isActive) {
                    button.classList.add('is-active');
                }
                button.dataset.node = nodeId;
                button.dataset.chapter = chapterNumber;
                button.dataset.sectionIndex = String(section.sectionIndex);
                button.dataset.itemIndex = String(item.itemIndex);
                button.dataset.itemKey = item.numericalKey;
                button.innerHTML = `
                    <span class="item-name">${item.label}</span>
                    <span class="item-count">${formatNumber(filteredCount)}문제</span>
                `;
                button.addEventListener('click', () => {
                    handleItemSelection(node, section.sectionIndex, item.itemIndex, item.numericalKey);
                });
                itemRow.appendChild(button);

                const detailPanel = document.createElement('div');
                detailPanel.className = 'chapter-item-detail';
                detailPanel.dataset.itemKey = item.numericalKey;
                if (isActive) {
                    detailPanel.classList.add('is-open');
                    renderItemDetail(chapterNumber, section, item, detailPanel);
                } else {
                    detailPanel.hidden = true;
                }
                itemRow.appendChild(detailPanel);

                itemList.appendChild(itemRow);
            });

            container.appendChild(itemList);
            return;
        }

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
            const sectionCountClass = sectionCount > 0 ? 'section-count' : 'section-count is-zero';
            summary.innerHTML = `
                <span class="section-title">${section.rawTitle}</span>
                <span class="${sectionCountClass}">${formatNumber(sectionCount)}문제</span>
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
                    const itemRow = document.createElement('div');
                    itemRow.className = 'chapter-item-row';

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'chapter-item-button';
                    if (filteredCount === 0) {
                        button.classList.add('is-zero');
                    }
                    const isActive = (
                        state.activeChapter === chapterNumber &&
                        state.activeSectionIndex === section.sectionIndex &&
                        state.activeItemIndex === item.itemIndex &&
                        state.activeItemKey === item.numericalKey
                    );
                    if (isActive) {
                        button.classList.add('is-active');
                    }
                    button.dataset.node = nodeId;
                    button.dataset.chapter = chapterNumber;
                    button.dataset.sectionIndex = String(section.sectionIndex);
                    button.dataset.itemIndex = String(item.itemIndex);
                    button.dataset.itemKey = item.numericalKey;
                    button.innerHTML = `
                        <span class="item-name">${item.label}</span>
                        <span class="item-count">${formatNumber(filteredCount)}문제</span>
                    `;
                    button.addEventListener('click', () => {
                        handleItemSelection(node, section.sectionIndex, item.itemIndex, item.numericalKey);
                    });
                    itemRow.appendChild(button);

                    const detailPanel = document.createElement('div');
                    detailPanel.className = 'chapter-item-detail';
                    detailPanel.dataset.itemKey = item.numericalKey;
                    if (isActive) {
                        detailPanel.classList.add('is-open');
                        renderItemDetail(chapterNumber, section, item, detailPanel);
                    } else {
                        detailPanel.hidden = true;
                    }
                    itemRow.appendChild(detailPanel);

                    itemList.appendChild(itemRow);
                });
            }

            body.appendChild(itemList);
            details.appendChild(body);
            sectionWrap.appendChild(details);
        });

        container.appendChild(sectionWrap);
    }

    function renderItemDetail(chapterNumber, section, itemEntry, container) {
        container.innerHTML = '';
        container.hidden = false;

        const meta = itemMetadata.get(itemEntry.numericalKey);
        const chapterInfo = CHAPTERS.find(ch => ch.number === chapterNumber) || { number: chapterNumber, title: '' };
        const pathLabel = meta
            ? `${meta.chapterTitle} → ${meta.sectionTitle} → ${meta.label}`
            : `${chapterDisplayTitle(chapterInfo)} → ${section.rawTitle} → ${itemEntry.label}`;
        const itemLabel = meta ? meta.label : itemEntry.label;
        const yearTrail = state.activeYear === 'all' ? '' : ` · ${state.activeYear}년`;

        const header = document.createElement('header');
        header.className = 'item-detail-header';
        header.innerHTML = `
            <h4 class="detail-title">${itemLabel}</h4>
            <p class="detail-summary">${pathLabel}${yearTrail}</p>
        `;
        container.appendChild(header);

        const detailGrid = document.createElement('div');
        detailGrid.className = 'item-detail-grid';

        const questionWrap = document.createElement('div');
        questionWrap.className = 'item-detail-questions';
        const questions = filterQuestionsByYear(questionBank[itemEntry.numericalKey] || [], state.activeYear).map((q) => ({
            ...q,
            itemLabel: q.itemLabel || itemLabel
        }));
        renderQuestions(questions, questionWrap);
        detailGrid.appendChild(questionWrap);

        const conceptWrap = document.createElement('div');
        conceptWrap.className = 'item-detail-concept';
        detailGrid.appendChild(conceptWrap);
        loadConceptContent(itemEntry.numericalKey, conceptWrap);

        container.appendChild(detailGrid);
    }

    function scrollToNodeDetail(nodeId) {
        if (!$matrixTable) return;
        requestAnimationFrame(() => {
            const detailRow = $matrixTable.querySelector(`tr.matrix-detail-row[data-node="${nodeId}"]`);
            if (detailRow && typeof detailRow.scrollIntoView === 'function') {
                detailRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function scrollToDetailSection(nodeId, sectionIndex) {
        if (!$matrixTable) return;
        requestAnimationFrame(() => {
            const selector = `tr.matrix-detail-row[data-node="${nodeId}"] details.chapter-section[data-section-index="${sectionIndex}"]`;
            const sectionEl = $matrixTable.querySelector(selector);
            if (sectionEl && typeof sectionEl.scrollIntoView === 'function') {
                sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function getNodeQuestions(node, yearKey = 'all') {
        if (!node) return [];
        const key = yearKey || 'all';
        if (node.type === 'section') {
            const composite = `${node.chapterNumber}|${node.sectionNumber}|${key}`;
            return sectionYearIndex.get(composite) || [];
        }
        return chapterYearIndex.get(`${node.chapterNumber}|${key}`) || [];
    }

    function filterQuestionsByYear(questions, yearKey) {
        if (yearKey === 'all') return questions;
        return questions.filter(q => q.year === yearKey);
    }

    async function handleNodeLabelClick(nodeId, options = {}) {
        const node = getNodeById(nodeId);
        if (!node) return;
        const chapter = node.chapterRef || CHAPTERS.find(ch => ch.number === node.chapterNumber);
        if (!chapter) return;

        await ensureChapterParsed(chapter);

        if (openChapters.has(nodeId)) {
            openChapters.delete(nodeId);

            if (state.activeChapter === nodeId) {
                state.activeChapter = null;
                state.activeYear = 'all';
                state.activeSectionIndex = null;
                state.activeItemIndex = null;
                state.activeItemKey = null;
                state.showChapterQuestions = false;
            }

            renderMatrix();
            return;
        }

        openChapters.add(nodeId);

        state.activeChapter = nodeId;
        state.activeYear = 'all';
        state.activeSectionIndex = node.type === 'section' ? node.sectionIndex : null;
        state.activeItemIndex = null;
        state.activeItemKey = null;
        state.showChapterQuestions = false;

        renderMatrix();

        if (options.scrollToDetail !== false) {
            scrollToNodeDetail(nodeId);
        }
    }

    async function handleNodeYearSelection(nodeId, yearKey, options = {}) {
        const node = getNodeById(nodeId);
        if (!node) return;
        const chapter = node.chapterRef || CHAPTERS.find(ch => ch.number === node.chapterNumber);
        if (!chapter) return;

        await ensureChapterParsed(chapter);

        const alreadyOpen = (
            state.activeChapter === nodeId &&
            state.activeYear === yearKey &&
            state.showChapterQuestions &&
            state.activeItemKey === null
        );

        if (alreadyOpen) {
            state.showChapterQuestions = false;
            state.activeYear = 'all';
            state.activeSectionIndex = null;
            state.activeItemIndex = null;
            state.activeItemKey = null;
            renderMatrix();
            return;
        }
        openChapters.add(nodeId);
        state.activeChapter = nodeId;
        state.activeYear = yearKey;
        state.showChapterQuestions = true;

        state.activeSectionIndex = node.type === 'section' ? node.sectionIndex : null;
        state.activeItemIndex = null;
        state.activeItemKey = null;

        renderMatrix();

        if (options.scrollToDetail !== false) {
            scrollToNodeDetail(nodeId);
        }
    }

    function handleItemSelection(node, sectionIndex, itemIndex, itemKey) {
        if (!node) return;
        openChapters.add(node.id);
        state.activeChapter = node.id;
        state.activeSectionIndex = sectionIndex;
        state.showChapterQuestions = false;

        const isSame = state.activeItemKey === itemKey && state.activeItemIndex === itemIndex;

        if (isSame) {
            state.activeItemIndex = null;
            state.activeItemKey = null;
        } else {
            state.activeItemIndex = itemIndex;
            state.activeItemKey = itemKey;
            ensureSectionOpenState(node.chapterNumber).add(sectionIndex);
        }

        renderMatrix();
        scrollToDetailSection(node.id, sectionIndex);
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

                const sectionSearchPieces = [chapterTitle, section.rawTitle];
                sectionQuestions.forEach((q) => {
                    if (q.searchContent) sectionSearchPieces.push(q.searchContent);
                });

                const nodeId = findNodeIdForSection(chapter.number, section.numericalKey);

                const sectionEntry = {
                    type: 'section',
                    chapterNum: chapter.number,
                    chapterTitle,
                    sectionTitle: section.rawTitle,
                    itemTitle: '',
                    questionCount: sectionQuestions.length,
                    searchText: sectionSearchPieces.join(' ').toLowerCase(),
                    sectionIndex: section.sectionIndex,
                    sectionNumber: section.numericalKey,
                    itemIndex: null,
                    nodeId: nodeId || null
                };
                sectionEntry.index = searchIndex.length;
                searchIndex.push(sectionEntry);

                section.items.forEach((item) => {
                    const questions = questionBank[item.numericalKey] || [];
                    const itemSearchPieces = [chapterTitle, section.rawTitle, item.label];
                    questions.forEach((q) => {
                        if (q.searchContent) itemSearchPieces.push(q.searchContent);
                    });
                    const entry = {
                        type: 'item',
                        chapterNum: chapter.number,
                        chapterTitle,
                        sectionTitle: section.rawTitle,
                        itemTitle: item.label,
                        questionCount: questions.length,
                        searchText: itemSearchPieces.join(' ').toLowerCase(),
                        sectionIndex: section.sectionIndex,
                        itemIndex: item.itemIndex,
                        sectionNumber: section.numericalKey,
                        numericalKey: item.numericalKey,
                        nodeId: nodeId || null
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
            $searchSummary.textContent = getDefaultSearchSummary();
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

        let nodeId = entry.nodeId || null;
        if (!nodeId && entry.sectionNumber) {
            nodeId = findNodeIdForSection(entry.chapterNum, entry.sectionNumber) || null;
        }
        if (!nodeId) {
            nodeId = entry.chapterNum;
        }
        const node = getNodeById(nodeId);

        openChapters.add(nodeId);
        state.activeChapter = nodeId;
        state.activeYear = 'all';
        state.showChapterQuestions = false;

        if (Number.isInteger(entry.sectionIndex)) {
            state.activeSectionIndex = entry.sectionIndex;
            ensureSectionOpenState(entry.chapterNum).add(entry.sectionIndex);
        } else if (node && node.type === 'section') {
            state.activeSectionIndex = node.sectionIndex;
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
                scrollToDetailSection(nodeId, entry.sectionIndex);
            } else {
                scrollToNodeDetail(nodeId);
            }
        });
    }

    function handleMatrixClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const labelButton = target.closest('button.matrix-row-toggle');
        if (labelButton) {
            const nodeId = labelButton.dataset.node;
            if (nodeId) {
                void handleNodeLabelClick(nodeId, { scrollToDetail: true });
            }
            return;
        }

        const button = target.closest('button.matrix-button');
        if (button) {
            const nodeId = button.dataset.node;
            const yearKey = button.dataset.year || 'all';
            if (nodeId) {
                void handleNodeYearSelection(nodeId, yearKey, { scrollToDetail: true });
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

    if ($subjectSwitcher) {
        $subjectSwitcher.addEventListener('click', (event) => {
            const target = event.target instanceof HTMLElement
                ? event.target.closest('[data-subject]')
                : null;
            if (!target) return;
            const subjectId = target.getAttribute('data-subject');
            if (subjectId && subjectId !== state.subjectId) {
                void activateSubject(subjectId);
            }
        });
    }

    resetSearchUI();

    Promise.all([ensureQuestionBanksLoaded(), ensureKeyMappingsLoaded()]).then(async ([questionPayload]) => {
        if (!questionPayload) {
            if ($matrixSummary) {
                $matrixSummary.textContent = '문제 데이터를 불러오지 못했습니다. question_bank.json 경로를 확인해주세요.';
            }
            return;
        }

        await activateSubject(DEFAULT_SUBJECT_ID);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard, { once: true });
} else {
    initDashboard();
}
