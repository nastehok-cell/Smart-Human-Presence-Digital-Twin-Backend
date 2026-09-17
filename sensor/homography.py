"""Pixel -> floor-plan coordinate transform (UC_9).

Calibrated once per camera placement: four camera-frame points are mapped
to their corresponding points on the 2D floor plan, producing a homography
matrix via cv2.getPerspectiveTransform. Every detected person's bounding-box
center is then projected through that matrix.
"""
import numpy as np
import cv2


class Homography:
    def __init__(self, camera_points, map_points):
        src = np.array(camera_points, dtype=np.float32)
        dst = np.array(map_points, dtype=np.float32)
        self.matrix = cv2.getPerspectiveTransform(src, dst)

    @classmethod
    def from_config(cls, homography_config):
        return cls(
            homography_config["camera_points"],
            homography_config["map_points"],
        )

    def transform_point(self, x, y):
        point = np.array([[[x, y]]], dtype=np.float32)
        mapped = cv2.perspectiveTransform(point, self.matrix)
        mx, my = mapped[0][0]
        return float(mx), float(my)
