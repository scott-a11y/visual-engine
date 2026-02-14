/**
 * Procedural 3D Model Generator
 * Converts PlanAnalysisResult metadata into Three.js geometry definitions.
 *
 * This is a CLIENT-SIDE module — it produces plain data structures
 * that the Three.js React component consumes.
 *
 * All dimensions are in FEET (matching architectural convention).
 * The Three.js scene uses 1 unit = 1 foot.
 */

import type { PlanAnalysisResult, RoomAnalysis, RoofType, ArchitecturalStyle } from '../types/plan-analysis';

// ── Geometry data types consumed by the 3D viewer ──────────────────
export interface WallSegment {
    id: string;
    start: [number, number];   // [x, z] in plan view
    end: [number, number];
    height: number;            // feet
    thickness: number;         // feet (0.5 = 6", 0.333 = 4")
    isExterior: boolean;
    floor: number;             // 0-based floor index
    openings: WallOpening[];
}

export interface WallOpening {
    type: 'door' | 'window';
    position: number;          // 0-1 normalized along wall length
    width: number;             // feet
    height: number;            // feet
    sillHeight: number;        // feet from floor
}

export interface FloorSlab {
    id: string;
    vertices: [number, number][]; // [x, z] polygon outline
    elevation: number;            // height offset
    thickness: number;            // feet
}

export interface RoofPlane {
    id: string;
    vertices: [number, number, number][]; // [x, y, z] 3D points
    overhang: number;
}

export interface SiteElement {
    type: 'driveway' | 'walkway' | 'patio' | 'deck' | 'property_line';
    vertices: [number, number][];
}

export interface BuildingModel {
    walls: WallSegment[];
    floors: FloorSlab[];
    roofPlanes: RoofPlane[];
    siteElements: SiteElement[];
    boundingBox: { width: number; depth: number; height: number };
    metadata: {
        style: string;
        stories: number;
        totalSqFt: number;
    };
}

// ── Constants ──────────────────────────────────────────────────────
const EXTERIOR_WALL_THICKNESS = 0.5;     // 6 inches
const INTERIOR_WALL_THICKNESS = 0.333;   // 4 inches
const FOUNDATION_THICKNESS = 0.667;      // 8 inches
const FLOOR_SLAB_THICKNESS = 0.333;      // 4 inches
const FOUNDATION_DEPTH = 1.5;            // 18 inches below grade

// Height profiles by story
const STORY_HEIGHTS: Record<number, number[]> = {
    1: [9.5],
    2: [9.5, 8.5],
    3: [9.5, 9, 8.5],
};

// Roof pitch by style (rise/run)
const STYLE_PITCH: Partial<Record<ArchitecturalStyle, number>> = {
    modern: 2 / 12,
    contemporary: 3 / 12,
    craftsman: 5 / 12,
    farmhouse: 7 / 12,
    modern_farmhouse: 7 / 12,
    traditional: 6 / 12,
    colonial: 8 / 12,
    'mid-century': 2 / 12,
    ranch: 4 / 12,
    bungalow: 5 / 12,
    victorian: 10 / 12,
    mediterranean: 4 / 12,
    industrial: 1 / 12,
    northwest_contemporary: 4 / 12,
};

// Overhang by regional style
const PNW_OVERHANG = 3;   // 36 inches — deep overhangs for rain
const DEFAULT_OVERHANG = 2; // 24 inches

// ── Parse helpers ──────────────────────────────────────────────────

/** Parse "24' x 18'" → [24, 18] */
function parseDimensions(dim: string | null): [number, number] | null {
    if (!dim) return null;
    const matches = dim.match(/([\d.]+)\s*['']\s*x\s*([\d.]+)\s*['']/i);
    if (matches) return [parseFloat(matches[1]), parseFloat(matches[2])];

    const nums = dim.match(/([\d.]+)/g);
    if (nums && nums.length >= 2) return [parseFloat(nums[0]), parseFloat(nums[1])];
    return null;
}

/** Parse ceiling-height strings */
function parseCeilingHeight(str: string | null): number | null {
    if (!str) return null;
    const numMatch = str.match(/([\d.]+)/);
    if (numMatch) return parseFloat(numMatch[1]);
    if (/vaulted|cathedral/i.test(str)) return 17;
    return null;
}

// ── Core generation ────────────────────────────────────────────────

