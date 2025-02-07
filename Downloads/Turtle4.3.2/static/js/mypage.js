document.addEventListener('DOMContentLoaded', function() {
    // 차트 초기화
    initializeCharts();
    
    // 갤러리 초기화
    loadGallery();
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 차트 초기화 함수
function initializeCharts() {
    // 학습 시간 차트
    const studyTimeCtx = document.getElementById('studyTimeChart').getContext('2d');
    new Chart(studyTimeCtx, {
        type: 'line',
        data: {
            labels: ['월', '화', '수', '목', '금', '토', '일'],
            datasets: [{
                label: '일일 학습 시간',
                data: [4, 4.5, 3, 2.5, 5, 2, 0],
                borderColor: '#43A363',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 자세 분석 차트
    const postureCtx = document.getElementById('postureChart').getContext('2d');
    new Chart(postureCtx, {
        type: 'doughnut',
        data: {
            labels: ['바른 자세', '거북목', '기타'],
            datasets: [{
                data: [70, 20, 10],
                backgroundColor: ['#28a745', '#dc3545', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 갤러리 로드 함수
function loadGallery(page = 1) {
    const videos = [
        {
            id: 1,
            thumbnail: '/static/images/video-thumbnail-1.jpg',
            title: '학습 세션 2024-11-14',
            duration: '02:30:52',
            date: '2024-11-14'
        },
        {
            id: 2,
            thumbnail: '/static/images/video-thumbnail-1.jpg',
            title: '학습 세션 2024-11-25',
            duration: '01:45:04',
            date: '2024-11-25'
        },
        {
            id: 3,
            thumbnail: '/static/images/video-thumbnail-1.jpg',
            title: '학습 세션 2024-12-01',
            duration: '03:15:36',
            date: '2024-12-01'
        },
        {
            id: 4,
            thumbnail: '/static/images/video-thumbnail-1.jpg',
            title: '학습 세션 2024-12-03',
            duration: '04:25:33',
            date: '2024-12-03'
        }
    ];

    const videoGrid = document.querySelector('.video-grid');
    videoGrid.innerHTML = '';

    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });
}

// 비디오 카드 생성 함수
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
        <div class="video-info">
            <h4>${video.title}</h4>
            <p>재생 시간: ${video.duration}</p>
            <p>녹화일: ${video.date}</p>
        </div>
    `;
    return card;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 회원정보 수정 모달
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeBtn = editProfileModal.querySelector('.close');

    editProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    // 회원정보 수정 폼 제출
    const editProfileForm = document.getElementById('editProfileForm');
    editProfileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // 실제 구현시에는 서버로 데이터를 전송해야 함
        alert('회원정보가 수정되었습니다.');
        editProfileModal.style.display = 'none';
    });

    // 갤러리 필터
    const dateFilter = document.getElementById('dateFilter');
    const searchVideo = document.getElementById('searchVideo');

    dateFilter.addEventListener('change', () => {
        loadGallery();
    });

    searchVideo.addEventListener('input', () => {
        loadGallery();
    });

    // 페이지네이션
    document.getElementById('prevPage').addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentPage').textContent);
        if (currentPage > 1) {
            loadGallery(currentPage - 1);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('currentPage').textContent);
        const totalPages = parseInt(document.getElementById('totalPages').textContent);
        if (currentPage < totalPages) {
            loadGallery(currentPage + 1);
        }
    });
}