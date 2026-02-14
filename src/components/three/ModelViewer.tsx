'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingModel, WallSegment, FloorSlab, RoofPlane, SiteElement } from '@/lib/services/model-generator';

// ── Material palette ───────────────────────────────────────────────

interface MaterialPalette {
    exteriorWall: THREE.MeshStandardMaterial;
    interiorWall: THREE.MeshStandardMaterial;
    floor: THREE.MeshStandardMaterial;
    foundation: THREE.MeshStandardMaterial;
    roof: THREE.MeshStandardMaterial;
    glass: THREE.MeshPhysicalMaterial;
    door: THREE.MeshStandardMaterial;
    driveway: THREE.MeshStandardMaterial;
    walkway: THREE.MeshStandardMaterial;
    deck: THREE.MeshStandardMaterial;
    patio: THREE.MeshStandardMaterial;
    propertyLine: THREE.MeshStandardMaterial;
    ground: THREE.MeshStandardMaterial;
    accent: THREE.MeshStandardMaterial;
}

function createMaterials(brandColor: string): MaterialPalette {
    const brand = new THREE.Color(brandColor);
    return {
        exteriorWall: new THREE.MeshStandardMaterial({ color: 0xf0ece6, roughness: 0.85, metalness: 0.05 }),
        interiorWall: new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
        floor: new THREE.MeshStandardMaterial({ color: 0xd4c8b0, roughness: 0.6, metalness: 0.05 }),
        foundation: new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.95, metalness: 0.1 }),
        roof: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.3 }),
        glass: new THREE.MeshPhysicalMaterial({
            color: 0x88ccee,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.7,
            thickness: 0.1,
            transparent: true,
            opacity: 0.4,
        }),
        door: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6, metalness: 0.1 }),
        driveway: new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.9, metalness: 0.05 }),
        walkway: new THREE.MeshStandardMaterial({ color: 0xb0a89a, roughness: 0.8, metalness: 0.05 }),
        deck: new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7, metalness: 0.05 }),
        patio: new THREE.MeshStandardMaterial({ color: 0xa09080, roughness: 0.8, metalness: 0.05 }),
        propertyLine: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, transparent: true, opacity: 0.15 }),
        ground: new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.95 }),
        accent: new THREE.MeshStandardMaterial({ color: brand, roughness: 0.4, metalness: 0.6 }),
    };
}

// ── Wall Mesh ──────────────────────────────────────────────────────

function WallMesh({ wall, materials, offset }: {
    wall: WallSegment;
    materials: MaterialPalette;
    offset: [number, number, number];
}) {
    const group = useRef<THREE.Group>(null);

    const wallGeometry = useMemo(() => {
        const dx = wall.end[0] - wall.start[0];
        const dz = wall.end[1] - wall.start[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);

        const shapes: { geo: THREE.BufferGeometry; mat: THREE.Material; pos: [number, number, number]; rot: [number, number, number] }[] = [];

        // Main wall body
        const wallShape = new THREE.Shape();
        wallShape.moveTo(0, 0);
        wallShape.lineTo(length, 0);
        wallShape.lineTo(length, wall.height);
        wallShape.lineTo(0, wall.height);
        wallShape.closePath();

        // Cut openings by creating holes
        for (const opening of wall.openings) {
            const cx = opening.position * length;
            const halfW = opening.width / 2;
            const left = Math.max(0.1, cx - halfW);
            const right = Math.min(length - 0.1, cx + halfW);

            const hole = new THREE.Path();
            hole.moveTo(left, opening.sillHeight);
            hole.lineTo(right, opening.sillHeight);
            hole.lineTo(right, opening.sillHeight + opening.height);
            hole.lineTo(left, opening.sillHeight + opening.height);
            hole.closePath();
            wallShape.holes.push(hole);

            // Add glass/door fill
            const fillW = right - left;
            const fillH = opening.height;
            const fillGeo = new THREE.BoxGeometry(fillW, fillH, 0.05);
            const fillMat = opening.type === 'window' ? 'glass' : 'door';

            shapes.push({
                geo: fillGeo,
                mat: materials[fillMat === 'glass' ? 'glass' : 'door'],
                pos: [
                    (left + right) / 2,
                    opening.sillHeight + fillH / 2,
                    0,
                ],
                rot: [0, 0, 0],
            });
        }

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: wall.thickness,
            bevelEnabled: false,
        };

        const wallGeo = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);

        return { wallGeo, fills: shapes, length, angle };
    }, [wall, materials]);

    const centerX = offset[0] + wall.start[0];
    const centerZ = offset[2] + wall.start[1];

    return (
        <group
            ref={group}
            position={[centerX, offset[1], centerZ]}
            rotation={[0, -wallGeometry.angle, 0]}
        >
            <mesh
                geometry={wallGeometry.wallGeo}
                material={wall.isExterior ? materials.exteriorWall : materials.interiorWall}
                castShadow
                receiveShadow
                rotation={[Math.PI / 2, 0, 0]}
            />
            {wallGeometry.fills.map((fill, i) => (
                <mesh
                    key={i}
                    geometry={fill.geo}
                    material={fill.mat}
                    position={[fill.pos[0], fill.pos[1], wall.thickness / 2]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            ))}
        </group>
    );
}