export function generateBuildingModel(analysis: PlanAnalysisResult): BuildingModel {
    const stories = analysis.stories ?? 1;
    const totalSqFt = analysis.squareFootage ?? 2000;
    const style = analysis.architecturalStyle ?? 'modern_farmhouse';
    const roofType = analysis.roofType ?? 'gable';
    const isPNW = analysis.regionalStyle?.isPNW ?? false;
    const overhang = isPNW ? PNW_OVERHANG : DEFAULT_OVERHANG;
    const pitch = STYLE_PITCH[style] ?? 6 / 12;

    // Compute footprint from total sqft
    const footprintSqFt = totalSqFt / Math.max(stories, 1);
    const aspectRatio = 1.5; // wider than deep
    const footprintDepth = Math.sqrt(footprintSqFt / aspectRatio);
    const footprintWidth = footprintSqFt / footprintDepth;

    const heights = STORY_HEIGHTS[Math.min(stories, 3)] ?? STORY_HEIGHTS[1]!;

    // ── Build room layout (packing algorithm) ──────────────────
    const roomsByFloor = distributeRooms(analysis.rooms, stories, footprintWidth, footprintDepth);
    const hasGarage = analysis.specialFeatures.some(f => /garage/i.test(f));

    // ── Generate geometry ──────────────────────────────────────
    const walls: WallSegment[] = [];
    const floors: FloorSlab[] = [];

    for (let floor = 0; floor < stories; floor++) {
        const y = heights.slice(0, floor).reduce((a, b) => a + b, 0);
        const h = heights[floor] ?? 9;

        // Check for vaulted rooms
        const vaultedRoom = roomsByFloor[floor]?.find(r =>
            /vaulted|cathedral/i.test(r.room.ceilingHeight || '')
        );

        // 1. Floor slab
        const floorWidth = floor === 0 && hasGarage ? footprintWidth + 25 : footprintWidth;
        floors.push({
            id: `floor-${floor}`,
            vertices: [
                [0, 0],
                [floorWidth, 0],
                [floorWidth, footprintDepth],
                [0, footprintDepth],
            ],
            elevation: y,
            thickness: floor === 0 ? FLOOR_SLAB_THICKNESS : FLOOR_SLAB_THICKNESS,
        });

        // 2. Exterior walls
        const extWalls = generateExteriorWalls(
            floor, floorWidth, footprintDepth, h, y, style
        );
        walls.push(...extWalls);

        // 3. Interior walls from room layout
        const intWalls = generateInteriorWalls(
            roomsByFloor[floor] || [], floor, h, y
        );
        walls.push(...intWalls);
    }

    // ── Foundation ─────────────────────────────────────────────
    const foundationWidth = hasGarage ? footprintWidth + 25 : footprintWidth;
    floors.push({
        id: 'foundation',
        vertices: [
            [-0.25, -0.25],
            [foundationWidth + 0.25, -0.25],
            [foundationWidth + 0.25, footprintDepth + 0.25],
            [-0.25, footprintDepth + 0.25],
        ],
        elevation: -FOUNDATION_DEPTH,
        thickness: FOUNDATION_THICKNESS,
    });

    // ── Roof ──────────────────────────────────────────────────
    const totalHeight = heights.reduce((a, b) => a + b, 0);
    const roofPlanes = generateRoof(
        roofType, footprintWidth, footprintDepth, totalHeight, pitch, overhang
    );

    // ── Site Elements ─────────────────────────────────────────
    const siteElements = generateSiteElements(
        analysis, footprintWidth, footprintDepth, hasGarage
    );

    const maxHeight = totalHeight + (footprintDepth / 2) * pitch;

    return {
        walls,
        floors,
        roofPlanes,
        siteElements,
        boundingBox: {
            width: hasGarage ? footprintWidth + 25 : footprintWidth,
            depth: footprintDepth,
            height: maxHeight,
        },
        metadata: {
            style,
            stories,
            totalSqFt,
        },
    };
}

// ── Room distribution ──────────────────────────────────────────────
interface PlacedRoom {
    room: RoomAnalysis;
    x: number;
    z: number;
    w: number;
    d: number;
}

function distributeRooms(
    rooms: RoomAnalysis[],
    stories: number,
    buildingW: number,
    buildingD: number,
): PlacedRoom[][] {
    const result: PlacedRoom[][] = [];

    // Simple heuristic: bedrooms go upstairs, living areas on main
    const livingRooms = rooms.filter(r =>
        /kitchen|great|living|dining|entry|foyer|mudroom|pantry|laundry|garage|office|den/i.test(r.name)
    );
    const bedRooms = rooms.filter(r =>
        /bed|master|primary|bonus|media|loft/i.test(r.name)
    );
    const others = rooms.filter(r =>
        !livingRooms.includes(r) && !bedRooms.includes(r)
    );

    const firstFloorRooms = stories > 1
        ? [...livingRooms, ...others]
        : [...livingRooms, ...bedRooms, ...others];
    const secondFloorRooms = stories > 1 ? bedRooms : [];

    result.push(packRooms(firstFloorRooms, buildingW, buildingD));
    if (stories > 1) {
        result.push(packRooms(secondFloorRooms, buildingW, buildingD));
    }

    return result;
}

