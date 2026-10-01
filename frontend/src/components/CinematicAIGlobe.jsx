import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

export default function CinematicAIGlobe({ scrollProgress = 0, isMobile = false }) {
  const mountRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Store target scroll progress in ref for smooth lerping inside requestAnimationFrame
  const progressRef = useRef(scrollProgress);
  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let renderer = null;
    let animationFrameId = null;

    try {
      const prefersReducedMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const width = currentMount.clientWidth || window.innerWidth || 1200;
      const height = currentMount.clientHeight || window.innerHeight || 800;

      const scene = new THREE.Scene();

      // Camera setup
      const camera = new THREE.PerspectiveCamera(45, width / (height || 1), 0.1, 1000);
      camera.position.set(0, 0, 18);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      currentMount.appendChild(renderer.domElement);

      // Main container group for the AI Core & Agent System
      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // ========================================================================
      // 1. ATMOSPHERIC OUTER HALO & EMISSION SHELL
      // ========================================================================
      const haloGeo = new THREE.SphereGeometry(3.8, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0284c7,
        transparent: true,
        opacity: isDark ? 0.08 : 0.05,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      globeGroup.add(haloMesh);

      // Secondary soft violet outer ambient ring
      const outerRingGeo = new THREE.RingGeometry(4.8, 5.2, 64);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x818cf8 : 0x6366f1,
        transparent: true,
        opacity: isDark ? 0.12 : 0.08,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.rotation.x = Math.PI * 0.42;
      globeGroup.add(outerRing);

      // ========================================================================
      // 2. CENTRAL DIGITAL RESOLUTION CORE (Geodesic Sphere + Wireframe Lattice)
      // ========================================================================
      // Inner dark core base
      const coreBaseGeo = new THREE.IcosahedronGeometry(2.6, 3);
      const coreBaseMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x070b14 : 0x0f172a,
        wireframe: false,
        transparent: true,
        opacity: 0.95
      });
      const coreBaseMesh = new THREE.Mesh(coreBaseGeo, coreBaseMat);
      globeGroup.add(coreBaseMesh);

      // Core wireframe lattice (Cyan grid lines)
      const coreWireGeo = new THREE.IcosahedronGeometry(2.64, 2);
      const coreWireMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0284c7,
        wireframe: true,
        transparent: true,
        opacity: isDark ? 0.35 : 0.25,
        blending: THREE.AdditiveBlending
      });
      const coreWireMesh = new THREE.Mesh(coreWireGeo, coreWireMat);
      globeGroup.add(coreWireMesh);

      // Core points cloud (Lattice intersection nodes)
      const corePointsGeo = new THREE.IcosahedronGeometry(2.68, 3);
      const corePointsMat = new THREE.PointsMaterial({
        color: isDark ? 0xbae6fd : 0x38bdf8,
        size: 0.065,
        transparent: true,
        opacity: isDark ? 0.75 : 0.6,
        blending: THREE.AdditiveBlending
      });
      const corePointsMesh = new THREE.Points(corePointsGeo, corePointsMat);
      globeGroup.add(corePointsMesh);

      // Delicate Latitudinal & Longitudinal Circular Orbits
      const latRingGroup = new THREE.Group();
      for (let r = 0; r < 4; r++) {
        const rad = 2.75 + r * 0.25;
        const ringGeo = new THREE.RingGeometry(rad, rad + 0.02, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: r % 2 === 0 ? (isDark ? 0x38bdf8 : 0x0284c7) : (isDark ? 0xa855f7 : 0x7c3aed),
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * (0.25 * r);
        ring.rotation.y = Math.PI * (0.15 * r);
        latRingGroup.add(ring);
      }
      globeGroup.add(latRingGroup);

      // ========================================================================
      // 3. SEVEN SPECIALIZED AGENT ORBITAL NODES
      // ========================================================================
      // Agents: Orchestrator, Triage, Investigation, Policy, Action, Communication, Verification
      const agentDefs = [
        { name: 'Orchestrator', color: 0x38bdf8, angle: 0, rad: 4.8, y: 0.4 },
        { name: 'Triage', color: 0xf59e0b, angle: (Math.PI * 2 * 1) / 7, rad: 4.9, y: 0.1 },
        { name: 'Investigation', color: 0x60a5fa, angle: (Math.PI * 2 * 2) / 7, rad: 4.7, y: -0.3 },
        { name: 'Policy', color: 0x818cf8, angle: (Math.PI * 2 * 3) / 7, rad: 5.0, y: -0.1 },
        { name: 'Action', color: 0xf43f5e, angle: (Math.PI * 2 * 4) / 7, rad: 4.8, y: 0.2 },
        { name: 'Communication', color: 0x34d399, angle: (Math.PI * 2 * 5) / 7, rad: 4.6, y: 0.5 },
        { name: 'Verification', color: 0x10b981, angle: (Math.PI * 2 * 6) / 7, rad: 5.1, y: -0.2 }
      ];

      const agentNodes = [];
      const connectionLines = [];

      // Node Geometry & Materials
      const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const ringMarkerGeo = new THREE.RingGeometry(0.26, 0.32, 24);

      agentDefs.forEach((def, idx) => {
        const nodeContainer = new THREE.Group();
        const posX = Math.cos(def.angle) * def.rad;
        const posZ = Math.sin(def.angle) * def.rad;
        nodeContainer.position.set(posX, def.y, posZ);

        // Solid luminous sphere
        const nodeMat = new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.95
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeContainer.add(nodeMesh);

        // Orbital beacon ring
        const ringMarkerMat = new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const ringMarker = new THREE.Mesh(ringMarkerGeo, ringMarkerMat);
        ringMarker.rotation.x = Math.PI * 0.5;
        nodeContainer.add(ringMarker);

        globeGroup.add(nodeContainer);
        agentNodes.push({
          container: nodeContainer,
          mesh: nodeMesh,
          ring: ringMarker,
          def,
          idx,
          basePos: new THREE.Vector3(posX, def.y, posZ)
        });

        // Connection line between this agent node and the central core
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(posX * 0.6, def.y * 0.6, posZ * 0.6),
          new THREE.Vector3(posX, def.y, posZ)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: isDark ? 0.35 : 0.25,
          blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(lineGeo, lineMat);
        globeGroup.add(line);
        connectionLines.push({ line, def, idx });
      });

      // Inter-agent connection bridges (Orchestrator <-> Triage, Investigation <-> Policy, Action <-> Verification)
      const interBridges = [
        [0, 1], // Orchestrator -> Triage
        [1, 2], // Triage -> Investigation
        [2, 3], // Investigation -> Policy
        [3, 4], // Policy -> Action
        [4, 5], // Action -> Communication
        [5, 6], // Communication -> Verification
        [6, 0]  // Verification -> Orchestrator
      ];

      interBridges.forEach(([aIdx, bIdx]) => {
        const aNode = agentNodes[aIdx];
        const bNode = agentNodes[bIdx];
        const curve = new THREE.QuadraticBezierCurve3(
          aNode.basePos,
          new THREE.Vector3(
            (aNode.basePos.x + bNode.basePos.x) * 0.4,
            (aNode.basePos.y + bNode.basePos.y) * 0.4 + 0.4,
            (aNode.basePos.z + bNode.basePos.z) * 0.4
          ),
          bNode.basePos
        );
        const points = curve.getPoints(20);
        const bridgeGeo = new THREE.BufferGeometry().setFromPoints(points);
        const bridgeMat = new THREE.LineBasicMaterial({
          color: isDark ? 0x38bdf8 : 0x0284c7,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending
        });
        const bridgeLine = new THREE.Line(bridgeGeo, bridgeMat);
        globeGroup.add(bridgeLine);
      });

      // ========================================================================
      // 4. INCOMING CUSTOMER SIGNAL NODE (Perimeter Ingestion Stream)
      // ========================================================================
      const customerSignalGroup = new THREE.Group();
      customerSignalGroup.position.set(-6.2, 2.2, 1.8);

      const customerNodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const customerNodeMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95
      });
      const customerNode = new THREE.Mesh(customerNodeGeo, customerNodeMat);
      customerSignalGroup.add(customerNode);

      const customerHaloGeo = new THREE.RingGeometry(0.35, 0.45, 24);
      const customerHaloMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const customerHalo = new THREE.Mesh(customerHaloGeo, customerHaloMat);
      customerHalo.rotation.x = Math.PI * 0.5;
      customerSignalGroup.add(customerHalo);

      globeGroup.add(customerSignalGroup);

      // Arc from customer node to core
      const customerArcCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-6.2, 2.2, 1.8),
        new THREE.Vector3(-3.2, 1.8, 1.0),
        new THREE.Vector3(0, 0, 0)
      );
      const customerArcPoints = customerArcCurve.getPoints(30);
      const customerArcGeo = new THREE.BufferGeometry().setFromPoints(customerArcPoints);
      const customerArcMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const customerArcLine = new THREE.Line(customerArcGeo, customerArcMat);
      globeGroup.add(customerArcLine);

      // ========================================================================
      // 5. HUMAN-IN-THE-LOOP APPROVAL GATE RING (Visual Gating Barrier)
      // ========================================================================
      const approvalGateGeo = new THREE.TorusGeometry(0.65, 0.05, 16, 40);
      const approvalGateMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b, // Amber approval color
        transparent: true,
        opacity: 0.0, // Activated dynamically during Section 4
        blending: THREE.AdditiveBlending
      });
      const approvalGateMesh = new THREE.Mesh(approvalGateGeo, approvalGateMat);
      approvalGateMesh.position.set(
        agentNodes[4].basePos.x * 0.6,
        agentNodes[4].basePos.y * 0.6,
        agentNodes[4].basePos.z * 0.6
      );
      globeGroup.add(approvalGateMesh);

      // ========================================================================
      // 6. MOVING DATA PARTICLES / PACKET PULSES
      // ========================================================================
      const particleCount = isMobile ? 80 : 160;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleVelocities = [];

      for (let i = 0; i < particleCount; i++) {
        // Random spherical dispersion around nodes and along connection pathways
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 2.7 + Math.random() * 2.5;

        particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = radius * Math.cos(phi);

        particleVelocities.push({
          speed: 0.006 + Math.random() * 0.012,
          phase: Math.random() * Math.PI * 2,
          pathRadius: radius
        });
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: isDark ? 0x67e8f9 : 0x0284c7,
        size: isMobile ? 0.08 : 0.095,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
      });
      const particleSystem = new THREE.Points(particleGeo, particleMat);
      globeGroup.add(particleSystem);

      // ========================================================================
      // 7. LIGHTING SETUP
      // ========================================================================
      const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.2);
      scene.add(ambientLight);

      const cyanPoint = new THREE.PointLight(0x38bdf8, isDark ? 4.5 : 2.5, 30);
      cyanPoint.position.set(6, 6, 8);
      scene.add(cyanPoint);

      const purplePoint = new THREE.PointLight(0x818cf8, isDark ? 3.0 : 1.8, 30);
      purplePoint.position.set(-6, -6, 6);
      scene.add(purplePoint);

      const emeraldPoint = new THREE.PointLight(0x10b981, isDark ? 2.5 : 1.5, 25);
      emeraldPoint.position.set(0, 8, -4);
      scene.add(emeraldPoint);

      // ========================================================================
      // 8. POINTER PARALLAX & RESIZE LISTENERS
      // ========================================================================
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

      // ========================================================================
      // 9. CONTINUOUS SCROLL INTERPOLATION STATE
      // ========================================================================
      let curX = isMobile ? 0 : 3.6;
      let curY = isMobile ? 1.0 : 0.0;
      let curZ = isMobile ? -3.0 : -1.0;
      let curScale = isMobile ? 0.72 : 1.0;
      let curRotX = 0.2;
      let curRotY = 0.0;
      let curCorePulse = 1.0;

      const startTime = performance.now();

      // ========================================================================
      // 10. ANIMATION LOOP
      // ========================================================================
      if (prefersReducedMotion) {
        // Render single static posture
        globeGroup.position.set(curX, curY, curZ);
        globeGroup.scale.setScalar(curScale);
        renderer.render(scene, camera);
      } else {
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);

          const elapsed = (performance.now() - startTime) / 1000;
          const p = Math.max(0, Math.min(1, progressRef.current));

          // Smooth pointer interpolation
          mouseX += (targetMouseX - mouseX) * 0.05;
          mouseY += (targetMouseY - mouseY) * 0.05;

          // ====================================================================
          // CONTINUOUS SCROLL PHASES INTERPOLATION (0.0 → 1.0)
          // ====================================================================
          let targetX = 3.6;
          let targetY = 0.0;
          let targetZ = -1.0;
          let targetScale = 1.0;
          let targetRotSpeed = 0.003;
          let approvalGateOpacity = 0.0;
          let activeAgentIndex = 0;

          if (isMobile) {
            // Mobile: keep centered and adjust scale/height to avoid text collision
            targetX = 0;
            targetY = p < 0.12 ? 1.1 : p < 0.5 ? -1.0 : 0.5;
            targetZ = -4.0;
            targetScale = 0.65;
          } else {
            // Desktop: Orchestrated cinematic sequence across storytelling sections
            if (p < 0.12) {
              // Section 0: Hero (Right-center, subtle intro idling)
              targetX = 3.8;
              targetY = 0.2;
              targetZ = -1.2;
              targetScale = 1.0;
              activeAgentIndex = 0;
            } else if (p < 0.24) {
              // Section 1: Understand (Moves left, faces Customer Node stream)
              const t = (p - 0.12) / 0.12;
              targetX = 3.8 + (-3.2 - 3.8) * t;
              targetY = 0.2 + (0.1 - 0.2) * t;
              targetZ = -1.2 + (-0.8 - -1.2) * t;
              targetScale = 1.05;
              activeAgentIndex = 1;
            } else if (p < 0.38) {
              // Section 2: Orchestrate (Centers, tilts to expose full 7-agent constellation)
              const t = (p - 0.24) / 0.14;
              targetX = -3.2 + (0.0 - -3.2) * t;
              targetY = 0.1 + (-0.3 - 0.1) * t;
              targetZ = -0.8 + (0.5 - -0.8) * t;
              targetScale = 1.12;
              activeAgentIndex = 0;
            } else if (p < 0.50) {
              // Section 3: Reason / Policy (Shifts right, deep logic evaluation)
              const t = (p - 0.38) / 0.12;
              targetX = 0.0 + (3.4 - 0.0) * t;
              targetY = -0.3 + (0.2 - -0.3) * t;
              targetZ = 0.5 + (-0.5 - 0.5) * t;
              targetScale = 1.05;
              activeAgentIndex = 3; // Policy Agent
            } else if (p < 0.62) {
              // Section 4: Human-in-the-Loop Approval (Centers, slows down, amber gate lights up)
              const t = (p - 0.50) / 0.12;
              targetX = 3.4 + (0.0 - 3.4) * t;
              targetY = 0.2 + (0.4 - 0.2) * t;
              targetZ = -0.5 + (0.8 - -0.5) * t;
              targetScale = 1.15;
              targetRotSpeed = 0.0008; // Deliberate pause/slow state
              approvalGateOpacity = Math.sin(t * Math.PI) * 0.85;
              activeAgentIndex = 4; // Action Agent pausing for approval
            } else if (p < 0.74) {
              // Section 5: Execute (Shifts left, action pulse burst)
              const t = (p - 0.62) / 0.12;
              targetX = 0.0 + (-3.4 - 0.0) * t;
              targetY = 0.4 + (0.0 - 0.4) * t;
              targetZ = 0.8 + (-0.4 - 0.8) * t;
              targetScale = 1.05;
              activeAgentIndex = 4;
            } else if (p < 0.84) {
              // Section 6: Communicate (Shifts right, outbound waves)
              const t = (p - 0.74) / 0.10;
              targetX = -3.4 + (3.2 - -3.4) * t;
              targetY = 0.0 + (0.2 - 0.0) * t;
              targetZ = -0.4 + (-0.6 - -0.4) * t;
              targetScale = 1.0;
              activeAgentIndex = 5; // Communication Agent
            } else if (p < 0.94) {
              // Section 7: Verify (Centers, emerald harmonic resolution)
              const t = (p - 0.84) / 0.10;
              targetX = 3.2 + (0.0 - 3.2) * t;
              targetY = 0.2 + (-0.1 - 0.2) * t;
              targetZ = -0.6 + (0.2 - -0.6) * t;
              targetScale = 1.08;
              activeAgentIndex = 6; // Verification Agent
            } else {
              // Final Section / CTA (Center calm majestic posture)
              targetX = 0.0;
              targetY = -0.4;
              targetZ = -1.0;
              targetScale = 1.0;
              activeAgentIndex = 0;
            }
          }

          // Smooth lerp transformations for zero snapping/jitter
          curX += (targetX - curX) * 0.06;
          curY += (targetY - curY) * 0.06;
          curZ += (targetZ - curZ) * 0.06;
          curScale += (targetScale - curScale) * 0.06;

          globeGroup.position.set(curX - mouseX * 0.35, curY - mouseY * 0.25, curZ);
          globeGroup.scale.setScalar(curScale);

          // Continuous subtle rotation
          curRotY += targetRotSpeed;
          globeGroup.rotation.y = curRotY + mouseX * 0.15;
          globeGroup.rotation.x = curRotX + mouseY * 0.1;

          // Counter-rotate latitudinal rings for gyroscopic motion
          latRingGroup.rotation.y -= 0.004;
          latRingGroup.rotation.z += 0.002;
          outerRing.rotation.z += 0.0015;

          // Pulse Core Wireframe
          curCorePulse = 1.0 + Math.sin(elapsed * 2.2) * 0.04;
          coreWireMesh.scale.setScalar(curCorePulse);

          // Customer Signal Stream Pulse
          const custPulse = 1.0 + Math.sin(elapsed * 4.0) * 0.2;
          customerHalo.scale.setScalar(custPulse);
          customerNode.scale.setScalar(0.9 + Math.sin(elapsed * 3.5) * 0.15);

          // Approval Gate Mesh dynamic state
          approvalGateMat.opacity += (approvalGateOpacity - approvalGateMat.opacity) * 0.1;
          approvalGateMesh.rotation.z += 0.02;

          // Dynamic Agent Node Pulsing & Ring Expansions
          agentNodes.forEach((node, i) => {
            const isActive = i === activeAgentIndex;
            const targetScale = isActive ? 1.45 : 1.0;
            const targetRingOpacity = isActive ? 0.95 : 0.35;

            node.container.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            node.ring.material.opacity += (targetRingOpacity - node.ring.material.opacity) * 0.1;
            node.ring.rotation.z += isActive ? 0.04 : 0.01;
          });

          // Animate Traveling Data Particles
          const positions = particleGeo.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            const vel = particleVelocities[i];
            vel.phase += vel.speed;

            // Oscillate radius with phase
            const r = vel.pathRadius + Math.sin(vel.phase + elapsed * 1.5) * 0.25;
            const idx3 = i * 3;
            const len = Math.sqrt(
              positions[idx3] * positions[idx3] +
              positions[idx3 + 1] * positions[idx3 + 1] +
              positions[idx3 + 2] * positions[idx3 + 2]
            ) || 1;

            positions[idx3] = (positions[idx3] / len) * r;
            positions[idx3 + 1] = (positions[idx3 + 1] / len) * r;
            positions[idx3 + 2] = (positions[idx3 + 2] / len) * r;
          }
          particleGeo.attributes.position.needsUpdate = true;

          // Camera target tracking
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
        };

        animate();
      }

      // Cleanup
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);

        if (currentMount && renderer && renderer.domElement && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }

        try {
          haloGeo.dispose();
          haloMat.dispose();
          outerRingGeo.dispose();
          outerRingMat.dispose();
          coreBaseGeo.dispose();
          coreBaseMat.dispose();
          coreWireGeo.dispose();
          coreWireMat.dispose();
          corePointsGeo.dispose();
          corePointsMat.dispose();
          particleGeo.dispose();
          particleMat.dispose();
          approvalGateGeo.dispose();
          approvalGateMat.dispose();
          if (renderer) renderer.dispose();
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (err) {
      console.warn('Three.js Globe initialization failed, falling back to CSS AI Core:', err);
      setWebglFailed(true);
    }
  }, [isDark, isMobile]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Graceful Fallback if WebGL is unavailable */}
      {webglFailed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isDark
              ? 'radial-gradient(circle at 65% 45%, rgba(56, 189, 248, 0.15) 0%, rgba(129, 140, 248, 0.1) 40%, transparent 70%)'
              : 'radial-gradient(circle at 65% 45%, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '35%',
              right: '20%',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 0 60px rgba(56, 189, 248, 0.2)',
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
        </div>
      )}
    </div>
  );
}
