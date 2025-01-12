import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useCustomScroll } from "./ScrollContext";
import React from "react";

export default function Scene() {
  const { animations, scene } = useGLTF("/minecraft_loop.glb");
  const mixer = useRef<THREE.AnimationMixer>();
  const { scroll } = useCustomScroll();
  const { set } = useThree();

  // Find the camera and light animations
  const cameraAction = animations.find((a) =>
    a.name.includes("CameraAction.001")
  );
  const lightAction = animations.find((a) =>
    a.name.includes("LightAction.001")
  );

  // Get the camera and light from the scene
  const camera = scene.getObjectByName("Camera") as THREE.PerspectiveCamera;
  const light = scene.getObjectByName("Light");

  useFrame(() => {
    if (mixer.current && cameraAction) {
      const duration = cameraAction.duration;
      const loopedTime = scroll * duration;
      mixer.current.setTime(loopedTime);
    }
  });

  useLayoutEffect(() => {
    if (camera && light && cameraAction && lightAction) {
      // Add camera and light to the scene
      scene.add(camera);
      scene.add(light);

      // Set the camera as the default camera
      set({ camera });

      // Create animation mixer
      mixer.current = new THREE.AnimationMixer(scene);

      // Create and play animations without loop settings
      // (we'll handle looping manually in useFrame)
      const cameraClipAction = mixer.current.clipAction(cameraAction);
      cameraClipAction.play();

      const lightClipAction = mixer.current.clipAction(lightAction);
      lightClipAction.play();

      // Set initial time to 0
      mixer.current.setTime(0);
    }
  }, [camera, light, cameraAction, lightAction, set]);

  return (
    <>
      {camera && <primitive object={camera} />}
      <primitive object={scene} />
    </>
  );
}