function packRooms(rooms: RoomAnalysis[], maxW: number, maxD: number): PlacedRoom[] {
    const placed: PlacedRoom[] = [];
    let cursorX = EXTERIOR_WALL_THICKNESS;
    let cursorZ = EXTERIOR_WALL_THICKNESS;
    let rowMaxD = 0;

    for (const room of rooms) {
        const dim = parseDimensions(room.dimensions);
        const w = dim ? dim[0] : 12;
        const d = dim ? dim[1] : 10;

        // Wrap to next row if we exceed building width
        if (cursorX + w + EXTERIOR_WALL_THICKNESS > maxW) {
            cursorX = EXTERIOR_WALL_THICKNESS;
            cursorZ += rowMaxD + INTERIOR_WALL_THICKNESS;
            rowMaxD = 0;
        }

        // Skip if we exceed building depth
        if (cursorZ + d > maxD - EXTERIOR_WALL_THICKNESS) {
            continue;
        }

        placed.push({ room, x: cursorX, z: cursorZ, w, d });
        cursorX += w + INTERIOR_WALL_THICKNESS;
        rowMaxD = Math.max(rowMaxD, d);
    }

    return placed;
}

// ── Exterior walls ─────────────────────────────────────────────────

function generateExteriorWalls(
    floor: number,
    width: number,
    depth: number,
    height: number,
    elevation: number,
    style: ArchitecturalStyle,
): WallSegment[] {
    const t = EXTERIOR_WALL_THICKNESS;
    const walls: WallSegment[] = [];

    // Window styling by architecture
    const windowH = style === 'modern' || style === 'contemporary' ? 6 : 4;
    const windowW = style === 'modern' ? 5 : 3;
    const windowSill = style === 'modern' ? 1 : 3;

    // Front wall (south) — main entry on ground floor
    const frontOpenings: WallOpening[] = [];
    if (floor === 0) {
        frontOpenings.push({
            type: 'door',
            position: 0.4,
            width: 3,
            height: 6.67,
            sillHeight: 0,
        });
    }
    // Windows
    const windowCount = Math.max(2, Math.floor(width / 12));
    for (let i = 0; i < windowCount; i++) {
        const pos = (i + 1) / (windowCount + 1);
        if (Math.abs(pos - 0.4) > 0.08) { // avoid door overlap
            frontOpenings.push({
                type: 'window',
                position: pos,
                width: windowW,
                height: windowH,
                sillHeight: windowSill,
            });
        }
    }

    walls.push({
        id: `ext-front-f${floor}`,
        start: [0, 0],
        end: [width, 0],
        height,
        thickness: t,
        isExterior: true,
        floor,
        openings: frontOpenings,
    });

    // Back wall (north)
    const backWindows: WallOpening[] = [];
    const backWindowCount = Math.max(2, Math.floor(width / 10));
    for (let i = 0; i < backWindowCount; i++) {
        backWindows.push({
            type: 'window',
            position: (i + 1) / (backWindowCount + 1),
            width: style === 'modern' ? 6 : windowW,
            height: style === 'modern' ? 7 : windowH,
            sillHeight: style === 'modern' ? 0.5 : windowSill,
        });
    }
    // Sliding door on ground floor
    if (floor === 0) {
        backWindows.push({
            type: 'door',
            position: 0.55,
            width: style === 'modern' ? 12 : 6,
            height: 6.67,
            sillHeight: 0,
        });
    }

    walls.push({
        id: `ext-back-f${floor}`,
        start: [width, depth],
        end: [0, depth],
        height,
        thickness: t,
        isExterior: true,
        floor,
        openings: backWindows,
    });

    // Left wall (west)
    const sideWindows: WallOpening[] = [];
    const sideWindowCount = Math.max(1, Math.floor(depth / 14));
    for (let i = 0; i < sideWindowCount; i++) {
        sideWindows.push({
            type: 'window',
            position: (i + 1) / (sideWindowCount + 1),
            width: windowW,
            height: windowH,
            sillHeight: windowSill,
        });
    }

    walls.push({
        id: `ext-left-f${floor}`,
        start: [0, depth],
        end: [0, 0],
        height,
        thickness: t,
        isExterior: true,
        floor,
        openings: sideWindows,
    });

    // Right wall (east)
    walls.push({
        id: `ext-right-f${floor}`,
        start: [width, 0],
        end: [width, depth],
        height,
        thickness: t,
        isExterior: true,
        floor,
        openings: [...sideWindows],
    });

    return walls;
}

