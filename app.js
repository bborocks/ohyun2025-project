//게시물을 불러오는 중 오류가 발생했습니다.오류 해결하기!!
const API_BASE_URL = 'http://crud.tlol.me';
const RESOURCE = 'post';

// DOM 요소들
const ideaForm = document.getElementById('idea-form');
const postsContainer = document.getElementById('posts');
const postTemplate = document.getElementById('post-template');
const searchInput = document.getElementById('search-user');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const postFormSection = document.getElementById('post-form');

let currentUser = localStorage.getItem('currentUser');

// 페이지네이션 상태
let currentPage = 1;
const postsPerPage = 10;

// 폼 제출 이벤트 처리
ideaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        alert('먼저 로그인해주세요.');
        return;
    }
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    try {
        // POST 요청 전에 해당 사용자의 resource가 존재하는지 확인
        const checkResponse = await fetch(`${API_BASE_URL}/${currentUser}/${RESOURCE}`);
        
        if (!checkResponse.ok && checkResponse.status !== 404) {
            throw new Error('서버 연결 실패');
        }

        const response = await fetch(`${API_BASE_URL}/${currentUser}/${RESOURCE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                content: content,
                timestamp: new Date().toISOString() // 시간 정보 추가
            })
        });

        if (!response.ok) throw new Error('게시물 생성 실패');

        // 폼 초기화
        ideaForm.reset();
        // 게시물 목록 새로고침
        loadPosts();
        alert('게시물이 성공적으로 작성되었습니다!');
    } catch (error) {
        console.error('Error:', error);
        alert('게시물을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
});

// 게시물 목록 로드
async function loadPosts() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${currentUser}/${RESOURCE}`);
        
        if (response.status === 404) {
            // 해당 사용자의 첫 접속인 경우
            postsContainer.innerHTML = '<p class="no-posts">아직 작성된 게시물이 없습니다.</p>';
            return;
        }

        if (!response.ok) throw new Error('게시물 로드 실패');

        const responseData = await response.json();
        
        if (!responseData.data || responseData.data.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">아직 작성된 게시물이 없습니다.</p>';
            return;
        }

        displayPosts(responseData.data); // data 배열에서 게시물 가져오기
        
        // 페이지네이션 정보가 있는 경우에만 업데이트
        if (responseData.total !== undefined && responseData.page !== undefined && responseData.pageSize !== undefined) {
            updatePagination(responseData.total, responseData.page, responseData.pageSize);
        }
    } catch (error) {
        console.error('Error:', error);
        postsContainer.innerHTML = '<p class="error">게시물을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 페이지네이션 UI 업데이트
function updatePagination(total, currentPage, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    // 페이지네이션 UI 업데이트 로직을 여기에 추가할 수 있습니다
}

// 게시물 화면에 표시
function displayPosts(posts) {
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = postTemplate.content.cloneNode(true);
        
        const postTitle = postElement.querySelector('.post-title');
        const postContent = postElement.querySelector('.post-content');
        const authorInfo = postElement.querySelector('.post-author');
        const dropdownMenu = postElement.querySelector('.dropdown-menu');
        const moreButton = postElement.querySelector('.btn-more');
        const editButton = postElement.querySelector('.btn-edit');
        const deleteButton = postElement.querySelector('.btn-delete');
        
        postTitle.textContent = post.title;
        postContent.textContent = post.content;
        authorInfo.textContent = `작성자: ${post.userId || '알 수 없음'}`;
        
        // 현재 로그인한 사용자의 게시물인 경우에만 더보기 메뉴 표시
        if (currentUser === post.userId) {
            moreButton.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('hidden');
            });
            
            // 수정 버튼 이벤트
            editButton.addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
                editPost(post.id);
            });
            
            // 삭제 버튼 이벤트
            deleteButton.addEventListener('click', () => {
                dropdownMenu.classList.add('hidden');
                deletePost(post.id);
            });
        } else {
            // 다른 사용자의 게시물인 경우 더보기 버튼 숨김
            moreButton.style.display = 'none';
        }
        
        postsContainer.appendChild(postElement);
    });
    
    // 다른 곳을 클릭하면 드롭다운 메뉴 닫기
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => dropdown.classList.add('hidden'));
    });
}

