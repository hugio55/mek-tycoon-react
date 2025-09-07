"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SimpleBlockTest() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneDataRef = useRef<any>(null);

  useEffect(() => {
    if (!mountRef.current || sceneDataRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    // Create renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Add light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Create a simple yellow box
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Store references
    sceneDataRef.current = {
      scene,
      camera,
      renderer,
      cube,
      position: 0,
      speed: 0.1
    };

    // Animate
    let animationId: number;
    const animate = () => {
      const data = sceneDataRef.current;
      if (!data) return;

      // Move cube back and forth
      data.position += data.speed;
      if (data.position > 5 || data.position < -5) {
        data.speed = -data.speed;
      }
      
      data.cube.position.x = data.position;
      data.cube.rotation.x += 0.01;
      data.cube.rotation.y += 0.01;

      data.renderer.render(data.scene, data.camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      if (sceneDataRef.current) {
        sceneDataRef.current.renderer.dispose();
        if (mountRef.current?.contains(sceneDataRef.current.renderer.domElement)) {
          mountRef.current.removeChild(sceneDataRef.current.renderer.domElement);
        }
        sceneDataRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 text-white bg-black/50 p-4 rounded">
        <h1 className="text-2xl font-bold text-yellow-400">Simple Block Test</h1>
        <p className="text-sm mt-2">Yellow cube should be moving left and right</p>
      </div>
    </div>
  );
}