// ── Floor Mesh ─────────────────────────────────────────────────────

function FloorMesh({ slab, materials, offset }: {
    slab: FloorSlab;
    materials: MaterialPalette;
    offset: [number, number, number];
}) {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const v = slab.vertices;
        shape.moveTo(v[0][0], v[0][1]);
        for (let i = 1; i < v.length; i++) {
            shape.lineTo(v[i][0], v[i][1]);
        }
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: slab.thickness, bevelEnabled: false });
    }, [slab]);

    const mat = slab.id === 'foundation' ? materials.foundation : materials.floor;

    return (
        <mesh
            geometry={geometry}
            material={mat}
            position={[offset[0], offset[1] + slab.elevation, offset[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            castShadow
        />
    );
}

// ── Roof Mesh ──────────────────────────────────────────────────────

function RoofMesh({ plane, materials, offset }: {
    plane: RoofPlane;
    materials: MaterialPalette;
    offset: [number, number, number];
}) {
    const geometry = useMemo(() => {
        const verts = plane.vertices;
        const geo = new THREE.BufferGeometry();

        if (verts.length === 4) {
            // Quad — split into two triangles
            const positions = new Float32Array([
                verts[0][0], verts[0][1], verts[0][2],
                verts[1][0], verts[1][1], verts[1][2],
                verts[2][0], verts[2][1], verts[2][2],
                verts[0][0], verts[0][1], verts[0][2],
                verts[2][0], verts[2][1], verts[2][2],
                verts[3][0], verts[3][1], verts[3][2],
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        } else if (verts.length === 3) {
            const positions = new Float32Array([
                verts[0][0], verts[0][1], verts[0][2],
                verts[1][0], verts[1][1], verts[1][2],
                verts[2][0], verts[2][1], verts[2][2],
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        }

        geo.computeVertexNormals();
        return geo;
    }, [plane]);

    return (
        <mesh
            geometry={geometry}
            material={materials.roof}
            position={[offset[0], offset[1], offset[2]]}
            castShadow
            receiveShadow
        />
    );
}

// ── Site Element Mesh ──────────────────────────────────────────────

function SiteElementMesh({ element, materials, offset }: {
    element: SiteElement;
    materials: MaterialPalette;
    offset: [number, number, number];
}) {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const v = element.vertices;
        shape.moveTo(v[0][0], v[0][1]);
        for (let i = 1; i < v.length; i++) {
            shape.lineTo(v[i][0], v[i][1]);
        }
        shape.closePath();

        const thickness = element.type === 'property_line' ? 0.01 : element.type === 'deck' ? 0.5 : 0.15;
        return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    }, [element]);

    const matKey = element.type === 'property_line' ? 'propertyLine' : element.type;
    const mat = materials[matKey as keyof MaterialPalette] || materials.walkway;
    const elevation = element.type === 'deck' ? 0.5 : element.type === 'property_line' ? 0.02 : 0.05;

    return (
        <mesh
            geometry={geometry}
            material={mat as THREE.MeshStandardMaterial}
            position={[offset[0], offset[1] + elevation, offset[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        />
    );
}

// ── Animated scene rotation ────────────────────────────────────────

function AutoRotate({ enabled }: { enabled: boolean }) {
    const { camera } = useThree();
    const angleRef = useRef(0);

    useFrame((_, delta) => {
        if (!enabled) return;
        angleRef.current += delta * 0.15;
    });

    return null;
}

// ── Ground Plane ───────────────────────────────────────────────────

function Ground({ size }: { size: number }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial color="#3a5a32" roughness={0.95} />
        </mesh>
    );
}

// ── Main Viewer Component ──────────────────────────────────────────

interface ModelViewerProps {
    model: BuildingModel;
    brandColor: string;
    autoRotate?: boolean;
    wireframe?: boolean;
    showGrid?: boolean;
    cutaway?: boolean;
}

export default function ModelViewer({
    model,
    brandColor,
    autoRotate = false,
    wireframe = false,
    showGrid = true,
    cutaway = false,
}: ModelViewerProps) {
    const materials = useMemo(() => createMaterials(brandColor), [brandColor]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Center the model
    const offset: [number, number, number] = useMemo(() => [
        -model.boundingBox.width / 2,
        0,
        -model.boundingBox.depth / 2,
    ], [model.boundingBox]);

    // Camera distance based on model size
    const maxDim = Math.max(model.boundingBox.width, model.boundingBox.depth, model.boundingBox.height);
    const camDist = maxDim * 1.6;

    // Apply wireframe toggle
    useEffect(() => {
        Object.values(materials).forEach(mat => {
            if ('wireframe' in mat) {
                (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
            }
        });
    }, [wireframe, materials]);

    if (!mounted) {
        return (
            <div className="w-full h-full bg-[#0a0a0a] rounded-3xl flex items-center justify-center">
                <div className="text-white/20 text-sm">Initializing 3D Engine...</div>
            </div>
        );
    }

    // Filter walls for cutaway
    const visibleWalls = cutaway
        ? model.walls.filter(w => {
            // Show only front and left walls for cutaway
            if (!w.isExterior) return true;
            const isFront = w.id.includes('front') || w.id.includes('left');
            return !isFront;
        })
        : model.walls;

    return (
        <Canvas
            shadows
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            style={{ background: '#0a0a0a' }}
        >
            <PerspectiveCamera
                makeDefault
                position={[camDist * 0.7, camDist * 0.5, camDist * 0.7]}
                fov={40}
                near={0.1}
                far={1000}
            />

            <OrbitControls
                autoRotate={autoRotate}
                autoRotateSpeed={0.5}
                enableDamping
                dampingFactor={0.05}
                minDistance={10}
                maxDistance={200}
                maxPolarAngle={Math.PI / 2.1}
            />

            {/* Lighting */}
            <ambientLight intensity={0.35} />
            <directionalLight
                position={[40, 60, 30]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={200}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
            />
            <directionalLight position={[-20, 30, -10]} intensity={0.3} />
            <hemisphereLight args={['#b1e1ff', '#3a5a32', 0.5]} />

            {/* Ground */}
            <Ground size={200} />

            {showGrid && (
                <Grid
                    args={[200, 200]}
                    cellSize={1}
                    cellThickness={0.3}
                    cellColor="#ffffff"
                    sectionSize={10}
                    sectionThickness={0.8}
                    sectionColor={brandColor}
                    fadeDistance={80}
                    position={[0, 0.02, 0]}
                />
            )}

            <ContactShadows
                position={[0, 0, 0]}
                opacity={0.4}
                scale={100}
                blur={2}
                far={20}
            />

            {/* Building geometry */}
            <group>
                {/* Floors */}
                {model.floors.map(slab => (
                    <FloorMesh key={slab.id} slab={slab} materials={materials} offset={offset} />
                ))}

                {/* Walls */}
                {visibleWalls.map(wall => (
                    <WallMesh key={wall.id} wall={wall} materials={materials} offset={offset} />
                ))}

                {/* Roof */}
                {model.roofPlanes.map(plane => (
                    <RoofMesh key={plane.id} plane={plane} materials={materials} offset={offset} />
                ))}

                {/* Site Elements */}
                {model.siteElements.map((elem, idx) => (
                    <SiteElementMesh key={idx} element={elem} materials={materials} offset={offset} />
                ))}
            </group>

            {/* Fog for atmosphere */}
            <fog attach="fog" args={['#0a0a0a', 80, 200]} />
        </Canvas>
    );
}
