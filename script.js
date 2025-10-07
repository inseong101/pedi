document.addEventListener('DOMContentLoaded', () => {
    const BASE = './chapter/';
    const CHAPTERS = [
        "1장 서론.md", "2장 소아의 진단.md", "3장 성장과 발달.md",
        "4장 유전.md", "5장 소아의 영양.md", "6장 소아 양생(小兒 養生).md",
        "7장 소아 치료법.md", "8장 신생아 미ᆆ 초생병.md", "9장 감염병.md",
        "10장 호흡기계의 병증 및 질환.md", "11장 소화기계의 병증 및 질환.md",
        "12장 신경계의 병증 및 질환.md", "13장 소아청소년기 정신장애.md",
        "14장 심혈관계.md", "15장 간담계의 병즌 및 질환.md",
        "16장 비뇨생식기계의 병증 및 질환.md", "17장 알레르기 질환.md",
        "18장 면역질환.md", "19장 근·골격계 질환.md", "20장 내분비질환.md",
        "21장 종양.md", "22장 피부질환.md", "23장 안질환.md",
        "24장 증후.md", "25장 급증(손상).md", "26장 소아의료윤리.md"
    ];

    const parsedCache = new Map();
    let questionBank = {};

    function normalizeText(text) {
        if (!text) return "";
        let normalized = text.replace(/\([^)]*\)/g, '').trim();
        return normalized.replace(/\s+/g, ' ');
    }
    
    async function loadData() {
        try {
            const qBankRes = await fetch('question_bank.json');
            if (!qBankRes.ok) {
                console.error("Failed to load question data (question_bank.json). Check file path/network.");
                return false;
            }
            questionBank = await qBankRes.json();
            return true;
        } catch (e) {
            console.error("Error during data fetching:", e);
            return false;
        }
    }

    // 🚨 핵심 수정: 연도별 개수를 계산하고 디자인을 위한 HTML 구조를 반환
    function getYearlyBreakdown(questions) {
        if (!questions || questions.length === 0) return { html: `<span class="yearly-breakdown"><span class="total-count-label">(0 문제)</span></span>`, count: 0 };
        
        const counts = {};
        let total = 0;
        
        questions.forEach(q => {
            const year = q.id.split('-')[0];
            counts[year] = (counts[year] || 0) + 1;
            total++;
        });

        const years = ["2021", "2022", "2023", "2024", "2025"];
        const yearChips = [];
        
        years.forEach(year => {
            const count = counts[year] || 0; // 0개라도 표시
            const cssClass = count === 0 ? 'year-chip zero-count' : 'year-chip';
            
            // 각 연도별 개수를 뱃지 구조로 변환
            yearChips.push(`<span class="${cssClass}" data-year="${year}">${year.slice(2)}:${count}</span>`);
        });

        const html = `
            <span class="yearly-breakdown">
                <span class="total-count-label">(${total} 문제)</span>
                <span class="year-chips">${yearChips.join('')}</span>
            </span>
        `;
        return { html, count: total };
    }
    
    // Chapter Total Count 계산
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
    
    // Global Total Count 계산
    function getGlobalTotalBreakdown(questionBank) {
        let allQuestions = [];
        for (const key in questionBank) {
            allQuestions = allQuestions.concat(questionBank[key]);
        }
        return getYearlyBreakdown(allQuestions);
    }


    // 마크다운 파서 (이전과 동일)
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
                    const itemClean = itemRaw.replace(/^\d+\.\s*/, '').trim();
                    current.items.push(itemClean);
                }
            }
        }
        if (current) sections.push(current);
        return { sections };
    }

    // 문제 표시 DOM 생성 (이전과 동일)
    function renderQuestions(questions, $target) {
        if (questions.length === 0) {
             $target.innerHTML = `<div class="item-empty no-question">⚠️ 이 Section에 연결된 2021~2025년 기출 문제가 없습니다.</div>`;
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

            $toggle.addEventListener('click', () => {
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
    
    // 장 블록 DOM 생성
    function makeChapterRow(file) {
        const title = `제${file.replace(/\.md$/, '')}`;
        const li = document.createElement('li');
        
        const chapMatch = file.match(/^(\d+)/);
        const chapterNum = chapMatch ? chapMatch[1] : '0';
        
        // Chapter 전체 문제 수 계산 및 HTML 생성
        const chapterBreakdown = getChapterTotalBreakdown(chapterNum, questionBank);


        li.className = 'chapter';
        li.innerHTML = `
          <div class="chapter-line" role="button" aria-expanded="false">
            ${title} 
            <span class="q-total-badge">
                ${chapterBreakdown.html}
            </span>
          </div>
          <div class="sections"></div>
        `;

        const $line = li.querySelector('.chapter-line');
        const $sections = li.querySelector('.sections');

        $line.addEventListener('click', async () => {
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
                    $sections.innerHTML = `<div class="item-empty">⚠️ 파일 로드 실패.</div>`;
                    $sections.classList.add('visible');
                    $line.setAttribute('aria-expanded', 'true');
                    return;
                }
            }

            // 섹션 렌더 및 문제 연결 로직
            if ($sections.childElementCount === 0) {
                const { sections } = parsedCache.get(file) || { sections: [] };

                if (!sections.length) {
                    $sections.innerHTML = `<div class="item-empty">내용 없음</div>`;
                } else {
                    sections.forEach((sec) => {
                        const secWrap = document.createElement('div');
                        secWrap.className = 'section';
                        
                        // Section별 문제 개수 계산 및 HTML 생성
                        const numericalKey = `${chapterNum} | ${sec.numericalKey}`;
                        const sectionQuestions = questionBank[numericalKey] || [];
                        const sectionBreakdown = getYearlyBreakdown(sectionQuestions);
                        
                        secWrap.innerHTML = `
                          <div class="section-line" role="button" aria-expanded="false">
                            ${sec.rawTitle} 
                            <span class="q-count-badge">
                                ${sectionBreakdown.html}
                            </span>
                          </div>
                          <ul class="items"></ul>
                          <div class="questions-output"></div>
                        `;

                        const $secLine = secWrap.querySelector('.section-line');
                        const $items = secWrap.querySelector('.items');
                        const $questionsContainer = secWrap.querySelector('.questions-output');

                        // 절 토글
                        $secLine.addEventListener('click', () => {
                            const secOpen = $secLine.getAttribute('aria-expanded') === 'true';
                            if (secOpen) {
                                $items.classList.remove('visible');
                                $questionsContainer.style.display = 'none';
                                $secLine.setAttribute('aria-expanded', 'false');
                            } else {
                                // 1. 하위 항목 DOM 구성 (Items)
                                if ($items.childElementCount === 0) {
                                    if (sec.items.length === 0) {
                                        const spacer = document.createElement('div');
                                        spacer.className = 'item-spacer';
                                        $items.appendChild(spacer);
                                    } else {
                                        sec.items.forEach((txt) => {
                                            const itemLi = document.createElement('li');
                                            itemLi.className = 'item';
                                            itemLi.textContent = txt;
                                            itemLi.style.cursor = 'default';
                                            $items.appendChild(itemLi);
                                        });
                                    }
                                }
                                
                                // 2. 문제 데이터 로드 및 렌더링
                                if (questionBank[numericalKey]) {
                                    const questions = questionBank[numericalKey];
                                    $questionsContainer.innerHTML = ''; 
                                    renderQuestions(questions, $questionsContainer);
                                    $questionsContainer.style.display = 'block';
                                } else {
                                    $questionsContainer.innerHTML = `<div class="item-empty no-question">⚠️ 이 목차 (${numericalKey})에 매칭되는 문제가 없습니다.</div>`;
                                    $questionsContainer.style.display = 'block';
                                }

                                $items.classList.add('visible');
                                $secLine.setAttribute('aria-expanded', 'true');
                            }
                        });

                        $sections.appendChild(secWrap);
                    });
                }
            }

            $sections.classList.add('visible');
            $line.setAttribute('aria-expanded', 'true');
        });

        return li;
    }

    // 메인 실행: 데이터 로드 후 목차 생성
    loadData().then(success => {
        const $list = document.getElementById('list');
        const $globalTitle = document.getElementById('global-toc-title');
        
        if (success) {
            // Global Total 계산 및 표시
            const globalBreakdown = getGlobalTotalBreakdown(questionBank);
            if ($globalTitle) {
                 $globalTitle.innerHTML = `소아과학 목차 <span class="q-global-badge">${globalBreakdown.html}</span>`;
            }

            CHAPTERS.forEach((file) => {
                $list.appendChild(makeChapterRow(file));
            });
        } else {
            $list.innerHTML = '<li class="item-empty">문제 데이터 로드에 실패했습니다. (question_bank.json이 올바른 경로에 있는지 확인해주세요.)</li>';
        }
    });
});