// ── Interior walls ─────────────────────────────────────────────────

function generateInteriorWalls(
    placedRooms: PlacedRoom[],
    floor: number,
    height: number,
    _elevation: number,
): WallSegment[] {
    const walls: WallSegment[] = [];
    const t = INTERIOR_WALL_THICKNESS;

    for (let i = 0; i < placedRooms.length; i++) {
        const r = placedRooms[i];

        // Right wall of each room (creates partition with neighbor)
        const rightX = r.x + r.w;
        walls.push({
            id: `int-${floor}-${i}-right`,
            start: [rightX, r.z],
            end: [rightX, r.z + r.d],
            height: parseCeilingHeight(r.room.ceilingHeight) ?? height,
            thickness: t,
            isExterior: false,
            floor,
            openings: [{
                type: 'door',
                position: 0.5,
                width: 2.67,
                height: 6.67,
                sillHeight: 0,
            }],
        });

        // Bottom wall of each room
        if (r.z > EXTERIOR_WALL_THICKNESS + 1) {
            walls.push({
                id: `int-${floor}-${i}-bottom`,
                start: [r.x, r.z],
                end: [r.x + r.w, r.z],
                height: parseCeilingHeight(r.room.ceilingHeight) ?? height,
                thickness: t,
                isExterior: false,
                floor,
                openings: [],
            });
        }
    }

    return walls;
}

// ── Roof generation ────────────────────────────────────────────────

