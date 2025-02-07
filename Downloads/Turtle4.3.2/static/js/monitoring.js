document.addEventListener('DOMContentLoaded', function() {
    // 타이머 관련 변수들
    let currentTimeMode = 'stopwatch';
    let timerInterval;
    let stopwatchInterval;
    let time = 0;
    let isRunning = false;

    // 비디오 녹화 관련 변수
    let mediaRecorder;
    let recordedChunks = [];

    // 비디오 스트림 가져오기
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const videoElement = document.getElementById('videoElement');
            videoElement.srcObject = stream;

            // MediaRecorder 생성
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);

                // 자동 다운로드
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'recorded-video.webm';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            };

            // 녹화 시작 버튼
            document.getElementById('recordBtn').addEventListener('click', () => {
                recordedChunks = []; // 이전 녹화 데이터 초기화
                mediaRecorder.start();
                document.getElementById('recordBtn').disabled = true;
                document.getElementById('stopBtn').disabled = false;
            });

            // 녹화 중지 버튼
            document.getElementById('stopBtn').addEventListener('click', () => {
                mediaRecorder.stop();
                document.getElementById('recordBtn').disabled = false;
                document.getElementById('stopBtn').disabled = true;
            });
        })
        .catch(error => {
            console.error("카메라 접근 오류:", error);
        });

    // 시작/일시정지 버튼
    document.getElementById('startBtn').addEventListener('click', function() {
        if (currentTimeMode === 'stopwatch') {
            handleStopwatch();
        } else {
            handleTimer();
        }
    });

    // 초기화 버튼
    document.getElementById('resetBtn').addEventListener('click', resetAll);

    // 타이머 시간 조절 버튼
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const unit = this.dataset.unit;
            const direction = this.classList.contains('up') ? 1 : -1;
            const input = document.getElementById(`${unit}Input`);
            let value = parseInt(input.value);

            const maxValues = { hours: 99, minutes: 59, seconds: 59 };

            value += direction;
            if (value < 0) value = 0;
            if (value > maxValues[unit]) value = maxValues[unit];

            input.value = String(value).padStart(2, '0');
        });
    });

    // 메모/투두 패널 전환
    document.querySelectorAll('.control-section .mode-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 토글 버튼 활성화 상태 변경
            document.querySelectorAll('.control-section .toggle-btn').forEach(b => 
                b.classList.remove('active'));
            this.classList.add('active');

            // 패널 전환
            const targetPanel = this.dataset.mode;
            document.querySelectorAll('.panel').forEach(panel => {
                if (panel.id === `${targetPanel}Panel`) {
                    panel.style.display = 'block';
                    panel.style.opacity = '1';
                } else {
                    panel.style.display = 'none';
                    panel.style.opacity = '0';
                }
            });
        });
    });

    // 타이머/스톱워치 모드 전환
    document.querySelectorAll('.time-section .mode-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            if (mode === currentTimeMode) return;

            document.querySelectorAll('.time-section .toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentTimeMode = mode;
            resetAll();

            const timerControls = document.querySelector('.timer-controls');
            timerControls.style.display = mode === 'timer' ? 'flex' : 'none';
        });
    });

    function handleStopwatch() {
        if (isRunning) {
            clearInterval(stopwatchInterval);
            document.getElementById('startBtn').textContent = 'START';
        } else {
            stopwatchInterval = setInterval(() => {
                time++;
                updateDisplay();
            }, 1000);
            document.getElementById('startBtn').textContent = 'PAUSE';
        }
        isRunning = !isRunning;
    }

    function handleTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            document.getElementById('startBtn').textContent = 'START';
        } else {
            if (time <= 0) {
                time = getTimerInputValue();
                if (time <= 0) return;
            }
            timerInterval = setInterval(() => {
                if (time <= 0) {
                    clearInterval(timerInterval);
                    handleTimerEnd();
                    return;
                }
                time--;
                updateDisplay();
            }, 1000);
            document.getElementById('startBtn').textContent = 'PAUSE';
        }
        isRunning = !isRunning;
    }

    function handleTimerEnd() {
        const timerSound = document.getElementById('timerSound');
        timerSound.play().catch(function (error) {
            console.error("오디오 재생 오류:", error);
        });

        alert('타이머가 종료되었습니다!');
        
        timerSound.pause();
        timerSound.currentTime = 0;

        resetAll();
    }
    
    function getTimerInputValue() {
        const hours = parseInt(document.getElementById('hoursInput').value) || 0;
        const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
        const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    function resetAll() {
        clearInterval(stopwatchInterval);
        clearInterval(timerInterval);
        time = 0;
        isRunning = false;
        updateDisplay();
        document.getElementById('startBtn').textContent = 'START';
    }

    function updateDisplay() {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        
        document.getElementById('timeDisplay').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // TodoList 기능
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodo');
    const todoList = document.getElementById('todoList');

    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    function addTodo() {
        const todoText = todoInput.value.trim();
        if (!todoText) return;

        const todoItem = document.createElement('li');
        todoItem.className = 'todo-item';
        
        const todoLeft = document.createElement('div');
        todoLeft.className = 'todo-left';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', function() {
            todoContent.style.textDecoration = this.checked ? 'line-through' : 'none';
            saveTodos();
        });
        
        const todoContent = document.createElement('div');
        todoContent.className = 'todo-content';
        todoContent.textContent = todoText;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-todo';
        deleteBtn.textContent = '🅧';
        deleteBtn.onclick = function() {
            todoItem.remove();
            saveTodos();
        };

        todoLeft.appendChild(checkbox);
        todoLeft.appendChild(todoContent);
        todoItem.appendChild(todoLeft);
        todoItem.appendChild(deleteBtn);
        todoList.appendChild(todoItem);

        todoInput.value = '';
        saveTodos();
    }

    function saveTodos() {
        const todos = [];
        document.querySelectorAll('.todo-item').forEach(item => {
            todos.push({
                text: item.querySelector('.todo-content').textContent,
                completed: item.querySelector('input[type="checkbox"]').checked
            });
        });
        localStorage.setItem('studyTodos', JSON.stringify(todos));
    }

    function loadTodos() {
        const savedTodos = localStorage.getItem('studyTodos');
        if (savedTodos) {
            JSON.parse(savedTodos).forEach(todo => {
                const todoItem = document.createElement('li');
                todoItem.className = 'todo-item';
                
                const todoLeft = document.createElement('div');
                todoLeft.className = 'todo-left';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.completed;
                checkbox.addEventListener('change', function() {
                    todoContent.style.textDecoration = this.checked ? 'line-through' : 'none';
                    saveTodos();
                });
                
                const todoContent = document.createElement('div');
                todoContent.className = 'todo-content';
                todoContent.textContent = todo.text;
                todoContent.style.textDecoration = todo.completed ? 'line-through' : 'none';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-todo';
                deleteBtn.textContent = 'ⓧ';
                deleteBtn.onclick = function() {
                    todoItem.remove();
                    saveTodos();
                };

                todoLeft.appendChild(checkbox);
                todoLeft.appendChild(todoContent);
                todoItem.appendChild(todoLeft);
                todoItem.appendChild(deleteBtn);
                todoList.appendChild(todoItem);
            });
        }
    }

    // 페이지 로드 시 저장된 할 일 목록 불러오기
    loadTodos();

    // 메모 기능
    const memoTextarea = document.getElementById('studyMemo');
    const saveMemoBtn = document.getElementById('saveMemo');
    const memoList = document.getElementById('memoList');

    if (saveMemoBtn) {  // null 체크 추가
        saveMemoBtn.addEventListener('click', saveMemo);
    }

    function saveMemo() {
        const memoText = memoTextarea.value.trim();
        if (!memoText) return;

        // 새로운 메모 아이템 생성
        const memoItem = document.createElement('li');
        memoItem.className = 'memo-item';
        
        const memoContent = document.createElement('div');
        memoContent.className = 'memo-content';
        memoContent.textContent = memoText;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-memo';
        deleteBtn.textContent = 'ⓧ';
        deleteBtn.onclick = function() {
            memoItem.remove();
            saveMemos();
        };

        memoItem.appendChild(memoContent);
        memoItem.appendChild(deleteBtn);
        memoList.appendChild(memoItem);

        // 입력창 초기화 및 저장
        memoTextarea.value = '';
        saveMemos();
    }

    // 메모 저장 함수
    function saveMemos() {
        const memos = [];
        document.querySelectorAll('.memo-item .memo-content').forEach(memo => {
            memos.push(memo.textContent);
        });
        localStorage.setItem('studyMemos', JSON.stringify(memos));
    }

    // 저장된 메모 불러오기
    function loadMemos() {
        const savedMemos = localStorage.getItem('studyMemos');
        if (savedMemos) {
            JSON.parse(savedMemos).forEach(memoText => {
                const memoItem = document.createElement('li');
                memoItem.className = 'memo-item';
                
                const memoContent = document.createElement('div');
                memoContent.className = 'memo-content';
                memoContent.textContent = memoText;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-memo';
                deleteBtn.textContent = 'ⓧ';
                deleteBtn.onclick = function() {
                    memoItem.remove();
                    saveMemos();
                };

                memoItem.appendChild(memoContent);
                memoItem.appendChild(deleteBtn);
                memoList.appendChild(memoItem);
            });
        }
    }

    // Enter 키로 메모 저장
    if (memoTextarea) {  // null 체크 추가
        memoTextarea.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveMemo();
            }
        });
    }

    // 페이지 로드 시 저장된 메모 불러오기
    loadMemos();

    let isPopupShown = false;  // 팝업 상태
    let lastBadPostureTime = 0;  // 마지막 나쁜 자세 감지 시간
    const postureAlertCooldown = 5000;  // 5초간 대기

    function detectAndHandleBadPosture() {
        fetch('/posture_status')
            .then(response => response.json())
            .then(data => {
                const currentTime = Date.now();  // 현재 시간 (밀리초 단위)

                if (data.is_bad_posture) {
                    // 나쁜 자세가 감지된 경우
                    if (!isPopupShown || (currentTime - lastBadPostureTime) > postureAlertCooldown) {
                        alert('Bad Posture Detected! Please correct your posture.');
                        isPopupShown = true;  // 팝업 상태를 true로 설정
                        lastBadPostureTime = currentTime;  // 현재 시간 기록
                    }
                } else {
                    // 바른 자세로 돌아온 경우
                    if (isPopupShown) {
                        console.log('Posture corrected.');
                        isPopupShown = false;  // 팝업 상태 초기화
                        lastBadPostureTime = 0;  // 마지막 감지 시간 초기화
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching posture status:', error);
            });
    }

    setInterval(detectAndHandleBadPosture, 1000);
    
});