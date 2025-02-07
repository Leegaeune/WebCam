document.addEventListener('DOMContentLoaded', function() {
    // 모달 요소
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeBtns = document.querySelectorAll('.close');

    // 모달 열기
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    signupBtn.addEventListener('click', () => {
        signupModal.style.display = 'block';
    });

    // 모달 닫기
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            signupModal.style.display = 'none';
        });
    });

    // 폼 제출 처리
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        // 여기에 로그인 처리 로직 추가
        console.log('로그인 시도');
    });

    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        // 여기에 회원가입 처리 로직 추가
        console.log('회원가입 시도');
    });
});