// 게시물 수정
async function editPost(postId) {
    const newTitle = prompt('새 제목을 입력하세요:');
    const newContent = prompt('새 내용을 입력하세요:');
    
    if (!newTitle || !newContent) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${USER_ID}/${RESOURCE}/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle,
                content: newContent
            })
        });

        if (!response.ok) throw new Error('게시물 수정 실패');

        loadPosts();
    } catch (error) {
        alert('게시물을 수정하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// 게시물 삭제
async function deletePost(postId) {
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
    }

    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${currentUser}/${RESOURCE}/${postId}`, {
            method: 'DELETE'
        });

        if (response.status === 404) {
            throw new Error('게시물을 찾을 수 없습니다.');
        }

        if (!response.ok) {
            throw new Error('게시물 삭제 실패');
        }

        alert('게시물이 성공적으로 삭제되었습니다.');
        await loadPosts(); // 게시물 목록 새로고침
    } catch (error) {
        console.error('Delete Error:', error);
        alert(`게시물 삭제 실패: ${error.message}`);
    }
}

// 로그인/회원가입/로그아웃 버튼 관련 코드 제거 (index.html에서 관리하므로 중복 방지)

// UI 업데이트 함수들
function updateUIForLoggedInUser() {
    userLogin.classList.remove('active');
    userLogin.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    welcomeMessage.classList.add('active');
    currentUserSpan.textContent = currentUser;
    postFormSection.classList.remove('hidden');
}

function updateUIForLoggedOutUser() {
    userLogin.classList.add('active');
    userLogin.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    welcomeMessage.classList.remove('active');
    postFormSection.classList.add('hidden');
    postsContainer.innerHTML = '';
}

// 사용자 검색 처리
searchBtn.addEventListener('click', searchUsers);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

async function searchUsers() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        searchResults.innerHTML = '<p class="search-message">검색어를 입력해주세요.</p>';
        return;
    }

    searchResults.innerHTML = '<p class="search-message">검색 중...</p>';

    try {
        const users = await searchUsersByPrefix(searchTerm);
        if (users.length === 0) {
            searchResults.innerHTML = '<p class="search-message">검색 결과가 없습니다.</p>';
        } else {
            displaySearchResults(users);
        }
    } catch (error) {
        console.error('사용자 검색 중 오류 발생:', error);
        searchResults.innerHTML = '<p class="error">검색 중 오류가 발생했습니다.</p>';
    }
}

function displaySearchResults(users) {
    searchResults.innerHTML = '';
    if (users.length === 0) {
        searchResults.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <span>${user}</span>
            <button class="btn-submit">게시물 보기</button>
        `;
        userCard.querySelector('button').addEventListener('click', () => {
            loadUserPosts(user);
        });
        searchResults.appendChild(userCard);
    });
}

// 특정 사용자의 게시물 로드
async function loadUserPosts(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/${username}/${RESOURCE}`);
        
        if (response.status === 404) {
            postsContainer.innerHTML = '<p class="no-posts">이 사용자의 게시물이 없습니다.</p>';
            return;
        }

        if (!response.ok) throw new Error('게시물 로드 실패');

        const responseData = await response.json();
        
        if (!responseData.data || responseData.data.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">이 사용자의 게시물이 없습니다.</p>';
            return;
        }

        displayPosts(responseData.data);
    } catch (error) {
        console.error('Error:', error);
        postsContainer.innerHTML = '<p class="error">게시물을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 검색한 사용자의 존재 여부 확인
async function checkUserExists(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/${username}/${RESOURCE}`);
        return response.status !== 404; // 404가 아니면 사용자가 존재하는 것으로 간주
    } catch (error) {
        return false;
    }
}

