'''
[ Dec 4 ] Updates
1. 좌표 색상 변경
2. 목 좌우 기울기에 따른 경고 추가
'''
import cv2
import mediapipe as mp
import numpy as np
import datetime
import os

class PostureMonitor:
    def __init__(self):
        # MediaPipe 초기화
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # 비디오 캡처 설정
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # 녹화 관련 변수
        self.is_recording = False
        self.out = None
        self.recording_start_time = None
        
        # 자세 관련 변수
        self.bad_posture_count = 0
        self.current_angle = 0
        self.current_face_distance = 0
        self.is_bad_posture = False
        self.bad_posture_duration = 0
        self.warning_threshold_lower = 145  # 정상 자세의 최소 각도
        self.warning_threshold_upper = 155  # 정상 자세의 최대 각도
        self.face_distance_threshold = 0.5  # 얼굴 거리 임계값
        
        # 통계 데이터
        self.session_start_time = None
        self.total_monitoring_time = 0
        self.posture_history = []

    def start_recording(self):
        if not self.is_recording:
            # 녹화 파일 설정
            recordings_dir = 'recordings'
            if not os.path.exists(recordings_dir):
                os.makedirs(recordings_dir)
                
            filename = f'posture_recording_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.avi'
            filepath = os.path.join(recordings_dir, filename)
            
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            self.out = cv2.VideoWriter(filepath, fourcc, 20.0, (640, 480))
            self.is_recording = True
            self.recording_start_time = datetime.datetime.now()
            return filename
        return None

    def stop_recording(self):
        if self.is_recording and self.out is not None:
            self.is_recording = False
            self.out.release()
            self.recording_start_time = None
            return True
        return False

    def calculate_neck_angle(self, landmarks):
        try:
            # 귀-어깨-힙 각도 계산
            ear = (landmarks[self.mp_pose.PoseLandmark.LEFT_EAR].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_EAR].y)
            shoulder = (landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].x,
                       landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER].y)
            hip = (landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].x,
                   landmarks[self.mp_pose.PoseLandmark.LEFT_HIP].y)
            
            vector1 = np.array([ear[0] - shoulder[0], ear[1] - shoulder[1]])
            vector2 = np.array([hip[0] - shoulder[0], hip[1] - shoulder[1]])
            
            angle = np.degrees(np.arccos(np.dot(vector1, vector2) / 
                                       (np.linalg.norm(vector1) * np.linalg.norm(vector2))))
            return angle
        except:
            return None

    def calculate_face_distance(self, landmarks):
        try:
            # 양쪽 귀 사이의 거리를 이용하여 얼굴 거리 추정
            left_ear = landmarks[self.mp_pose.PoseLandmark.LEFT_EAR]
            right_ear = landmarks[self.mp_pose.PoseLandmark.RIGHT_EAR]
            
            # 3D 좌표 사용
            ear_distance = np.sqrt(
                (left_ear.x - right_ear.x)**2 +
                (left_ear.y - right_ear.y)**2
            )
            return ear_distance
        except:
            return None

    def process_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            return None

        # 프레임 전처리
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)

        if results.pose_landmarks:
            # 랜드마크 그리기 (투명도 적용)
            overlay = np.zeros_like(frame)
            self.mp_draw.draw_landmarks(
                overlay,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                #self.mp_draw.DrawingSpec(color=(255, 255, 255), thickness=1, circle_radius=1)
            )

            # 목 각도 계산
            angle = self.calculate_neck_angle(results.pose_landmarks.landmark)
            # 얼굴 거리 계산
            face_distance = self.calculate_face_distance(results.pose_landmarks.landmark)

            if angle is not None and face_distance is not None:
                self.current_angle = angle
                self.current_face_distance = face_distance

                # 조건 확인
                is_bad_angle = (self.current_angle < self.warning_threshold_lower or
                                self.current_angle > self.warning_threshold_upper)
                is_too_close = self.current_face_distance > self.face_distance_threshold

                if is_bad_angle or is_too_close:
                    self.bad_posture_duration += 1
                    if self.bad_posture_duration > 30:  # 1.5초 이상 지속
                        self.is_bad_posture = True
                        self.bad_posture_count += 1
                        warning_text = "" # 경고 출력
                        if is_too_close:
                            warning_text += " (Too Close)"
                        cv2.putText(frame, warning_text, (300, 50),
                                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                else:
                    self.is_bad_posture = False
                    self.bad_posture_duration = 0  # Reset duration if good posture detected

                # 현재 상태 표시
                # cv2.putText(frame, f"Neck Angle: {self.current_angle:.1f}", (10, 30),
                #             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                # cv2.putText(frame, f"Face Distance: {self.current_face_distance:.2f}", (10, 60),
                #             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                print(f"Angle: {self.current_angle}, Threshold: {self.warning_threshold_lower} - {self.warning_threshold_upper}")
                print(f"Is Bad Posture: {self.is_bad_posture}, Face Distance: {self.current_face_distance}, Threshold: {self.face_distance_threshold}")

        # 녹화 중인 경우 프레임 저장
        if self.is_recording and self.out is not None:
            self.out.write(frame)
            cv2.putText(frame, "REC", (590, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        return frame

    def get_status(self):
        recording_time = None
        if self.recording_start_time:
            recording_time = (datetime.datetime.now() - self.recording_start_time).seconds

        return {
                'angle': self.current_angle,
                'is_bad_posture': bool(self.is_bad_posture),  # NumPy bool_ -> Python bool 변환
                'bad_posture_count': self.bad_posture_count,
                'is_recording': self.is_recording,
                'recording_time': recording_time
            }
    
    def __del__(self):
        self.cap.release()
        if self.out is not None:
            self.out.release()
