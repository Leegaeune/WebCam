document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    
    startBtn.addEventListener('click', function() {
        // 로그인 상태 확인 후 리다이렉트
        if (document.cookie.includes('user_id')) {
            window.location.href = '/monitoring';
        } else {
            document.getElementById('loginModal').style.display = 'block';
        }
    });
});