// js/main.js

// [MODIFIED] 두 파일에서 접근해야 하므로 전역 범위에 선언
let allCasesData = []; 
// [NEW] JSON 데이터를 저장할 전역 변수
let sidebarData = null;

// --- [NEW] 북마크 헬퍼 함수 ---
// (이 섹션은 변경 사항 없음)

/**
 * 북마크 상태를 토글(추가/삭제)합니다.
 * @param {string} caseId - 케이스 ID (예: "case-1-1")
 */
function toggleBookmark(caseId) {
// ... (이하 북마크 관련 함수들 - 변경 없음) ...
    if (!caseId) return;
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const index = bookmarks.indexOf(caseId);
    if (index > -1) {
        bookmarks.splice(index, 1); // 이미 있으면 제거
    } else {
        bookmarks.push(caseId); // 없으면 추가
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarkSidebar();
}

/**
 * 특정 케이스가 북마크되었는지 확인합니다.
 * @param {string} caseId - 케이스 ID
 * @returns {boolean}
 */
function isBookmarked(caseId) {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    return bookmarks.includes(caseId);
}

/**
 * 북마크 버튼의 UI를 업데이트합니다.
 * @param {HTMLElement} button - 북마크 버튼 엘리먼트
 * @param {string} caseId - 케이스 ID
 */
function updateBookmarkButtonUI(button, caseId) {
    if (!button) return;
    if (isBookmarked(caseId)) {
        button.classList.add('active');
        button.querySelector('i').classList.replace('far', 'fas');
        const textElement = button.querySelector('.bookmark-text');
        if (textElement) textElement.textContent = "북마크됨";
    } else {
        button.classList.remove('active');
        button.querySelector('i').classList.replace('fas', 'far');
        const textElement = button.querySelector('.bookmark-text');
        if (textElement) textElement.textContent = "북마크";
    }
}

// --- [NEW] 북마크 사이드바 빌더 함수 ---
// (이 섹션은 변경 사항 없음)

/**
 * [MODIFIED] 북마크 사이드바 섹션의 HTML을 생성하고 반환합니다.
 */
function buildBookmarkSidebarSection() {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const submenuId = "submenu-bookmarks";
    
    // [MODIFIED] HTML은 항상 닫힌 상태로 생성 (updateBookmarkSidebar에서 상태 복원)
    let html = `
        <li class="app-sidebar-main-category" id="bookmark-main-category">
            <div class="sidebar-main-category-header collapsed" 
                 data-bs-toggle="collapse" 
                 data-bs-target="#${submenuId}" 
                 aria-expanded="false">
                <div class="d-flex"><i class="fas fa-user-tag"></i><span class="menu-text">내 활동</span></div>
                <i class="fas fa-chevron-down toggle-icon chevron-icon"></i>
            </div>
            <ul class="sidebar-submenu collapse" id="${submenuId}">
    `;

    if (bookmarks.length === 0) {
        html += `
            <li class="app-sidebar-item">
                <span class="app-sidebar-link" style="padding-left: 40px; color: #888; font-style: italic; cursor: default;">
                    <span class="menu-text">북마크가 없습니다.</span>
                </span>
            </li>
        `;
    } else {
        bookmarks.forEach(caseId => {
            const caseItem = allCasesData.find(c => c.id === caseId);
            if (caseItem) {
                html += `
                    <li class="app-sidebar-item">
                        <a href="#${caseItem.id}" class="app-sidebar-link case-link" data-src="${caseItem.src}">
                            <span class="menu-text">${caseItem.title}</span>
                        </a>
                    </li>
                `;
            }
        });
    }

    html += `</ul></li>`;
    return html;
}

/**
 * [MODIFIED] 사이드바의 북마크 섹션을 (다시) 그립니다.
 */
function updateBookmarkSidebar() {
    const sidebarMenuList = document.getElementById('sidebar-menu-list');
    if (!sidebarMenuList) return;

    // [NEW] 기존 북마크 메뉴의 열림/닫힘 상태 저장
    const existingSubmenu = document.getElementById('submenu-bookmarks');
    const wasExpanded = existingSubmenu ? existingSubmenu.classList.contains('show') : false;

    const existingHeader = document.getElementById('bookmark-main-category');
    if (existingHeader) existingHeader.remove();

    if (allCasesData.length === 0 && (JSON.parse(localStorage.getItem('bookmarks')) || []).length > 0) {
        if(sidebarData) {
             console.warn("북마크를 그리려 했으나 allCasesData가 아직 준비되지 않았습니다. (데이터 로딩 중)");
        }
        return;
    }
    
    const bookmarkHTML = buildBookmarkSidebarSection();

    const spacer = sidebarMenuList.querySelector('.app-sidebar-main-category-spacer');
    if (spacer) {
         spacer.insertAdjacentHTML('beforebegin', bookmarkHTML);
    } else {
         sidebarMenuList.insertAdjacentHTML('beforeend', bookmarkHTML);
    }

    // [MODIFIED] collapse 인스턴스 생성 및 상태 복원
    const newCollapseElement = document.getElementById('submenu-bookmarks');
    if (newCollapseElement) {
        const collapseInstance = new bootstrap.Collapse(newCollapseElement, {
            toggle: false // 자동 토글 방지
        });
        
        // [NEW] 이전 상태가 열림이었다면 다시 열기
        if (wasExpanded) {
            collapseInstance.show();
        }
    }
}


// --- (기존 함수들) ---


/**
 * [MODIFIED] 콘텐츠를 로드하고 화면에 표시하는 함수 (clickedElement 파라미터 추가)
 * (변경 사항 없음)
 */
async function loadContent(srcUrl, targetHash, isSearchResult = false, clickedElement = null) {
    const contentLoader = document.getElementById('content-loader');
    if (!srcUrl || !contentLoader) return; 

    try {
        let response = await fetch(srcUrl);
        let html = '';

        if (!response.ok) {
            console.warn(`Relative path fetch failed for ${srcUrl}. Trying root path.`);
            const rootSrcUrl = srcUrl.startsWith('/') ? srcUrl : '/' + srcUrl;
            response = await fetch(rootSrcUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${srcUrl} or ${rootSrcUrl}`);
            }
            html = await response.text();
        } else {
            html = await response.text();
        }

        contentLoader.innerHTML = html; 

        // --- 북마크 버튼 동적 삽입 로직 [MODIFIED] ---
        const currentCaseId = targetHash.replace('#', '');
        if (currentCaseId && currentCaseId !== 'case-home') {
            const cardH2 = contentLoader.querySelector('.case-card h2');
            if (cardH2) {
                const h2Styles = window.getComputedStyle(cardH2);
                const bookmarkBtnHTML = `
                    <button class="btn btn-outline-warning btn-bookmark ms-3 flex-shrink-0" data-case-id="${currentCaseId}">
                        <i class="far fa-star"></i> 
                        <span class="bookmark-text d-none d-sm-inline">북마크</span>
                    </button>
                `;
                const wrapper = document.createElement('div');
                wrapper.className = 'd-flex justify-content-between align-items-center';
                wrapper.style.borderBottom = h2Styles.borderBottom;
                wrapper.style.paddingBottom = h2Styles.paddingBottom;
                wrapper.style.marginBottom = h2Styles.marginBottom;
                cardH2.style.borderBottom = 'none';
                cardH2.style.paddingBottom = '0';
                cardH2.style.marginBottom = '0';
                cardH2.parentNode.replaceChild(wrapper, cardH2);
                wrapper.appendChild(cardH2);
                wrapper.insertAdjacentHTML('beforeend', bookmarkBtnHTML);
            }
        }
        
        // --- 북마크 UI 업데이트 로직 (변경 없음) ---
        const bookmarkBtn = contentLoader.querySelector(`.btn-bookmark[data-case-id="${currentCaseId}"]`);
        if (bookmarkBtn) {
            updateBookmarkButtonUI(bookmarkBtn, currentCaseId);
        }

        // --- 페이지 제목 업데이트 (변경 없음) ---
        const pageTitleH2 = document.querySelector('#pageTitleArea h2');
        const pageTitleP = document.querySelector('#pageTitleArea p');
        updatePageTitle(contentLoader, targetHash, pageTitleH2, pageTitleP); 

        // --- [MODIFIED] updateActiveLink 호출 시 clickedElement 전달 ---
        if (!isSearchResult) {
            updateActiveLink(targetHash, clickedElement); // clickedElement 전달
        } else {
            // 검색 결과에서 클릭 시, 모든 사이드바 링크 비활성화
            document.querySelectorAll('.app-sidebar-link.case-link, .sidebar-sub-category-header, .sidebar-mid-category-header').forEach(link => {
                link.classList.remove('active');
                if(link.hasAttribute('data-bs-toggle')) {
                    link.setAttribute('aria-expanded', 'false');
                    link.classList.add('collapsed');
                }
            });
            // 모든 콜랩스 메뉴 접기 (북마크 메뉴 제외)
            document.querySelectorAll('.sidebar-submenu.show, .sidebar-case-list.show').forEach(element => {
                if (element.id !== 'submenu-bookmarks') {
                    const collapseInstance = bootstrap.Collapse.getInstance(element);
                    if (collapseInstance) {
                        collapseInstance.hide();
                    }
                }
            });
        }

        window.scrollTo(0, 0); 

        // 홈 화면 로드 시 검색 이벤트 리스너 부착
        if ((targetHash === '#case-home' || contentLoader.querySelector('#case-home')) && typeof attachSearchEventListeners === 'function') {
            attachSearchEventListeners();
             if (!isSearchResult && typeof renderSearchResults === 'function') {
                renderSearchResults([], ''); // 검색 결과 영역 초기화
            }
        }

    } catch (error) {
        console.error('Failed to load content:', error);
        contentLoader.innerHTML = `<div class="alert alert-danger">콘텐츠를 불러오는 데 실패했습니다. (${srcUrl}). 경로와 서버 상태를 확인해주세요.</div>`;
    }
}

/**
 * [MOVED & MODIFIED] 페이지 제목 영역 업데이트 함수 (전역 함수로 변경)
 * (변경 사항 없음)
 */
function updatePageTitle(contentLoader, targetHash, pageTitleH2, pageTitleP) {
    if (!pageTitleH2 || !pageTitleP) return; 

    if (targetHash === '#case-home' || contentLoader.querySelector('#case-home')) {
        pageTitleH2.textContent = "NE능률 AI 업무 활용 사례집";
        pageTitleP.textContent = "NE능률 사내 AI 업무 활용 사례를 공유하고 확산하는 플랫폼입니다.";
    } else {
        const cardElement = contentLoader.querySelector('.case-card'); 
        const cardTitle = cardElement?.querySelector('h2')?.innerText || "사례 상세";
        // [FIX] .lead .badge:last-of-type 대신 .card-header .badge (혹은 더 구체적인 선택자) 사용 고려
        // 여기서는 .case-card .badge 중 첫 번째 배지를 카테고리로 간주
        const cardBadge = cardElement?.querySelector('.badge')?.innerText || "AI 활용";
        pageTitleH2.textContent = cardBadge + " 사례";
        pageTitleP.textContent = "";
    }
}

/**
 * [MODIFIED] 사이드바 링크 활성 상태 업데이트 (clickedElement 파라미터 추가)
 * (변경 사항 없음)
 */
function updateActiveLink(targetHash, clickedElement = null) {
    // 1. 모든 링크 비활성화
    document.querySelectorAll('.app-sidebar-link.case-link').forEach(link => {
        link.classList.remove('active');
    });

    // 2. [REMOVED] 모든 콜랩스 메뉴 접기 로직 제거
    // 사용자가 수동으로 열어둔 메뉴는 그대로 유지

    // 3. [MODIFIED] 타겟 링크 활성화
    let targetLink = null;
    if (clickedElement) {
        // 3-1. 클릭된 요소가 있으면, 그것을 targetLink로 사용
        targetLink = clickedElement;
    } else if (targetHash && targetHash !== '#case-home') {
        // 3-2. 클릭된 요소가 없으면 (e.g., 페이지 새로고침), querySelector로 첫 번째 링크를 찾음
        targetLink = document.querySelector(`a.case-link[href="${targetHash}"]`);
    } else {
        // 3-3. targetHash가 없거나 홈이면
        return; // 활성화할 링크 없음 (홈은 아무것도 활성화 안 됨)
    }

    if (!targetLink) return;
    targetLink.classList.add('active');

    // 4. 부모 펼치기 로직 (기존과 동일)
    // 4-1. 북마크 링크인 경우
    const bookmarkList = targetLink.closest('#submenu-bookmarks');
    if (bookmarkList) {
        const collapseInstance = bootstrap.Collapse.getOrCreateInstance(bookmarkList);
        if (collapseInstance) {
            collapseInstance.show();
        }
        const header = bookmarkList.previousElementSibling;
        if (header && header.hasAttribute('data-bs-toggle')) {
            header.setAttribute('aria-expanded', 'true');
            header.classList.remove('collapsed');
        }
        return; 
    }

    // 4-2. 일반 링크인 경우
    let currentElement = targetLink;
    while (currentElement && currentElement.classList) { 
        const collapsibleParent = currentElement.closest('.collapse');
         if (collapsibleParent) {
            const collapseInstance = bootstrap.Collapse.getOrCreateInstance(collapsibleParent);
            if (collapseInstance) {
                collapseInstance.show();
            }
            const header = collapsibleParent.previousElementSibling;
             if (header && header.hasAttribute('data-bs-toggle')) {
                header.setAttribute('aria-expanded', 'true');
                header.classList.remove('collapsed');
                // [FIX] 헤더(e.g., sub-category-header) 자체도 active 표시가 필요할 수 있음
                // 현재 로직은 case-link만 active 표시함.
                // 기획에 따라 header.classList.add('active'); 가 필요할 수 있음.
            }
            currentElement = header; 
        } else {
            // .collapse를 못 찾으면 부모로 탐색 중단
            currentElement = null; 
        }
    }
}


// --- [MODIFIED] 사이드바 HTML 생성 함수 ---
// 새로운 구조: 대분류 > 사례 (중분류/소분류 제거)
function buildSidebarHTML(mainCategories) {
    let html = '';

    mainCategories.forEach(mainCat => {
        if (mainCat.type === 'main-category') {
            // 대분류를 접을 수 있는 헤더로 변경
            const submenuId = `submenu-${mainCat.id}`;
            
            html += `
                <li class="app-sidebar-main-category">
                    <div class="sidebar-main-category-header collapsed" data-bs-toggle="collapse" data-bs-target="#${submenuId}" aria-expanded="false">
                        <div class="d-flex"><i class="${mainCat.icon}"></i><span class="menu-text">${mainCat.name}</span></div>
                        <i class="fas fa-chevron-down toggle-icon chevron-icon"></i>
                    </div>
                    <ul class="sidebar-submenu collapse" id="${submenuId}">
            `;

            // cases 배열을 직접 처리
            if (mainCat.cases && mainCat.cases.length > 0) {
                mainCat.cases.forEach(caseItem => {
                    html += `
                        <li class="app-sidebar-item">
                            <a href="#${caseItem.id}" class="app-sidebar-link case-link" data-src="${caseItem.src}">
                                <span class="menu-text">${caseItem.title}</span>
                            </a>
                        </li>
                    `;
                });
            } else {
                // 사례가 없는 경우
                html += `
                    <li class="app-sidebar-item">
                        <span class="app-sidebar-link" style="padding-left: 40px; color: #888; font-style: italic; cursor: default;">
                            <span class="menu-text">준비 중입니다.</span>
                        </span>
                    </li>
                `;
            }
            
            html += `</ul></li>`;
            
        } else if (mainCat.type === 'main-category-spacer') {
             html += `<li class="app-sidebar-main-category-spacer" style="height: 20px; border-bottom: 1px solid #eee; margin: 10px 0;"></li>`;
        }
    });
    
    return html;
}


// --- DOMContentLoaded 이벤트 리스너 시작 ---
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const logoLink = document.querySelector('.app-logo');
    const sidebarMenuList = document.getElementById('sidebar-menu-list');
    const contentLoader = document.getElementById('content-loader');

    // --- 모바일 사이드바 토글 (변경 없음) ---
    if (sidebarToggleMobile && sidebar) {
        sidebarToggleMobile.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }
    // 창 크기 변경 시 모바일 사이드바 닫기
    window.addEventListener('resize', function () {
        if (window.innerWidth > 991 && sidebar?.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    /**
     * [MODIFIED] 기본 콘텐츠(홈) 표시 함수 (loadContent 호출 시 null 전달)
     */
    function showDefaultContent() {
        updateActiveLink('#case-home', null); // 홈을 명시적으로 비활성화
        if (logoLink && logoLink.dataset.src && logoLink.getAttribute('href')) {
            loadContent(logoLink.dataset.src, logoLink.getAttribute('href'), false, null); // null 전달
        } else {
            console.warn("Logo link missing data-src or href, loading default home.");
            loadContent('cases/case-home.html', '#case-home', false, null); // null 전달
        }
    }

    // --- 북마크 클릭 이벤트 리스너 (변경 없음) ---
    if (contentLoader) {
        contentLoader.addEventListener('click', function(event) {
            const bookmarkBtn = event.target.closest('.btn-bookmark');
            if (bookmarkBtn) {
                event.preventDefault();
                const caseId = bookmarkBtn.dataset.caseId;
                toggleBookmark(caseId);
                updateBookmarkButtonUI(bookmarkBtn, caseId);
            }
        });
    }


    // --- [MODIFIED] 사이드바 메뉴 클릭 이벤트 리스너 ---
    if (sidebarMenuList) {
        sidebarMenuList.addEventListener('click', function(event) {
            // [MODIFIED] 클릭된 링크 요소를 변수에 저장
            const targetLink = event.target.closest('a.case-link');

            if (targetLink && !targetLink.classList.contains('disabled')) {
                event.preventDefault();
                event.stopPropagation(); // [NEW] 이벤트 버블링 중단
                
                const srcUrl = targetLink.dataset.src;
                const targetHash = targetLink.getAttribute('href');

                // [MODIFIED] loadContent에 targetLink 자체를 전달
                loadContent(srcUrl, targetHash, false, targetLink); 

                if (window.innerWidth <= 991 && sidebar?.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // 2. 로고 클릭 시 (홈으로) - [MODIFIED] 모든 사이드바 메뉴 접기 기능 추가
    if (logoLink) {
        logoLink.addEventListener('click', function (event) {
            event.preventDefault();
            
            // [NEW] 모든 사이드바 메뉴 접기
            const allSubmenus = document.querySelectorAll('.sidebar-submenu.show');
            allSubmenus.forEach(submenu => {
                const collapseInstance = bootstrap.Collapse.getInstance(submenu);
                if (collapseInstance) {
                    collapseInstance.hide();
                } else {
                    // collapse 인스턴스가 없는 경우 직접 생성하여 닫기
                    new bootstrap.Collapse(submenu, { toggle: true });
                }
            });
            
            showDefaultContent(); 
        });
    }

    // --- [MODIFIED] 초기 실행 함수 ---
    async function initializeApp() {
        // [NEW] 검색창 (홈 화면에 있음) 요소를 미리 찾아둡니다.
        // 홈이 로드되기 전이라도 DOM에는 존재해야 합니다. (index.html에)
        const searchInput = document.getElementById('caseSearchInput');
        const searchButton = document.getElementById('caseSearchButton');

        try {
            const response = await fetch('cases.json'); 
            if (!response.ok) {
                throw new Error(`Failed to fetch cases.json: ${response.statusText}`);
            }
            const data = await response.json();
            sidebarData = data.mainCategories; // 전역 변수에 저장

            // 사이드바 HTML 생성
            const sidebarHTML = buildSidebarHTML(sidebarData);
            if (sidebarMenuList) {
                sidebarMenuList.innerHTML = sidebarHTML;
            }

            // [MODIFIED] 검색 인덱스 생성 (await 추가)
            if (typeof buildSearchDataFromJSON === 'function') {
                
                // [NEW] 인덱싱 시작 전 검색창 비활성화
                if (searchInput) {
                    searchInput.placeholder = "검색 인덱싱 준비 중...";
                    searchInput.disabled = true;
                }
                if (searchButton) {
                    searchButton.disabled = true;
                }
                
                // [MODIFIED] 비동기 함수가 완료될 때까지 기다림
                await buildSearchDataFromJSON(sidebarData); 
                
                // [NEW] 인덱싱 완료 후 검색창 활성화
                if (searchInput) {
                    searchInput.placeholder = "사례 검색...";
                    searchInput.disabled = false;
                }
                if (searchButton) {
                    searchButton.disabled = false;
                }
                console.log("검색창이 활성화되었습니다.");

            } else {
                console.error("buildSearchDataFromJSON function not found in search.js.");
            }

            // 북마크 사이드바 업데이트 (allCasesData가 채워진 후)
            updateBookmarkSidebar();

            // 기본 콘텐츠(홈) 표시
            showDefaultContent();

        } catch (error) {
            console.error("앱 초기화 실패:", error);
            if (sidebarMenuList) {
                sidebarMenuList.innerHTML = `<li class="p-3 text-danger">메뉴를 불러오는 데 실패했습니다. cases.json 파일을 확인해주세요.</li>`;
            }
            // [NEW] 에러 발생 시 검색창 비활성화 상태 유지 (메시지 변경)
            if (searchInput) {
                searchInput.placeholder = "검색 기능 로드 실패";
                searchInput.disabled = true;
            }
            if (searchButton) {
                searchButton.disabled = true;
            }
        }
    }

    initializeApp(); // 앱 초기화 함수 실행

}); // --- DOMContentLoaded 이벤트 리스너 끝 ---
