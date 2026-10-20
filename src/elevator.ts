import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  MaterialTransparencyMode,
  TextShape,
  Billboard,
  BillboardMode,
  pointerEventsSystem,
  InputAction
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'

export function createElevator() {
  // ---------------------------------------------------------------------------
  // Luxury Architectural Materials
  // ---------------------------------------------------------------------------
  const bronzeAccent = {
    albedoColor: Color4.create(0.85, 0.65, 0.28, 1),
    metallic: 0.95,
    roughness: 0.16
  }

  const darkBronze = {
    albedoColor: Color4.create(0.32, 0.22, 0.14, 1),
    metallic: 0.88,
    roughness: 0.24
  }

  const smokedGlass = {
    albedoColor: Color4.create(0.10, 0.16, 0.22, 0.55),
    metallic: 0.30,
    roughness: 0.04,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    emissiveColor: Color3.create(0.04, 0.08, 0.12),
    emissiveIntensity: 0.15
  }

  const travertineMarble = {
    albedoColor: Color4.create(0.92, 0.90, 0.86, 1),
    metallic: 0.05,
    roughness: 0.20
  }

  const warmLedGlow = {
    albedoColor: Color4.create(1.0, 0.88, 0.65, 1),
    emissiveColor: Color3.create(1.0, 0.86, 0.60),
    emissiveIntensity: 6.0
  }

  const buttonActiveGlow = {
    albedoColor: Color4.create(0.3, 0.9, 1.0, 1),
    emissiveColor: Color3.create(0.3, 0.9, 1.0),
    emissiveIntensity: 6.0
  }

  // ---------------------------------------------------------------------------
  // Coordinates & Parameters
  // ---------------------------------------------------------------------------
  // Suite 1 doorway (Lower level): X ≈ 51.3, Z ≈ 9.48, Floor Y = 2.80
  // Suite 2 doorway (Upper level): X ≈ 52.3, Z ≈ 11.25, Floor Y = 6.90
  const ELEV_CENTER_X = 55.2
  const ELEV_CENTER_Z = 10.35
  const FLOOR_1_Y = 2.80
  const FLOOR_2_Y = 6.90
  const TRAVEL_TIME = 3.5

  let currentY = FLOOR_1_Y
  let startY = FLOOR_1_Y
  let targetY = FLOOR_1_Y
  let isMoving = false
  let moveElapsed = 0

  // ---------------------------------------------------------------------------
  // 1. Static Hoistway & Structural Tower Frame
  // ---------------------------------------------------------------------------
  const TOWER_BASE_Y = 2.5
  const TOWER_TOP_Y = 11.2
  const TOWER_HEIGHT = TOWER_TOP_Y - TOWER_BASE_Y // 8.7m
  const TOWER_MID_Y = (TOWER_BASE_Y + TOWER_TOP_Y) * 0.5 // 6.85m

  const COL_X_OFF = 1.2
  const COL_Z_OFF = 1.3

  // 4 Corner Structural Bronze Columns
  const columnPositions = [
    Vector3.create(ELEV_CENTER_X - COL_X_OFF, TOWER_MID_Y, ELEV_CENTER_Z - COL_Z_OFF),
    Vector3.create(ELEV_CENTER_X - COL_X_OFF, TOWER_MID_Y, ELEV_CENTER_Z + COL_Z_OFF),
    Vector3.create(ELEV_CENTER_X + COL_X_OFF, TOWER_MID_Y, ELEV_CENTER_Z - COL_Z_OFF),
    Vector3.create(ELEV_CENTER_X + COL_X_OFF, TOWER_MID_Y, ELEV_CENTER_Z + COL_Z_OFF)
  ]

  columnPositions.forEach((pos) => {
    const col = engine.addEntity()
    Transform.create(col, {
      position: pos,
      scale: Vector3.create(0.14, TOWER_HEIGHT, 0.14)
    })
    MeshRenderer.setBox(col)
    MeshCollider.setBox(col)
    Material.setPbrMaterial(col, bronzeAccent)
  })

  // Tower Top Crown Cap
  const crown = engine.addEntity()
  Transform.create(crown, {
    position: Vector3.create(ELEV_CENTER_X, TOWER_TOP_Y + 0.15, ELEV_CENTER_Z),
    scale: Vector3.create(COL_X_OFF * 2 + 0.35, 0.3, COL_Z_OFF * 2 + 0.35)
  })
  MeshRenderer.setBox(crown)
  MeshCollider.setBox(crown)
  Material.setPbrMaterial(crown, darkBronze)

  // Tower Base Foundation Plinth
  const plinth = engine.addEntity()
  Transform.create(plinth, {
    position: Vector3.create(ELEV_CENTER_X, TOWER_BASE_Y + 0.1, ELEV_CENTER_Z),
    scale: Vector3.create(COL_X_OFF * 2 + 0.35, 0.2, COL_Z_OFF * 2 + 0.35)
  })
  MeshRenderer.setBox(plinth)
  MeshCollider.setBox(plinth)
  Material.setPbrMaterial(plinth, travertineMarble)

  // Outer Tower Glass Enclosure (East Panoramic Rear Wall)
  const towerEastGlass = engine.addEntity()
  Transform.create(towerEastGlass, {
    position: Vector3.create(ELEV_CENTER_X + COL_X_OFF, TOWER_MID_Y, ELEV_CENTER_Z),
    scale: Vector3.create(0.04, TOWER_HEIGHT - 0.2, COL_Z_OFF * 2)
  })
  MeshRenderer.setBox(towerEastGlass)
  Material.setPbrMaterial(towerEastGlass, smokedGlass)

  // Outer Tower Glass Enclosure (North Panoramic Wall)
  const towerNorthGlass = engine.addEntity()
  Transform.create(towerNorthGlass, {
    position: Vector3.create(ELEV_CENTER_X, TOWER_MID_Y, ELEV_CENTER_Z + COL_Z_OFF),
    scale: Vector3.create(COL_X_OFF * 2, TOWER_HEIGHT - 0.2, 0.04)
  })
  MeshRenderer.setBox(towerNorthGlass)
  Material.setPbrMaterial(towerNorthGlass, smokedGlass)

  // Outer Tower Glass Enclosure (South Panoramic Wall)
  const towerSouthGlass = engine.addEntity()
  Transform.create(towerSouthGlass, {
    position: Vector3.create(ELEV_CENTER_X, TOWER_MID_Y, ELEV_CENTER_Z - COL_Z_OFF),
    scale: Vector3.create(COL_X_OFF * 2, TOWER_HEIGHT - 0.2, 0.04)
  })
  MeshRenderer.setBox(towerSouthGlass)
  Material.setPbrMaterial(towerSouthGlass, smokedGlass)

  // ---------------------------------------------------------------------------
  // 2. Walkway Bridges (West Side: Connecting Villa Doorways to Elevator)
  // ---------------------------------------------------------------------------
  // Level 1 Terrace Walkway: connects Suite 1 doorway (X: 51.3, Z: 9.48) to Elevator (X: 54.0, Z: 10.35)
  const bridge1 = engine.addEntity()
  Transform.create(bridge1, {
    position: Vector3.create(52.65, FLOOR_1_Y - 0.075, 10.2),
    scale: Vector3.create(2.7, 0.15, 3.2)
  })
  MeshRenderer.setBox(bridge1)
  MeshCollider.setBox(bridge1)
  Material.setPbrMaterial(bridge1, travertineMarble)

  // Level 1 Perimeter Bronze Trim
  const bridge1Trim = engine.addEntity()
  Transform.create(bridge1Trim, {
    position: Vector3.create(52.65, FLOOR_1_Y - 0.075, 10.2),
    scale: Vector3.create(2.75, 0.18, 3.25)
  })
  MeshRenderer.setBox(bridge1Trim)
  Material.setPbrMaterial(bridge1Trim, bronzeAccent)

  // Level 2 SkyBridge: connects Suite 2 doorway (X: 52.3, Z: 11.25) to Elevator (X: 54.0, Z: 10.35)
  const bridge2 = engine.addEntity()
  Transform.create(bridge2, {
    position: Vector3.create(53.15, FLOOR_2_Y - 0.075, 10.8),
    scale: Vector3.create(2.1, 0.15, 2.8)
  })
  MeshRenderer.setBox(bridge2)
  MeshCollider.setBox(bridge2)
  Material.setPbrMaterial(bridge2, travertineMarble)

  // Level 2 SkyBridge Balustrades & Bronze Handrails
  // North side railing
  const b2RailNorth = engine.addEntity()
  Transform.create(b2RailNorth, {
    position: Vector3.create(53.15, FLOOR_2_Y + 0.52, 10.8 + 1.4),
    scale: Vector3.create(2.1, 0.95, 0.05)
  })
  MeshRenderer.setBox(b2RailNorth)
  MeshCollider.setBox(b2RailNorth)
  Material.setPbrMaterial(b2RailNorth, smokedGlass)

  const b2TopRailNorth = engine.addEntity()
  Transform.create(b2TopRailNorth, {
    position: Vector3.create(53.15, FLOOR_2_Y + 1.02, 10.8 + 1.4),
    scale: Vector3.create(2.15, 0.06, 0.08)
  })
  MeshRenderer.setBox(b2TopRailNorth)
  Material.setPbrMaterial(b2TopRailNorth, bronzeAccent)

  // South side railing
  const b2RailSouth = engine.addEntity()
  Transform.create(b2RailSouth, {
    position: Vector3.create(53.15, FLOOR_2_Y + 0.52, 10.8 - 1.4),
    scale: Vector3.create(2.1, 0.95, 0.05)
  })
  MeshRenderer.setBox(b2RailSouth)
  MeshCollider.setBox(b2RailSouth)
  Material.setPbrMaterial(b2RailSouth, smokedGlass)

  const b2TopRailSouth = engine.addEntity()
  Transform.create(b2TopRailSouth, {
    position: Vector3.create(53.15, FLOOR_2_Y + 1.02, 10.8 - 1.4),
    scale: Vector3.create(2.15, 0.06, 0.08)
  })
  MeshRenderer.setBox(b2TopRailSouth)
  Material.setPbrMaterial(b2TopRailSouth, bronzeAccent)

  // ---------------------------------------------------------------------------
  // 3. Floating Architectural Signs (Elevated high above head height)
  // ---------------------------------------------------------------------------
  const signLevel1 = engine.addEntity()
  Transform.create(signLevel1, {
    position: Vector3.create(52.65, FLOOR_1_Y + 3.3, 10.2)
  })
  TextShape.create(signLevel1, {
    text: '✦ SUITE 1 ELEVATOR ✦\n[ ACCESS TO SUITE 2 UPPER PENTHOUSE ]',
    fontSize: 1.8,
    textColor: Color4.create(1.0, 0.88, 0.55, 1)
  })
  Billboard.create(signLevel1, { billboardMode: BillboardMode.BM_Y })

  const signLevel2 = engine.addEntity()
  Transform.create(signLevel2, {
    position: Vector3.create(53.15, FLOOR_2_Y + 3.3, 10.8)
  })
  TextShape.create(signLevel2, {
    text: '✦ SUITE 2 ELEVATOR ✦\n[ ACCESS TO SUITE 1 LOWER LOUNGE ]',
    fontSize: 1.8,
    textColor: Color4.create(1.0, 0.88, 0.55, 1)
  })
  Billboard.create(signLevel2, { billboardMode: BillboardMode.BM_Y })

  // ---------------------------------------------------------------------------
  // 4. Moving Elevator Cabin Entities
  // ---------------------------------------------------------------------------
  const CABIN_WIDTH = 2.15
  const CABIN_DEPTH = 2.35
  const CABIN_HEIGHT = 2.85

  // Moving Cabin Parent Anchor Entity
  const cabinAnchor = engine.addEntity()
  Transform.create(cabinAnchor, {
    position: Vector3.create(ELEV_CENTER_X, currentY, ELEV_CENTER_Z)
  })

  // Cabin Walkable Floor Slab
  const cabinFloor = engine.addEntity()
  Transform.create(cabinFloor, {
    parent: cabinAnchor,
    position: Vector3.create(0, -0.075, 0),
    scale: Vector3.create(CABIN_WIDTH, 0.15, CABIN_DEPTH)
  })
  MeshRenderer.setBox(cabinFloor)
  MeshCollider.setBox(cabinFloor)
  Material.setPbrMaterial(cabinFloor, travertineMarble)

  // Cabin Floor Bronze Border
  const cabinFloorTrim = engine.addEntity()
  Transform.create(cabinFloorTrim, {
    parent: cabinAnchor,
    position: Vector3.create(0, -0.08, 0),
    scale: Vector3.create(CABIN_WIDTH + 0.06, 0.16, CABIN_DEPTH + 0.06)
  })
  MeshRenderer.setBox(cabinFloorTrim)
  Material.setPbrMaterial(cabinFloorTrim, bronzeAccent)

  // Cabin Ceiling Slab
  const cabinCeiling = engine.addEntity()
  Transform.create(cabinCeiling, {
    parent: cabinAnchor,
    position: Vector3.create(0, CABIN_HEIGHT + 0.075, 0),
    scale: Vector3.create(CABIN_WIDTH + 0.06, 0.15, CABIN_DEPTH + 0.06)
  })
  MeshRenderer.setBox(cabinCeiling)
  MeshCollider.setBox(cabinCeiling)
  Material.setPbrMaterial(cabinCeiling, darkBronze)

  // Recessed Warm LED Ceiling Light
  const cabinLight = engine.addEntity()
  Transform.create(cabinLight, {
    parent: cabinAnchor,
    position: Vector3.create(0, CABIN_HEIGHT - 0.01, 0),
    scale: Vector3.create(CABIN_WIDTH * 0.7, 0.02, CABIN_DEPTH * 0.7)
  })
  MeshRenderer.setBox(cabinLight)
  Material.setPbrMaterial(cabinLight, warmLedGlow)

  // East Panoramic Glass Wall (Rear of Cabin)
  const cabinEastGlass = engine.addEntity()
  Transform.create(cabinEastGlass, {
    parent: cabinAnchor,
    position: Vector3.create(CABIN_WIDTH * 0.5 - 0.02, CABIN_HEIGHT * 0.5, 0),
    scale: Vector3.create(0.04, CABIN_HEIGHT - 0.02, CABIN_DEPTH - 0.1)
  })
  MeshRenderer.setBox(cabinEastGlass)
  MeshCollider.setBox(cabinEastGlass)
  Material.setPbrMaterial(cabinEastGlass, smokedGlass)

  // North Glass Wall
  const cabinNorthGlass = engine.addEntity()
  Transform.create(cabinNorthGlass, {
    parent: cabinAnchor,
    position: Vector3.create(0, CABIN_HEIGHT * 0.5, CABIN_DEPTH * 0.5 - 0.02),
    scale: Vector3.create(CABIN_WIDTH - 0.1, CABIN_HEIGHT - 0.02, 0.04)
  })
  MeshRenderer.setBox(cabinNorthGlass)
  MeshCollider.setBox(cabinNorthGlass)
  Material.setPbrMaterial(cabinNorthGlass, smokedGlass)

  // South Glass Wall
  const cabinSouthGlass = engine.addEntity()
  Transform.create(cabinSouthGlass, {
    parent: cabinAnchor,
    position: Vector3.create(0, CABIN_HEIGHT * 0.5, -CABIN_DEPTH * 0.5 + 0.02),
    scale: Vector3.create(CABIN_WIDTH - 0.1, CABIN_HEIGHT - 0.02, 0.04)
  })
  MeshRenderer.setBox(cabinSouthGlass)
  MeshCollider.setBox(cabinSouthGlass)
  Material.setPbrMaterial(cabinSouthGlass, smokedGlass)

  // West Entrance Portal Jambs (Facing walkway, 1.6m clear walk-through opening)
  const jambNorth = engine.addEntity()
  Transform.create(jambNorth, {
    parent: cabinAnchor,
    position: Vector3.create(-CABIN_WIDTH * 0.5 + 0.05, CABIN_HEIGHT * 0.5, 0.95),
    scale: Vector3.create(0.1, CABIN_HEIGHT, 0.35)
  })
  MeshRenderer.setBox(jambNorth)
  MeshCollider.setBox(jambNorth)
  Material.setPbrMaterial(jambNorth, bronzeAccent)

  const jambSouth = engine.addEntity()
  Transform.create(jambSouth, {
    parent: cabinAnchor,
    position: Vector3.create(-CABIN_WIDTH * 0.5 + 0.05, CABIN_HEIGHT * 0.5, -0.95),
    scale: Vector3.create(0.1, CABIN_HEIGHT, 0.35)
  })
  MeshRenderer.setBox(jambSouth)
  MeshCollider.setBox(jambSouth)
  Material.setPbrMaterial(jambSouth, bronzeAccent)

  // ---------------------------------------------------------------------------
  // 5. Interior Elevator Control Console
  // ---------------------------------------------------------------------------
  const panelColumn = engine.addEntity()
  Transform.create(panelColumn, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.35, -CABIN_DEPTH * 0.5 + 0.08),
    scale: Vector3.create(0.35, 1.2, 0.08)
  })
  MeshRenderer.setBox(panelColumn)
  Material.setPbrMaterial(panelColumn, darkBronze)

  // Digital Status Screen
  const statusScreen = engine.addEntity()
  Transform.create(statusScreen, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.82, -CABIN_DEPTH * 0.5 + 0.13)
  })
  TextShape.create(statusScreen, {
    text: 'FLOOR 1',
    fontSize: 2.2,
    textColor: Color4.create(0.3, 0.9, 1.0, 1)
  })

  // Button: Floor 2 (Penthouse)
  const btn2 = engine.addEntity()
  Transform.create(btn2, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.48, -CABIN_DEPTH * 0.5 + 0.13),
    scale: Vector3.create(0.24, 0.16, 0.04)
  })
  MeshRenderer.setBox(btn2)
  MeshCollider.setBox(btn2)
  Material.setPbrMaterial(btn2, bronzeAccent)

  const btn2Text = engine.addEntity()
  Transform.create(btn2Text, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.48, -CABIN_DEPTH * 0.5 + 0.16)
  })
  TextShape.create(btn2Text, {
    text: '▲ 2',
    fontSize: 2.0,
    textColor: Color4.create(1, 1, 1, 1)
  })

  // Button: Floor 1 (Lounge)
  const btn1 = engine.addEntity()
  Transform.create(btn1, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.18, -CABIN_DEPTH * 0.5 + 0.13),
    scale: Vector3.create(0.24, 0.16, 0.04)
  })
  MeshRenderer.setBox(btn1)
  MeshCollider.setBox(btn1)
  Material.setPbrMaterial(btn1, bronzeAccent)

  const btn1Text = engine.addEntity()
  Transform.create(btn1Text, {
    parent: cabinAnchor,
    position: Vector3.create(0.2, 1.18, -CABIN_DEPTH * 0.5 + 0.16)
  })
  TextShape.create(btn1Text, {
    text: '▼ 1',
    fontSize: 2.0,
    textColor: Color4.create(1, 1, 1, 1)
  })

  // ---------------------------------------------------------------------------
  // 6. External Call Pedestals (Neatly placed beside walkways)
  // ---------------------------------------------------------------------------
  // Floor 1 Call Pedestal (placed neatly at south edge of terrace, leaving walkway open)
  const callPedestal1 = engine.addEntity()
  Transform.create(callPedestal1, {
    position: Vector3.create(53.2, FLOOR_1_Y + 0.6, 8.4),
    scale: Vector3.create(0.22, 1.2, 0.22)
  })
  MeshRenderer.setBox(callPedestal1)
  MeshCollider.setBox(callPedestal1)
  Material.setPbrMaterial(callPedestal1, darkBronze)

  const callBtn1 = engine.addEntity()
  Transform.create(callBtn1, {
    position: Vector3.create(53.2, FLOOR_1_Y + 1.05, 8.52),
    scale: Vector3.create(0.18, 0.18, 0.06)
  })
  MeshRenderer.setBox(callBtn1)
  MeshCollider.setBox(callBtn1)
  Material.setPbrMaterial(callBtn1, bronzeAccent)

  const callBtn1Label = engine.addEntity()
  Transform.create(callBtn1Label, {
    position: Vector3.create(53.2, FLOOR_1_Y + 1.4, 8.4)
  })
  TextShape.create(callBtn1Label, {
    text: '[ CALL ELEVATOR ▲ ]',
    fontSize: 1.5,
    textColor: Color4.create(1.0, 0.88, 0.55, 1)
  })
  Billboard.create(callBtn1Label, { billboardMode: BillboardMode.BM_Y })

  // Floor 2 Call Pedestal (placed neatly at south edge of upper skybridge)
  const callPedestal2 = engine.addEntity()
  Transform.create(callPedestal2, {
    position: Vector3.create(53.6, FLOOR_2_Y + 0.6, 9.3),
    scale: Vector3.create(0.22, 1.2, 0.22)
  })
  MeshRenderer.setBox(callPedestal2)
  MeshCollider.setBox(callPedestal2)
  Material.setPbrMaterial(callPedestal2, darkBronze)

  const callBtn2 = engine.addEntity()
  Transform.create(callBtn2, {
    position: Vector3.create(53.6, FLOOR_2_Y + 1.05, 9.42),
    scale: Vector3.create(0.18, 0.18, 0.06)
  })
  MeshRenderer.setBox(callBtn2)
  MeshCollider.setBox(callBtn2)
  Material.setPbrMaterial(callBtn2, bronzeAccent)

  const callBtn2Label = engine.addEntity()
  Transform.create(callBtn2Label, {
    position: Vector3.create(53.6, FLOOR_2_Y + 1.4, 9.3)
  })
  TextShape.create(callBtn2Label, {
    text: '[ CALL ELEVATOR ▼ ]',
    fontSize: 1.5,
    textColor: Color4.create(1.0, 0.88, 0.55, 1)
  })
  Billboard.create(callBtn2Label, { billboardMode: BillboardMode.BM_Y })

  // ---------------------------------------------------------------------------
  // 7. Elevator Movement & Player Ride Dispatcher
  // ---------------------------------------------------------------------------
  function goToFloor(floor: 1 | 2) {
    if (isMoving) return

    const destY = floor === 1 ? FLOOR_1_Y : FLOOR_2_Y
    if (Math.abs(currentY - destY) < 0.05) {
      return
    }

    startY = currentY
    targetY = destY
    isMoving = true
    moveElapsed = 0

    // Highlight button in motion
    const activeBtn = floor === 2 ? btn2 : btn1
    Material.setPbrMaterial(activeBtn, buttonActiveGlow)

    // Check if player is inside the elevator cabin
    const playerTransform = Transform.getOrNull(engine.PlayerEntity)
    if (playerTransform) {
      const p = playerTransform.position
      const dx = Math.abs(p.x - ELEV_CENTER_X)
      const dz = Math.abs(p.z - ELEV_CENTER_Z)
      const dy = Math.abs(p.y - currentY)

      if (dx < 1.3 && dz < 1.4 && dy < 3.2) {
        const playerDestY = (floor === 2 ? FLOOR_2_Y : FLOOR_1_Y) + 0.15
        void movePlayerTo({
          newRelativePosition: Vector3.create(ELEV_CENTER_X, playerDestY, ELEV_CENTER_Z),
          duration: TRAVEL_TIME
        })
      }
    }
  }

  // Hook pointer click events
  pointerEventsSystem.onPointerDown(
    {
      entity: btn2,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Go to Suite 2 (Penthouse)' }
    },
    () => goToFloor(2)
  )

  pointerEventsSystem.onPointerDown(
    {
      entity: btn1,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Go to Suite 1 (Lower Lounge)' }
    },
    () => goToFloor(1)
  )

  pointerEventsSystem.onPointerDown(
    {
      entity: callBtn1,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Call Elevator to Floor 1' }
    },
    () => goToFloor(1)
  )

  pointerEventsSystem.onPointerDown(
    {
      entity: callBtn2,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Call Elevator to Floor 2' }
    },
    () => goToFloor(2)
  )

  // Smooth Per-Frame Elevator Motion System
  engine.addSystem((dt: number) => {
    if (!isMoving) return

    moveElapsed += dt
    const t = Math.min(moveElapsed / TRAVEL_TIME, 1.0)
    // Smooth cubic easing (smoothstep: 3t^2 - 2t^3)
    const smoothT = t * t * (3 - 2 * t)

    currentY = startY + (targetY - startY) * smoothT

    // Update cabin anchor position
    const cabinTrans = Transform.getMutable(cabinAnchor)
    cabinTrans.position.y = currentY

    // Update status screen text
    const screenText = TextShape.getMutable(statusScreen)
    if (targetY > startY) {
      screenText.text = '▲ ASCENDING'
      screenText.textColor = Color4.create(0.4, 1.0, 0.6, 1)
    } else {
      screenText.text = '▼ DESCENDING'
      screenText.textColor = Color4.create(1.0, 0.8, 0.4, 1)
    }

    if (t >= 1.0) {
      isMoving = false
      currentY = targetY
      cabinTrans.position.y = currentY

      // Reset button lights
      Material.setPbrMaterial(btn1, bronzeAccent)
      Material.setPbrMaterial(btn2, bronzeAccent)

      screenText.text = targetY === FLOOR_2_Y ? 'FLOOR 2' : 'FLOOR 1'
      screenText.textColor = Color4.create(0.3, 0.9, 1.0, 1)
    }
  })
}
