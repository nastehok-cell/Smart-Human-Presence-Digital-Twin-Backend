"""Person detection wrapper around YOLOv8n (ultralytics).

Kept as a thin wrapper so the backend swap to MediaPipe only touches this
file, per the architecture doc's "YOLOv8n (tai MediaPipe)" choice.
"""
from ultralytics import YOLO


class PersonDetector:
    def __init__(self, model_path="yolov8n.pt", confidence_threshold=0.5):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        self.person_class_id = 0  # COCO class 0 = "person"

    def detect(self, frame):
        """Returns a list of (center_x, center_y, confidence) in pixel space."""
        results = self.model.predict(
            frame,
            classes=[self.person_class_id],
            conf=self.confidence_threshold,
            verbose=False,
        )

        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                confidence = float(box.conf[0])
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                detections.append((center_x, center_y, confidence))
        return detections
