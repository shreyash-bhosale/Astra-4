import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

export default function LiquidMetalHeroCanvas() {
  const mountRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let renderer = null;
    let animationFrameId = null;

    try {
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const width = currentMount.clientWidth || window.innerWidth || 1200;
      const height = currentMount.clientHeight || window.innerHeight || 800;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, width / (height || 1), 0.1, 1000);
      camera.position.z = 18;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      currentMount.appendChild(renderer.domElement);

      // Liquid Chrome / Polished Mercury Material
      const chromeMaterial = new THREE.MeshPhysicalMaterial({
        color: isDark ? new THREE.Color(0xdadce0) : new THREE.Color(0xf4f4f6),
        metalness: isDark ? 0.98 : 0.94,
        roughness: isDark ? 0.08 : 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        reflectivity: 1.0
      });

      const sculptures = [];

      // Procedural liquid blob geometry generator
      function createLiquidBlobGeometry(radius, detail, deformFreq, deformAmp) {
        const geo = new THREE.IcosahedronGeometry(radius, detail);
        const pos = geo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          const theta = Math.atan2(v.y, v.x);
          const len = Math.max(0.001, v.length());
          const phi = Math.acos(Math.max(-1, Math.min(1, v.z / len)));
          const noise = Math.sin(theta * deformFreq + phi * 2) * Math.cos(phi * deformFreq) * deformAmp;
          v.multiplyScalar(1 + noise);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        geo.computeVertexNormals();
        return geo;
      }

      // 1. Left organic mercury sculpture entering viewport
      const blob1Geo = createLiquidBlobGeometry(3.6, 5, 2.5, 0.28);
      const blob1 = new THREE.Mesh(blob1Geo, chromeMaterial);
      blob1.position.set(-10.5, 1.2, -1.5);
      scene.add(blob1);
      sculptures.push({
        mesh: blob1,
        speedX: 0.0006,
        speedY: 0.0008,
        floatSpeed: 0.8,
        floatAmp: 0.45,
        initY: 1.2,
        parallaxFactor: 0.035
      });

      // 2. Right organic chrome ribbon mass
      const blob2Geo = createLiquidBlobGeometry(3.8, 5, 3.0, 0.3);
      const blob2 = new THREE.Mesh(blob2Geo, chromeMaterial);
      blob2.position.set(11.0, -0.8, -2.0);
      scene.add(blob2);
      sculptures.push({
        mesh: blob2,
        speedX: 0.0005,
        speedY: 0.0007,
        floatSpeed: 0.65,
        floatAmp: 0.5,
        initY: -0.8,
        parallaxFactor: 0.03
      });

      // 3. Top-right suspended mercury droplet
      const droplet1Geo = createLiquidBlobGeometry(1.2, 4, 2.0, 0.2);
      const droplet1 = new THREE.Mesh(droplet1Geo, chromeMaterial);
      droplet1.position.set(7.5, 4.2, -3.5);
      scene.add(droplet1);
      sculptures.push({
        mesh: droplet1,
        speedX: 0.001,
        speedY: 0.0012,
        floatSpeed: 1.1,
        floatAmp: 0.35,
        initY: 4.2,
        parallaxFactor: 0.02
      });

      // Dynamic studio lighting configured for dark/light contrast
      const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.4);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 3.0 : 2.2);
      keyLight.position.set(12, 18, 15);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(isDark ? 0x93c5fd : 0xd4d4d8, isDark ? 2.0 : 1.4);
      fillLight.position.set(-14, -10, 10);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(isDark ? 0x6366f1 : 0x27272a, isDark ? 2.2 : 1.2);
      rimLight.position.set(0, -15, -8);
      scene.add(rimLight);

      // Pointer Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const handleMouseMove = (e) => {
        const { innerWidth, innerHeight } = window;
        targetMouseX = (e.clientX / innerWidth - 0.5) * 2;
        targetMouseY = (e.clientY / innerHeight - 0.5) * 2;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const handleResize = () => {
        if (!mountRef.current || !renderer) return;
        const w = mountRef.current.clientWidth || window.innerWidth;
        const h = mountRef.current.clientHeight || window.innerHeight;
        camera.aspect = w / (h || 1);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // Animation Loop
      const startTime = performance.now();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const elapsedTime = (performance.now() - startTime) / 1000;
        mouseX += (targetMouseX - mouseX) * 0.04;
        mouseY += (targetMouseY - mouseY) * 0.04;

        if (!prefersReducedMotion) {
          sculptures.forEach((item) => {
            const floatOffset = Math.sin(elapsedTime * item.floatSpeed) * item.floatAmp;
            item.mesh.position.y = item.initY + floatOffset - mouseY * item.parallaxFactor * 6;
            item.mesh.rotation.x += item.speedX;
            item.mesh.rotation.y += item.speedY;
          });

          camera.position.x = mouseX * 0.5;
          camera.position.y = -mouseY * 0.35;
          camera.lookAt(0, 0, 0);
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);

        if (currentMount && renderer && renderer.domElement && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }

        try {
          if (renderer) renderer.dispose();
        } catch (e) {
          // ignore cleanup errors
        }
      };
    } catch (err) {
      console.warn('WebGL initialization failed, falling back to CSS Liquid-Metal mesh:', err);
      setWebglFailed(true);
    }
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {webglFailed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'radial-gradient(ellipse 60% 50% at 15% 40%, rgba(99, 102, 241, 0.15), transparent 70%), radial-gradient(ellipse 55% 45% at 85% 60%, rgba(56, 189, 248, 0.12), transparent 70%)'
              : 'radial-gradient(ellipse 60% 50% at 15% 40%, rgba(200, 204, 212, 0.4), transparent 70%), radial-gradient(ellipse 55% 45% at 85% 60%, rgba(180, 185, 195, 0.35), transparent 70%)',
            filter: 'blur(30px)',
            opacity: 0.8
          }}
        />
      )}
    </div>
  );
}
