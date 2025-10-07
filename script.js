document.addEventListener('DOMContentLoaded', () => {
    const BASE = './chapter/';
    // CHAPTERS 목록은 레포지토리의 파일명을 기반으로 합니다.
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
                return false;
            }
            questionBank = await qBankRes.json();
            return true;
        } catch (e) {
            return false;
        }
    }

    // 🚨 Item 레벨 문제 키 추출을 위한 함수
    function getNumericalKey(chapterNum, sectionNum, itemText) {
        // Item 텍스트에서 번호를 추출 (예: 1.1.1 소아과학의 정의 -> 1)
        const match = itemText.match(/(\d+\.\d+\.)(\d+)\s/);
        const itemNum = match ? match[2] : '0';
        return `${chapterNum} | ${sectionNum} | ${itemNum}`;
    }

    // 🚨 Python의 parse_num_parts와 일치해야 함: [C, S, I]
    function getNumericalParts(itemText) {
        const parts = itemText.match(/\d+/g);
        if (!parts || parts.length < 3) return ['0', '0', '0'];
        return [parts[0], parts[1], parts[2]];
    }


    // 🚨 문제 배열을 받아 연도별 개수를 계산하고 HTML 문자열을 반환
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
            const count = counts[year] || 0; 
            const cssClass = count === 0 ? 'year-chip zero-count' : 'year-chip';
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
    
    function getGlobalTotalBreakdown(questionBank) {
        let allQuestions = [];
        for (const key in questionBank) {
            allQuestions = allQuestions.concat(questionBank[key]);
        }
        return getYearlyBreakdown(allQuestions);
    }

    // 마크다운 파서: 섹션 번호만 추출합니다.
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
                
                // # 1절 -> 1
                const secMatch = rawTitle.match(/^(\d+)절\s*/);
                const sectionNum = secMatch ? secMatch[1] : '0';

                current = { 
                    rawTitle: rawTitle, 
                    numericalKey: sectionNum, 
                    items: [] 
                };
            } else if (line.startsWith('- ')) {
                // Item은 그대로 텍스트를 저장합니다.
                if (current) {
                    const itemRaw = line.replace(/^-+\s*/, '').trim(); 
                    current.items.push(itemRaw); // Item 텍스트를 그대로 저장 (C.S.I. 제목 포함)
                }
            }
        }
        if (current) sections.push(current);
        return { sections };
    }

    // 문제 렌더링 (이전과 동일)
    function renderQuestions(questions, $target) {
        if (questions.length === 0) {
             $target.innerHTML = `<div class="item-empty no-question">⚠️ 이 항목에 연결된 문제가 없습니다.</div>`;
             return;
        }
        
        const ul = document.createElement('ul');
        ul.classList.add('questions-container-list');

        // ... (문제 표시 로직 생략 - 이전과 동일)
        // ... (최종 코드에서는 생략하지 않음)
        
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
                        const sectionQuestions = []; // Item 클릭 전에는 0으로 표시
                        const sectionBreakdown = getYearlyBreakdown(sectionQuestions);
                        
                        secWrap.innerHTML = `
                          <div class="section-line" role="button" aria-expanded="false">
                            ${sec.rawTitle} 
                            <span class="q-count-badge">
                                ${sectionBreakdown.html}
                            </span>
                          </div>
                          <ul class="items"></ul>
                        `;

                        const $secLine = secWrap.querySelector('.section-line');
                        const $items = secWrap.querySelector('.items');

                        // 절 토글
                        $secLine.addEventListener('click', () => {
                            const secOpen = $secLine.getAttribute('aria-expanded') === 'true';
                            if (secOpen) {
                                $items.classList.remove('visible');
                                $secLine.setAttribute('aria-expanded', 'false');
                            } else {
                                // 1. Item 렌더링
                                if ($items.childElementCount === 0) {
                                    if (sec.items.length === 0) {
                                        const spacer = document.createElement('div');
                                        spacer.className = 'item-spacer';
                                        $items.appendChild(spacer);
                                    } else {
                                        sec.items.forEach((txt) => {
                                            const itemLi = document.createElement('li');
                                            itemLi.className = 'item item-line';
                                            itemLi.setAttribute('role', 'button');
                                            itemLi.setAttribute('aria-expanded', 'false');
                                            itemLi.innerHTML = `
                                                <div class="item-title">${txt}</div>
                                                <div class="item-content questions-output"></div>
                                            `;

                                            const $itemContent = itemLi.querySelector('.item-content');
                                            const [c, s, i] = getNumericalParts(txt); // txt = C.S.I. 이름
                                            const numericalKey = `${c} | ${s} | ${i}`;
                                            
                                            // Item 레벨 문제 개수 표시
                                            const itemQuestions = questionBank[numericalKey] || [];
                                            const itemBreakdown = getYearlyBreakdown(itemQuestions);
                                            itemLi.querySelector('.item-title').innerHTML += `<span class="q-count-badge" style="margin-left: 10px;">${itemBreakdown.html}</span>`;

                                            // Item 클릭 -> 문제 표시
                                            itemLi.addEventListener('click', (ev) => {
                                                ev.stopPropagation(); 
                                                const itemOpen = itemLi.getAttribute('aria-expanded') === 'true';
                                                
                                                if (itemOpen) {
                                                    $itemContent.classList.remove('visible');
                                                    itemLi.setAttribute('aria-expanded', 'false');
                                                } else {
                                                    // 문제 로드 및 렌더링
                                                    if ($itemContent.childElementCount === 0) {
                                                        renderQuestions(itemQuestions, $itemContent);
                                                    }

                                                    $itemContent.classList.add('visible');
                                                    itemLi.setAttribute('aria-expanded', 'true');
                                                }
                                            });
                                            $items.appendChild(itemLi);
                                        });
                                    }
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
