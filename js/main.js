// ========================================
// 전역 변수
// ========================================
let portfolioData = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // portfolio.json 로드
        const response = await fetch('portfolio.json');
        portfolioData = await response.json();
        
        // 사이드바 메뉴 생성
        buildSidebar(portfolioData);
        
        // URL 해시가 있으면 해당 페이지 로드, 없으면 홈 로드
        const hash = window.location.hash.substring(1);
        if (hash) {
            loadCaseByHash(hash);
        } else {
            loadCase('portfolio/home.html', 'home');
        }
        
        // 모바일 사이드바 토글
        initMobileSidebar();
        
    } catch (error) {
        console.error('초기화 오류:', error);
        document.getElementById('sidebar-menu-list').innerHTML = 
            '<li class="p-3 text-center text-danger">메뉴 로드 실패</li>';
    }
});

// ========================================
// 사이드바 메뉴 생성
// ========================================
function buildSidebar(data) {
    const menuList = document.getElementById('sidebar-menu-list');
    menuList.innerHTML = '';
    
    data.mainCategories.forEach(category => {
        if (category.type === 'main-category-spacer') {
            // 여백 추가
            const spacer = document.createElement('li');
            spacer.style.height = '20px';
            menuList.appendChild(spacer);
            return;
        }
        
        const li = document.createElement('li');
        
        // 메인 카테고리
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <i class="${category.icon}"></i>
            <span class="menu-text">${category.name}</span>
            ${category.cases || category.subcategories ? '<i class="fas fa-chevron-down toggle-icon"></i>' : ''}
        `;
        
        // 직접 링크가 있는 경우 (프로필, Skills 등)
        if (category.src) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                loadCase(category.src, category.id);
                setActiveMenu(menuItem);
            });
        }
        
        // 하위 메뉴가 있는 경우
        if (category.cases || category.subcategories) {
            const submenu = document.createElement('div');
            submenu.className = 'submenu';
            
            // cases가 있는 경우 (경력 상세)
            if (category.cases) {
                category.cases.forEach(caseItem => {
                    const submenuItem = document.createElement('div');
                    submenuItem.className = 'submenu-item';
                    submenuItem.textContent = caseItem.title;
                    submenuItem.dataset.id = caseItem.id;
                    
                    submenuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadCase(caseItem.src, caseItem.id);
                        setActiveSubmenu(submenuItem);
                    });
                    
                    submenu.appendChild(submenuItem);
                });
            }
            
            // subcategories가 있는 경우 (핵심 성과 사례 - 교육/조직문화)
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    const subcategoryDiv = document.createElement('div');
                    subcategoryDiv.className = 'submenu-category';
                    subcategoryDiv.innerHTML = `
                        <i class="${subcategory.icon}"></i>
                        ${subcategory.name}
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    `;
                    
                    const subcategoryItems = document.createElement('div');
                    subcategoryItems.className = 'subcategory-items';
                    
                    subcategory.cases.forEach(caseItem => {
                        const submenuItem = document.createElement('div');
                        submenuItem.className = 'submenu-item';
                        submenuItem.textContent = caseItem.title;
                        submenuItem.dataset.id = caseItem.id;
                        
                        submenuItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            loadCase(caseItem.src, caseItem.id);
                            setActiveSubmenu(submenuItem);
                        });
                        
                        subcategoryItems.appendChild(submenuItem);
                    });
                    
                    // 중분류 클릭 시 토글
                    subcategoryDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        subcategoryDiv.classList.toggle('open');
                        subcategoryItems.classList.toggle('open');
                    });
                    
                    submenu.appendChild(subcategoryDiv);
                    submenu.appendChild(subcategoryItems);
                });
            }
            
            // 메인 카테고리 클릭 시 토글
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                menuItem.classList.toggle('open');
                submenu.classList.toggle('open');
            });
            
            li.appendChild(menuItem);
            li.appendChild(submenu);
        } else {
            li.appendChild(menuItem);
        }
        
        menuList.appendChild(li);
    });
}

// ========================================
// 케이스 로드
// ========================================
async function loadCase(src, id) {
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('페이지 로드 실패');
        
        const html = await response.text();
        const contentLoader = document.getElementById('content-loader');
        contentLoader.innerHTML = html;
        
        // URL 해시 업데이트
        window.location.hash = id;
        
        // 모바일에서는 사이드바 닫기
        if (window.innerWidth < 992) {
            document.getElementById('sidebar').classList.remove('show');
        }
        
        // 스크롤 최상단으로
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('케이스 로드 오류:', error);
        document.getElementById('content-loader').innerHTML = 
            '<div class="alert alert-danger">페이지를 불러올 수 없습니다.</div>';
    }
}

// ========================================
// URL 해시로 케이스 로드
// ========================================
function loadCaseByHash(hash) {
    // portfolio.json에서 해당 id 찾기
    let found = false;
    
    portfolioData.mainCategories.forEach(category => {
        // 직접 src가 있는 경우
        if (category.id === hash && category.src) {
            loadCase(category.src, category.id);
            found = true;
            return;
        }
        
        // cases가 있는 경우
        if (category.cases) {
            const caseItem = category.cases.find(c => c.id === hash);
            if (caseItem) {
                loadCase(caseItem.src, caseItem.id);
                found = true;
                return;
            }
        }
        
        // subcategories가 있는 경우
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                const caseItem = subcategory.cases.find(c => c.id === hash);
                if (caseItem) {
                    loadCase(caseItem.src, caseItem.id);
                    found = true;
                    return;
                }
            });
        }
    });
    
    if (!found) {
        loadCase('portfolio/home.html', 'home');
    }
}

// ========================================
// 활성 메뉴 표시
// ========================================
function setActiveMenu(element) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

function setActiveSubmenu(element) {
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
}

// ========================================
// 모바일 사이드바 토글
// ========================================
function initMobileSidebar() {
    const toggleBtn = document.getElementById('sidebarToggleMobile');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
    
    // 사이드바 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });
}

// ========================================
// 헤더 로고 클릭 이벤트
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.app-logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            loadCase('portfolio/home.html', 'home');
            
            // 모든 메뉴 비활성화
            document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
                item.classList.remove('active');
            });
        });
    }
});

// ========================================
// 해시 변경 감지 (브라우저 뒤로가기/앞으로가기, 링크 클릭)
// ========================================
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        loadCaseByHash(hash);
    } else {
        loadCase('portfolio/home.html', 'home');
    }
});
