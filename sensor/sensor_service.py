"""Main sensing loop: camera -> detection -> homography -> emit.

Privacy-by-design: the raw camera frame never leaves this process and is
never persisted. Only the derived anonymous JSON event is sent onward, e.g.:

    {
      "timestamp": "2026-09-17T12:00:00.000Z",
      "zone_id": "zone_1",
      "occupancy_count": 2,
      "movement_events": [{"x": 120.5, "y": 80.2, "confidence": 0.91}, ...],
      "confidence": 0.91
    }
"""
import time
from datetime import datetime, timezone

import cv2
import socketio
import yaml

from detector import PersonDetector
from homography import Homography


def load_config(path="config.yaml"):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def build_event(zone_id, detections):
    movement_events = [
        {"x": round(x, 1), "y": round(y, 1), "confidence": round(conf, 3)}
        for x, y, conf in detections
    ]
    confidences = [e["confidence"] for e in movement_events]
    overall_confidence = round(max(confidences), 3) if confidences else 0.0

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "zone_id": zone_id,
        "occupancy_count": len(movement_events),
        "movement_events": movement_events,
        "confidence": overall_confidence,
    }


def run():
    config = load_config()

    detector = PersonDetector(
        model_path=config["detector"]["model_path"],
        confidence_threshold=config["detector"]["confidence_threshold"],
    )
    homography = Homography.from_config(config["homography"])

    sio = socketio.Client()
    sio.connect(config["server"]["url"])

    camera = cv2.VideoCapture(config["camera"]["index"])
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, config["camera"]["width"])
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, config["camera"]["height"])

    frame_interval = 1.0 / config["camera"]["fps_target"]
    zone_id = config["zone"]["id"]
    event_name = config["server"]["event_name"]

    try:
        while True:
            loop_start = time.time()

            ok, frame = camera.read()
            if not ok:
                continue

            raw_detections = detector.detect(frame)
            mapped_detections = [
                (*homography.transform_point(x, y), conf)
                for x, y, conf in raw_detections
            ]

            event = build_event(zone_id, mapped_detections)
            sio.emit(event_name, event)

            # frame is discarded here; nothing is written to disk or sent.
            elapsed = time.time() - loop_start
            time.sleep(max(0.0, frame_interval - elapsed))
    except KeyboardInterrupt:
        pass
    finally:
        camera.release()
        sio.disconnect()


if __name__ == "__main__":
    run()