function generateRoof(
    roofType: RoofType,
    width: number,
    depth: number,
    baseHeight: number,
    pitch: number,
    overhang: number,
): RoofPlane[] {
    const oh = overhang;
    const ridgeHeight = (depth / 2) * pitch;

    switch (roofType) {
        case 'gable':
            return [
                // Front slope
                {
                    id: 'roof-front',
                    vertices: [
                        [-oh, baseHeight, -oh],
                        [width + oh, baseHeight, -oh],
                        [width + oh, baseHeight + ridgeHeight, depth / 2],
                        [-oh, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
                // Back slope
                {
                    id: 'roof-back',
                    vertices: [
                        [width + oh, baseHeight, depth + oh],
                        [-oh, baseHeight, depth + oh],
                        [-oh, baseHeight + ridgeHeight, depth / 2],
                        [width + oh, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
            ];

        case 'hip': {
            const ridgeInset = width * 0.25;
            return [
                // Front slope
                {
                    id: 'roof-hip-front',
                    vertices: [
                        [-oh, baseHeight, -oh],
                        [width + oh, baseHeight, -oh],
                        [width - ridgeInset, baseHeight + ridgeHeight, depth / 2],
                        [ridgeInset, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
                // Back slope
                {
                    id: 'roof-hip-back',
                    vertices: [
                        [width + oh, baseHeight, depth + oh],
                        [-oh, baseHeight, depth + oh],
                        [ridgeInset, baseHeight + ridgeHeight, depth / 2],
                        [width - ridgeInset, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
                // Left hip
                {
                    id: 'roof-hip-left',
                    vertices: [
                        [-oh, baseHeight, depth + oh],
                        [-oh, baseHeight, -oh],
                        [ridgeInset, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
                // Right hip
                {
                    id: 'roof-hip-right',
                    vertices: [
                        [width + oh, baseHeight, -oh],
                        [width + oh, baseHeight, depth + oh],
                        [width - ridgeInset, baseHeight + ridgeHeight, depth / 2],
                    ],
                    overhang: oh,
                },
            ];
        }

        case 'flat':
            return [{
                id: 'roof-flat',
                vertices: [
                    [-oh, baseHeight + 0.5, -oh],
                    [width + oh, baseHeight + 0.5, -oh],
                    [width + oh, baseHeight + 0.5, depth + oh],
                    [-oh, baseHeight + 0.5, depth + oh],
                ],
                overhang: oh,
            }];

        case 'shed':
            return [{
                id: 'roof-shed',
                vertices: [
                    [-oh, baseHeight + ridgeHeight, -oh],
                    [width + oh, baseHeight + ridgeHeight, -oh],
                    [width + oh, baseHeight, depth + oh],
                    [-oh, baseHeight, depth + oh],
                ],
                overhang: oh,
            }];

        case 'gambrel': {
            const midH = ridgeHeight * 0.6;
            const midD = depth * 0.2;
            return [
                // Front lower
                { id: 'roof-gambrel-fl', vertices: [[-oh, baseHeight, -oh], [width + oh, baseHeight, -oh], [width + oh, baseHeight + midH, midD], [-oh, baseHeight + midH, midD]], overhang: oh },
                // Front upper
                { id: 'roof-gambrel-fu', vertices: [[-oh, baseHeight + midH, midD], [width + oh, baseHeight + midH, midD], [width + oh, baseHeight + ridgeHeight, depth / 2], [-oh, baseHeight + ridgeHeight, depth / 2]], overhang: oh },
                // Back lower
                { id: 'roof-gambrel-bl', vertices: [[width + oh, baseHeight, depth + oh], [-oh, baseHeight, depth + oh], [-oh, baseHeight + midH, depth - midD], [width + oh, baseHeight + midH, depth - midD]], overhang: oh },
                // Back upper
                { id: 'roof-gambrel-bu', vertices: [[width + oh, baseHeight + midH, depth - midD], [-oh, baseHeight + midH, depth - midD], [-oh, baseHeight + ridgeHeight, depth / 2], [width + oh, baseHeight + ridgeHeight, depth / 2]], overhang: oh },
            ];
        }

        case 'mansard': {
            const stpH = ridgeHeight * 0.7;
            const inset = depth * 0.15;
            return [
                { id: 'roof-mansard-f', vertices: [[-oh, baseHeight, -oh], [width + oh, baseHeight, -oh], [width + oh - inset, baseHeight + stpH, inset], [-oh + inset, baseHeight + stpH, inset]], overhang: oh },
                { id: 'roof-mansard-b', vertices: [[width + oh, baseHeight, depth + oh], [-oh, baseHeight, depth + oh], [-oh + inset, baseHeight + stpH, depth - inset], [width + oh - inset, baseHeight + stpH, depth - inset]], overhang: oh },
                { id: 'roof-mansard-top', vertices: [[-oh + inset, baseHeight + stpH, inset], [width + oh - inset, baseHeight + stpH, inset], [width + oh - inset, baseHeight + stpH, depth - inset], [-oh + inset, baseHeight + stpH, depth - inset]], overhang: 0 },
            ];
        }

        default:
            return generateRoof('gable', width, depth, baseHeight, pitch, overhang);
    }
}

// ── Site elements ──────────────────────────────────────────────────

function generateSiteElements(
    analysis: PlanAnalysisResult,
    buildingW: number,
    buildingD: number,
    hasGarage: boolean,
): SiteElement[] {
    const elements: SiteElement[] = [];

    // Property boundary (standard lot)
    const lotW = Math.max(buildingW + 30, 50);
    const lotD = Math.max(buildingD + 40, 100);
    const offsetX = (lotW - buildingW) / 2;
    const offsetZ = 15; // front setback

    elements.push({
        type: 'property_line',
        vertices: [
            [-offsetX, -offsetZ],
            [lotW - offsetX, -offsetZ],
            [lotW - offsetX, lotD - offsetZ],
            [-offsetX, lotD - offsetZ],
        ],
    });

    // Front walkway
    elements.push({
        type: 'walkway',
        vertices: [
            [buildingW * 0.38, 0],
            [buildingW * 0.42, 0],
            [buildingW * 0.42, -offsetZ],
            [buildingW * 0.38, -offsetZ],
        ],
    });

    // Driveway (if garage)
    if (hasGarage) {
        elements.push({
            type: 'driveway',
            vertices: [
                [buildingW + 2, 0],
                [buildingW + 22, 0],
                [buildingW + 22, -offsetZ - 5],
                [buildingW + 2, -offsetZ - 5],
            ],
        });
    }

    // Rear deck/patio
    const hasDeck = analysis.specialFeatures.some(f => /deck|patio/i.test(f));
    if (hasDeck) {
        elements.push({
            type: 'deck',
            vertices: [
                [buildingW * 0.2, buildingD],
                [buildingW * 0.8, buildingD],
                [buildingW * 0.8, buildingD + 14],
                [buildingW * 0.2, buildingD + 14],
            ],
        });
    }

    // Front porch
    const hasPorch = analysis.specialFeatures.some(f => /porch/i.test(f));
    if (hasPorch) {
        elements.push({
            type: 'patio',
            vertices: [
                [buildingW * 0.15, -6],
                [buildingW * 0.85, -6],
                [buildingW * 0.85, 0],
                [buildingW * 0.15, 0],
            ],
        });
    }

    return elements;
}
