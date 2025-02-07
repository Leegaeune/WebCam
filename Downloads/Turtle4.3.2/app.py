from flask import Flask, render_template, Response, request, jsonify
from model.posture import PostureMonitor
import cv2
import os
import datetime

app = Flask(__name__)
posture_monitor = PostureMonitor()

# VideoWriter 초기화 변수
is_recording = False
video_writer = None
output_dir = 'recordings'
os.makedirs(output_dir, exist_ok=True)

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/monitoring')
def monitoring():
    return render_template('monitoring.html')

@app.route('/mypage')
def pypage():
    return render_template('mypage.html')

def gen_frames():
    global is_recording, video_writer

    while True:
        frame = posture_monitor.process_frame()
        if frame is None:
            break

        # 비디오 저장 중이면 프레임을 기록
        if is_recording and video_writer:
            video_writer.write(frame)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start_recording', methods=['POST'])
def start_recording():
    global is_recording, video_writer

    if not is_recording:
        # 저장 파일 이름 생성
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = os.path.join(output_dir, f'recording_{timestamp}.avi')

        # VideoWriter 초기화 (프레임 크기는 카메라의 해상도와 일치해야 함)
        fourcc = cv2.VideoWriter_fourcc(*'XVID')  # AVI 포맷 코덱
        frame_width = 640  # 카메라 해상도에 맞춰야 함
        frame_height = 480
        video_writer = cv2.VideoWriter(filename, fourcc, 20.0, (frame_width, frame_height))

        is_recording = True
        return jsonify({"status": "recording started", "filename": filename})
    else:
        return jsonify({"status": "already recording"})

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global is_recording, video_writer

    if is_recording:
        is_recording = False
        video_writer.release()
        video_writer = None
        return jsonify({"status": "recording stopped"})
    else:
        return jsonify({"status": "not recording"})
    
@app.route('/posture_status', methods=['GET'])
def posture_status():
    status = posture_monitor.get_status()
    print(status)  # 상태 확인을 위해 서버 콘솔에 출력
    return jsonify({
        "is_bad_posture": status["is_bad_posture"],  # bad posture 상태 전달
        "current_angle": status["angle"],
        "bad_posture_count": status["bad_posture_count"],
    })

if __name__ == '__main__':
    app.run(debug=True)