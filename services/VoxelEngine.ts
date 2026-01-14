/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData, MapTheme, Particle } from '../types';
import { CONFIG, MAP_CONFIGS } from '../utils/voxelConstants';

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private floor: THREE.Mesh | null = null;
  private currentMap: MapTheme = 'ARENA';
  
  // Shield Meshes
  private shieldGroup0: THREE.Mesh | null = null;
  private shieldGroup1: THREE.Mesh | null = null;
  
  // Particle System
  private particleMesh: THREE.InstancedMesh | null = null;
  private particles: Particle[] = [];
  private MAX_PARTICLES = 200;

  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private rebuildStartTime: number = 0;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;

  // Animation/Combat effects
  private groupFlashTime: Map<number, {time: number, color: THREE.Color}> = new Map(); 
  private groupOffsets: Map<number, THREE.Vector3> = new Map(); 
  private groupShieldTime: Map<number, number> = new Map(); 
  
  private shakeIntensity = 0;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

    // Init Three.js
    this.scene = new THREE.Scene();
    this.setEnvironment('ARENA'); 

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 30, 80); 

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = false; 
    this.controls.target.set(0, 5, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    this.initShields();
    this.initParticles();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  private initShields() {
      const shieldGeo = new THREE.SphereGeometry(14, 32, 32);
      const shieldMat = new THREE.MeshStandardMaterial({
          color: 0x00aaff,
          transparent: true,
          opacity: 0.0,
          roughness: 0.1,
          metalness: 0.8,
          side: THREE.DoubleSide
      });

      this.shieldGroup0 = new THREE.Mesh(shieldGeo, shieldMat.clone());
      this.shieldGroup0.position.set(-12, 5, 0); 
      this.scene.add(this.shieldGroup0);

      this.shieldGroup1 = new THREE.Mesh(shieldGeo, shieldMat.clone());
      this.shieldGroup1.position.set(12, 5, 0); 
      this.scene.add(this.shieldGroup1);
  }

  private initParticles() {
      const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.particleMesh = new THREE.InstancedMesh(geo, mat, this.MAX_PARTICLES);
      this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(this.particleMesh);

      for(let i=0; i<this.MAX_PARTICLES; i++) {
          this.particles.push({
              active: false,
              x: 0, y: 0, z: 0,
              vx: 0, vy: 0, vz: 0,
              color: new THREE.Color(),
              life: 0
          });
      }
  }

  public setEnvironment(map: MapTheme) {
      this.currentMap = map;
      const config = MAP_CONFIGS[map];
      this.scene.background = new THREE.Color(config.bgColor);
      this.scene.fog = new THREE.Fog(config.fogColor, 60, 140);
      
      if (this.floor) this.scene.remove(this.floor);
      
      const planeMat = new THREE.MeshStandardMaterial({ 
          color: config.floorColor, 
          roughness: 1,
          metalness: map === 'SPACE' ? 0.5 : 0.1 
      });
      this.floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), planeMat);
      this.floor.rotation.x = -Math.PI / 2;
      this.floor.position.y = CONFIG.FLOOR_Y;
      this.floor.receiveShadow = true;
      this.scene.add(this.floor);
  }

  // Visual Effect for Ultimate
  public triggerUltimateEffect() {
    // 1. Change Background to Dark Violet/Black
    this.scene.background = new THREE.Color(0x1a0520);
    this.scene.fog = new THREE.Fog(0x1a0520, 20, 100);
    
    // 2. Heavy Shake
    this.shakeIntensity = 2.0;

    // 3. Revert after 1 second
    setTimeout(() => {
        this.setEnvironment(this.currentMap);
    }, 1000);
  }

  // Combat Animations
  public triggerAttack(groupId: number, isSpecial: boolean = false) {
      const direction = groupId === 0 ? 1 : -1; 
      const dist = isSpecial ? 15 : 8;
      this.groupOffsets.set(groupId, new THREE.Vector3(direction * dist, 0, 0));
      
      if (isSpecial) {
           this.groupFlashTime.set(groupId, { time: Date.now(), color: new THREE.Color(0xFFD700) }); // Gold flash
           this.triggerUltimateEffect();
      }
  }

  public triggerDefend(groupId: number) {
      this.groupFlashTime.set(groupId, { time: Date.now(), color: new THREE.Color(0x3b82f6) }); 
      this.groupShieldTime.set(groupId, Date.now());
  }

  public triggerDamage(groupId: number, isCrit: boolean = false) {
      // Impact Flash
      const color = isCrit ? new THREE.Color(0xff0000) : new THREE.Color(0xffffff);
      this.groupFlashTime.set(groupId, { time: Date.now(), color: color });
      
      // Shake Camera
      this.shakeIntensity = isCrit ? 1.5 : 0.8;

      // Model Shake
      const force = isCrit ? 2 : 1;
      this.groupOffsets.set(groupId, new THREE.Vector3((Math.random()-0.5)*2*force, 1*force, (Math.random()-0.5)*2*force));
      
      // Red flash follow up
      setTimeout(() => {
          this.groupFlashTime.set(groupId, { time: Date.now(), color: new THREE.Color(0xef4444) }); 
      }, 50);

      // Spawn Debris
      const center = groupId === 0 ? new THREE.Vector3(-12, 5, 0) : new THREE.Vector3(12, 5, 0);
      this.spawnDebris(center, isCrit ? 15 : 8);
  }

  private spawnDebris(pos: THREE.Vector3, count: number) {
      let spawned = 0;
      for (let p of this.particles) {
          if (!p.active && spawned < count) {
              p.active = true;
              p.life = 1.0;
              p.x = pos.x + (Math.random() - 0.5) * 4;
              p.y = pos.y + (Math.random() - 0.5) * 6;
              p.z = pos.z + (Math.random() - 0.5) * 4;
              p.vx = (Math.random() - 0.5) * 1;
              p.vy = Math.random() * 1;
              p.vz = (Math.random() - 0.5) * 1;
              // Random debris color (grey/red/white)
              const rnd = Math.random();
              if (rnd > 0.6) p.color.setHex(0xef4444);
              else if (rnd > 0.3) p.color.setHex(0xcccccc);
              else p.color.setHex(0x333333);
              
              spawned++;
          }
      }
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
    
    // Reset shields
    if (this.shieldGroup0) {
        (this.shieldGroup0.material as THREE.MeshStandardMaterial).opacity = 0;
        this.shieldGroup0.scale.setScalar(1);
    }
    if (this.shieldGroup1) {
        (this.shieldGroup1.material as THREE.MeshStandardMaterial).opacity = 0;
        this.shieldGroup1.scale.setScalar(1);
    }
    
    // Reset particles
    this.particles.forEach(p => p.active = false);
  }

  private createVoxels(data: VoxelData[]) {
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      if (Array.isArray(this.instanceMesh.material)) {
          this.instanceMesh.material.forEach(m => m.dispose());
      } else {
          this.instanceMesh.material.dispose();
      }
    }

    this.voxels = data.map((v, i) => {
        const c = new THREE.Color(v.color);
        c.offsetHSL(0, 0, (Math.random() * 0.1) - 0.05);
        
        const groupId = v.x < 0 ? 0 : 1;

        return {
            id: i,
            groupId, 
            x: v.x, y: v.y, z: v.z, color: c,
            isDismantled: false, 
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    });

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 });
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instanceMesh.castShadow = true;
    this.instanceMesh.receiveShadow = true;
    this.scene.add(this.instanceMesh);

    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    
    const now = Date.now();
    const flashDuration = 250; 
    const shieldDuration = 800;

    // Camera Shake
    if (this.shakeIntensity > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity *= 0.9;
        if (this.shakeIntensity < 0.1) {
            this.shakeIntensity = 0;
            // Snap back x slightly, but maintain Orbit controls Y/Z mainly
            this.camera.position.x = this.camera.position.x * 0.9; 
        }
    }

    // Update group animations (decay offsets)
    this.groupOffsets.forEach((vec, gid) => {
        vec.multiplyScalar(0.9); 
        if (vec.lengthSq() < 0.05) this.groupOffsets.delete(gid);
    });
    
    // Update Shields
    [this.shieldGroup0, this.shieldGroup1].forEach((shield, i) => {
        if (!shield) return;
        const activationTime = this.groupShieldTime.get(i);
        const mat = shield.material as THREE.MeshStandardMaterial;
        
        if (activationTime && now - activationTime < shieldDuration) {
            const progress = (now - activationTime) / shieldDuration;
            const opacity = Math.sin(progress * Math.PI) * 0.4;
            mat.opacity = Math.max(0, opacity);
            shield.rotation.y += 0.05;
            shield.rotation.z += 0.02;
            const scalePulse = 1 + Math.sin(now * 0.01) * 0.05;
            shield.scale.setScalar(scalePulse);
        } else {
            mat.opacity = 0;
        }
    });

    // Update Particles
    if (this.particleMesh) {
        let activeCount = 0;
        this.particles.forEach((p, i) => {
            if (p.active) {
                p.vy -= 0.05; // Gravity
                p.x += p.vx; p.y += p.vy; p.z += p.vz;
                p.life -= 0.02;
                if (p.life <= 0 || p.y < CONFIG.FLOOR_Y) p.active = false;
                
                this.dummy.position.set(p.x, p.y, p.z);
                const s = p.life; 
                this.dummy.scale.set(s, s, s);
                this.dummy.updateMatrix();
                this.particleMesh!.setMatrixAt(i, this.dummy.matrix);
                this.particleMesh!.setColorAt(i, p.color);
                activeCount++;
            } else {
                 this.dummy.scale.set(0,0,0);
                 this.dummy.updateMatrix();
                 this.particleMesh!.setMatrixAt(i, this.dummy.matrix);
            }
        });
        this.particleMesh.instanceMatrix.needsUpdate = true;
        
        // Fix: Check if instanceColor exists before updating
        if (this.particleMesh.instanceColor) {
            this.particleMesh.instanceColor.needsUpdate = true;
        }
    }

    // Draw Voxels
    this.voxels.forEach((v, i) => {
        let tx = v.x;
        let ty = v.y;
        let tz = v.z;

        if (!v.isDismantled) {
            const offset = this.groupOffsets.get(v.groupId);
            if (offset) {
                tx += offset.x;
                ty += offset.y;
                tz += offset.z;
            }
        }

        this.dummy.position.set(tx, ty, tz);
        this.dummy.rotation.set(v.rx, v.ry, v.rz);
        this.dummy.scale.set(1,1,1);
        this.dummy.updateMatrix();
        this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);

        // Handle Hit Flash
        const groupFlash = this.groupFlashTime.get(v.groupId);
        if (groupFlash && now - groupFlash.time < flashDuration && !v.isDismantled) {
             this.instanceMesh!.setColorAt(i, groupFlash.color);
        } else {
             this.instanceMesh!.setColorAt(i, v.color);
        }
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
    
    // Fix: Check if instanceColor exists before updating
    if (this.instanceMesh.instanceColor) {
        this.instanceMesh.instanceColor.needsUpdate = true;
    }
  }

  // Trigger physics for a specific group (DEATH)
  public dismantleGroup(targetGroupId: number) {
    this.voxels.forEach(v => {
        if (v.groupId === targetGroupId) {
            v.isDismantled = true; // Enable physics for these blocks
            v.vx = (Math.random() - 0.5) * 2;
            v.vy = Math.random() * 1.5;
            v.vz = (Math.random() - 0.5) * 2;
            v.rvx = (Math.random() - 0.5) * 0.4;
            v.rvy = (Math.random() - 0.5) * 0.4;
            v.rvz = (Math.random() - 0.5) * 0.4;
        }
    });
    
    // Hide shield if dismantling
    if (targetGroupId === 0 && this.shieldGroup0) (this.shieldGroup0.material as THREE.MeshStandardMaterial).opacity = 0;
    if (targetGroupId === 1 && this.shieldGroup1) (this.shieldGroup1.material as THREE.MeshStandardMaterial).opacity = 0;
  }

  private getColorDist(c1: THREE.Color, hex2: number): number {
    const c2 = new THREE.Color(hex2);
    const r = (c1.r - c2.r) * 0.3;
    const g = (c1.g - c2.g) * 0.59;
    const b = (c1.b - c2.b) * 0.11;
    return Math.sqrt(r * r + g * g + b * b);
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;
    
    this.groupOffsets.clear();
    this.groupFlashTime.clear();

    const available = this.voxels.map((v, i) => ({ index: i, color: v.color, taken: false }));
    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);

    targetModel.forEach(target => {
        let bestDist = 9999;
        let bestIdx = -1;

        for (let i = 0; i < available.length; i++) {
            if (available[i].taken) continue;
            const d = this.getColorDist(available[i].color, target.color);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
                if (d < 0.01) break; 
            }
        }

        if (bestIdx !== -1) {
            available[bestIdx].taken = true;
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
            mappings[available[bestIdx].index] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 800
            };
        }
    });

    for (let i = 0; i < this.voxels.length; i++) {
        if (!mappings[i]) {
            mappings[i] = {
                x: this.voxels[i].x, y: this.voxels[i].y, z: this.voxels[i].z,
                isRubble: true, delay: 0
            };
        }
    }

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    const floorY = CONFIG.FLOOR_Y + 0.5;

    // Only apply physics to blocks that are explicitly dismantled
    if (this.state === AppState.STABLE) {
        this.voxels.forEach(v => {
            if (v.isDismantled) {
                v.vy -= 0.04; // Gravity
                v.x += v.vx; v.y += v.vy; v.z += v.vz;
                v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

                if (v.y < floorY) {
                    v.y = floorY;
                    v.vy *= -0.55; // Bounce
                    v.vx *= 0.85; // Friction
                    v.vz *= 0.85;
                    v.rvx *= 0.8; v.rvy *= 0.8; v.rvz *= 0.8;
                }
            }
        });
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;

        this.voxels.forEach((v, i) => {
            const t = this.rebuildTargets[i];
            if (t.isRubble) return;

            if (elapsed < t.delay) {
                allDone = false;
                return;
            }

            const speed = 0.12;
            v.x += (t.x - v.x) * speed;
            v.y += (t.y - v.y) * speed;
            v.z += (t.z - v.z) * speed;
            // Also reset rotations
            v.rx += (0 - v.rx) * speed;
            v.ry += (0 - v.ry) * speed;
            v.rz += (0 - v.rz) * speed;
            
            // Reset Physics state
            v.isDismantled = false;
            v.vx = 0; v.vy = 0; v.vz = 0;

            if ((t.x - v.x) ** 2 + (t.y - v.y) ** 2 + (t.z - v.z) ** 2 > 0.01) {
                allDone = false;
            } else {
                v.x = t.x; v.y = t.y; v.z = t.z;
                v.rx = 0; v.ry = 0; v.rz = 0;
            }
        });

        if (allDone) {
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
        }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    this.draw();
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
  }
  
  public setAutoRotate(enabled: boolean) {
    if (this.controls) {
        this.controls.autoRotate = enabled;
    }
  }

  public getJsonData(): string {
      const data = this.voxels.map((v, i) => ({
          id: i,
          x: +v.x.toFixed(2),
          y: +v.y.toFixed(2),
          z: +v.z.toFixed(2),
          c: '#' + v.color.getHexString()
      }));
      return JSON.stringify(data, null, 2);
  }
  
  public getUniqueColors(): string[] {
    const colors = new Set<string>();
    this.voxels.forEach(v => {
        colors.add('#' + v.color.getHexString());
    });
    return Array.from(colors);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}