// 검색어로 시작하는 유저 찾기 (검색 시뮬레이션)
async function searchUsersByPrefix(searchTerm) {
    // localStorage에서 이전에 접속한 모든 사용자 목록 가져오기
    const knownUsers = JSON.parse(localStorage.getItem('knownUsers') || '[]');
    
    // 현재 사용자가 목록에 없다면 추가
    if (currentUser && !knownUsers.includes(currentUser)) {
        knownUsers.push(currentUser);
        localStorage.setItem('knownUsers', JSON.stringify(knownUsers));
    }

    // 검색어로 필터링
    const matchingUsers = knownUsers.filter(user => 
        user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 실제로 존재하는 사용자만 필터링
    const existingUsers = [];
    for (const user of matchingUsers) {
        if (await checkUserExists(user)) {
            existingUsers.push(user);
        }
    }

    return existingUsers;
}

// 목차 클릭 시 정확히 해당 섹션으로 스크롤
document.addEventListener('DOMContentLoaded', () => {
    const navLogin = document.querySelector('.nav-menu .nav-item[data-target="user-section"]');
    const navSearch = document.querySelector('.nav-menu .nav-item[data-target="search-section"]');
    const navBoard = document.querySelector('.nav-menu .nav-item[data-target="board-section"]');
    if (navLogin) {
        navLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('user-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    if (navSearch) {
        navSearch.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('search-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    if (navBoard) {
        navBoard.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('board-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            loadAllPosts();
        });
    }
});

// 게시판 항상 전체 게시글 보이도록 수정 (localStorage 기반으로 통일)
function loadAllPosts() {
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    displayPosts(posts);
}

// 게시글 등록 시 전체 게시글 다시 로드 (localStorage 기반)
ideaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert('먼저 로그인해주세요.');
        return;
    }
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    posts.push({
        id: Date.now(),
        userId: currentUser,
        title,
        content
    });
    localStorage.setItem('posts', JSON.stringify(posts));
    ideaForm.reset();
    loadAllPosts();
    alert('게시물이 성공적으로 작성되었습니다!');
    // 게시글 작성 후 폼 숨기기
    postFormSection.classList.add('hidden');
    postFormSection.classList.remove('active');
});

// 게시글 수정/삭제도 localStorage 기반으로
function displayPosts(posts) {
    postsContainer.innerHTML = '';
    posts.forEach(post => {
        const postElement = postTemplate.content.cloneNode(true);
        const postTitle = postElement.querySelector('.post-title');
        const postContent = postElement.querySelector('.post-content');
        const authorInfo = postElement.querySelector('.post-author');
        const editButton = postElement.querySelector('.btn-edit');
        const deleteButton = postElement.querySelector('.btn-delete');
        postTitle.textContent = post.title;
        postContent.textContent = post.content;
        authorInfo.textContent = `작성자: ${post.userId || '알 수 없음'}`;
        if (currentUser === post.userId) {
            editButton.classList.remove('hidden');
            deleteButton.classList.remove('hidden');
            editButton.onclick = () => editPost(post.id);
            deleteButton.onclick = () => deletePost(post.id);
        } else {
            editButton.classList.add('hidden');
            deleteButton.classList.add('hidden');
        }
        postsContainer.appendChild(postElement);
    });
}

function editPost(postId) {
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const idx = posts.findIndex(p => p.id === postId && p.userId === currentUser);
    if (idx === -1) return;
    const newTitle = prompt('새 제목을 입력하세요:', posts[idx].title);
    const newContent = prompt('새 내용을 입력하세요:', posts[idx].content);
    if (newTitle && newContent) {
        posts[idx].title = newTitle;
        posts[idx].content = newContent;
        localStorage.setItem('posts', JSON.stringify(posts));
        loadAllPosts();
    }
}

function deletePost(postId) {
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    posts = posts.filter(p => !(p.id === postId && p.userId === currentUser));
    localStorage.setItem('posts', JSON.stringify(posts));
    loadAllPosts();
}

// 로그인에 비밀번호 추가 및 중복 이벤트 제거
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[username] || users[username].password !== password) {
        alert('아이디 또는 비밀번호가 올바르지 않습니다.');
        return;
    }
    currentUser = username;
    localStorage.setItem('currentUser', username);
    updateUIForLoggedInUser();
    loadAllPosts();
});

// 회원가입 폼 동적 생성 및 처리(예시)
if (!document.getElementById('signup-form')) {
    const signupForm = document.createElement('form');
    signupForm.id = 'signup-form';
    signupForm.innerHTML = `
        <input type="text" id="signup-username" placeholder="아이디" required />
        <input type="password" id="signup-password" placeholder="비밀번호" required />
        <button type="submit">회원가입</button>
    `;
    userLogin.appendChild(signupForm);
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        let users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[username]) {
            alert('이미 존재하는 아이디입니다.');
            return;
        }
        users[username] = { password };
        localStorage.setItem('users', JSON.stringify(users));
        alert('회원가입이 완료되었습니다. 로그인 해주세요.');
        signupForm.reset();
    });
}

// 최초 진입 시 전체 게시글 로드
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        updateUIForLoggedInUser();
        loadAllPosts();
    } else {
        updateUIForLoggedOutUser();
        loadAllPosts();
    }
});

// +버튼 클릭 시 게시글 작성 폼 보이기
const addPostBtn = document.getElementById('add-post-btn');
if (addPostBtn) {
    addPostBtn.addEventListener('click', () => {
        postFormSection.classList.remove('hidden');
        postFormSection.classList.add('active');
    });
}
